import * as R from 'ramda';
import { Maybe } from './maybe';
import {
  eventNameValue,
  executeSideEffect,
  pipe,
  readValue,
  stringIsNotEmpty,
} from './utilities';
import {
  GetAllErrors,
  GetError,
  GetFieldValid,
  SetValidationState,
  Validate,
  ValidateAll,
  ValidateAllIfTrue,
  ValidateIfTrue,
  ValidateOnBlur,
  ValidateOnChange,
  ValidationSchema,
  ValidationState,
} from './types';

export {
  GetAllErrors,
  GetError,
  GetFieldValid,
  SetValidationState,
  Validate,
  ValidateAll,
  ValidateAllIfTrue,
  ValidateIfTrue,
  ValidateOnBlur,
  ValidateOnChange,
  ValidationSchema,
  ValidationState,
};

/**
 * Higher order function that takes a string and returns a function which
 * determines if a property on the validation schema is valid (true) or invalid
 * (false)
 */
export const isPropertyValid = <S>(
  property: keyof S,
): ((v: ValidationSchema<S>) => boolean) =>
  pipe(R.path([property as any, 'isValid']), R.defaultTo(true));

/** 
 * Higher order function that takes a string and returns a function which
 * determines if a property on the validation schema is valid (true) or invalid
 * (false)
 */
export function createValidationState<S>(
  validationSchema: ValidationSchema<S>,
): ValidationState {
  const buildState = (acc: ValidationState, key: keyof S) => ({
    ...acc,
    [key]: { isValid: true, errors: [] },
  });
  return pipe(R.keys, R.reduce(buildState, {}))(validationSchema);
}

export function updateProperty<S>(validationSchema: ValidationSchema<S>) {
  return R.curry((property: keyof S, value: any) => {
    function valueIsValid(validationProperty: any): boolean {
      return pipe(R.prop('validation'), R.applyTo(value))(validationProperty);
    }
    const getErrorOrNone = R.ifElse(
      valueIsValid,
      R.always(''),
      R.prop('error'),
    );
    return pipe(
      R.prop<any, ValidationSchema<S>>(property),
      R.values,
      R.map(getErrorOrNone),
      R.filter(stringIsNotEmpty),
      (errors: string[]) => ({ errors, isValid: Boolean(!errors.length) }),
      R.assoc(property as any, R.__, {}),
    )(validationSchema);
  });
}

export function createValidate<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState,
): Validate<S> {
  return (property: keyof S, value: any) => {
    const valid = Maybe.of(value)
      .map(updateProperty(validationSchema)(property as any))
      .map(R.mergeRight(readValue(validationState)))
      .map(executeSideEffect(setValidationState))
      .map(isPropertyValid(property));
    return valid.isJust ? valid.join() : true;
  };
}

export function createValidateIfTrue<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState,
): ValidateIfTrue<S> {
  return (property: keyof S, value: any) => {
    const valid = Maybe.of(value)
      .map(updateProperty(validationSchema)(property as any))
      .map(R.mergeRight(readValue(validationState)))
      .map(R.ifElse(
        isPropertyValid(property),
        executeSideEffect(setValidationState),
        R.always(null),
      ))
      .map(isPropertyValid(property));
    return valid.isJust ? valid.join() : true;
  };
}

export function createValidateAll<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState,
): ValidateAll<S> {
  return (value: any, props = Object.keys(validationSchema) as (keyof S)[]) => {
    const newValidationState = (acc: ValidationState, property: keyof S) => {
      const updated = updateProperty(validationSchema)(property as any, value);
      return { ...acc, ...updated };
    };
    const valid = Maybe.of(props)
      .map(R.reduce(newValidationState, {}))
      .map(R.mergeRight(readValue(validationState)))
      .map(executeSideEffect(setValidationState))
      .map(calculateIsValid)
    return valid.isJust ? valid.join() : true;
  };
}

export function createValidateAllIfTrue<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState,
): ValidateAllIfTrue<S> {
  return (value: any, props = Object.keys(validationSchema) as (keyof S)[]) => {
    const newValidationState = (acc: ValidationState, property: keyof S) => {
      const updated = updateProperty(validationSchema)(property as any, value);
      return updated[property].isValid
        ? { ...acc, ...updated }
        : { ...acc, ...readValue(validationState)[property as any] };
    };
    const valid = Maybe.of(props)
      .map(R.reduce(newValidationState, {}))
      .map(R.mergeRight(readValue(validationState)))
      .map(executeSideEffect(setValidationState))
      .map(calculateIsValid);
    return valid.isJust ? valid.join() : true;
  };
}

export function createGetAllErrors<S>(
  validationState: ValidationState | (() => ValidationState),
): GetAllErrors<S> {
  return (property: keyof S, vState = readValue(validationState)) => {
    const errors = Maybe.of(vState)
      .map(R.prop<any>(property))
      .map(R.prop('errors'));
    return errors.isJust ? errors.join() : [];
  };
}

export function createGetError<S>(
  validationState: ValidationState | (() => ValidationState),
): GetError<S> {
  return (property: keyof S, vState = readValue(validationState)) => {
    const error = Maybe.of(vState)
      .map(R.prop<any>(property))
      .map(R.prop('errors'))
      .map(R.head);
    return error.isJust ? error.join() : '';
  };
}

export function createGetFieldValid<S>(
  validationState: ValidationState | (() => ValidationState),
): GetFieldValid<S> {
  return (property: keyof S) =>
    pipe(readValue, isPropertyValid(property))(validationState);
}

export function calculateIsValid(
  validationState: ValidationState | (() => ValidationState),
): boolean {
  const isValid = (acc: boolean, curr: string): boolean =>
    acc ? isPropertyValid(curr)(readValue(validationState)) : acc;
  return pipe(readValue, R.keys, R.reduce(isValid, true))(validationState);
}

export function gatherValidationErrors<S>(
  state: ValidationState | (() => ValidationState),
) {
  return Object.keys(readValue(state)).reduce((acc: string[], curr: string) => {
    return createGetError<S>(readValue(state))(curr as keyof S)
      ? [...acc, createGetError<S>(readValue(state))(curr as keyof S)]
      : acc;
  }, []);
}

/**
 * Returns an onBlur function that calls validate on a property matching the
 * name of the event whenever a blur event happens.
 * @param state the data controlling the form
 * @return function :: (event: any) -> any
 */
export function createValidateOnBlur<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState,
): ValidateOnBlur<S> {
  return (state: S) =>
    (event: any): void => {
      createValidate(
        validationSchema,
        readValue(validationState),
        setValidationState,
      )(R.path(['target', 'name'], event) as keyof S, {
        ...state,
        ...eventNameValue(event),
      });
    };
}

/**
 * Returns an onChange function that calls validateIfTrue on a property
 * matching the name of the event whenever a change event happens.
 * @param onChange function to handle onChange events
 * @param state the data controlling the form
 * @return function :: (event: any) => any
 */
export function createValidateOnChange<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState,
): ValidateOnChange<S> {
  return (onChange: (event: any) => any, state: S) =>
    (event: any): unknown => {
      createValidateIfTrue(
        validationSchema,
        readValue(validationState),
        setValidationState,
      )(R.path(['target', 'name'], event) as keyof S, {
        ...state,
        ...eventNameValue(event),
      });
      return onChange(event);
    };
}
