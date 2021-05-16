import * as R from 'ramda';
import { maybe } from './maybe';
import {
  compose,
  eventNameValue,
  executeSideEffect,
  readValue,
  prop,
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

export const isPropertyValid = <S>(property: keyof S) => compose(
  R.defaultTo(true),
  R.path([property as any, 'isValid'])
);

export function createValidationState<S>(
  validationSchema: ValidationSchema<S>
): ValidationState {
  const buildState = (acc: ValidationState, key: keyof S) => ({
    ...acc,
    [key]: { isValid: true, errors: [] },
  });
  const state = maybe(validationSchema)
    .map(R.keys)
    .map(R.reduce(buildState, {}));
  return state.isJust ? state.join() : {};
};

export function updateProperty<S>(validationSchema: ValidationSchema<S>) {
  return R.curry((property: keyof S, value: any) => {
    const valueIsValid = R.pipe(prop('validation'), R.applyTo(value));
    const getErrorOrNone = R.ifElse(
      valueIsValid,
      R.always(''),
      R.prop('error'),
    );
    const state = maybe(validationSchema)
      .map(prop(property))
      .map(R.values)
      .map(R.map(getErrorOrNone))
      .map(R.filter(stringIsNotEmpty))
      .map((errors: string[]) => ({ errors, isValid: !errors.length }))
      .map(R.assoc(property as any, R.__, {}));
    return state.isJust ? state.join() : {};
  });
}

export function createValidate<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState): Validate<S> {
  return (property: keyof S, value: any) =>
    maybe(value)
      .map(updateProperty(validationSchema)(property as any))
      .map(R.mergeRight(readValue(validationState)))
      .map(executeSideEffect(setValidationState))
      .map(isPropertyValid(property))
      .chain(R.defaultTo(true));
}

export function createValidateIfTrue<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState): ValidateIfTrue<S> {
  return (property: keyof S, value: any) => {
    const valid = maybe(value)
      .map(updateProperty(validationSchema)(property as any))
      .map(R.mergeRight(readValue(validationState)))
      .map(
        R.ifElse(
          isPropertyValid(property),
          executeSideEffect(setValidationState),
          R.always(null),
        ),
      )
      .map(isPropertyValid(property));
    return valid.isJust ? valid.join() : true;
  };
}

export function createValidateAll<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState): ValidateAll<S> {
  return (
    value: any,
    props = Object.keys(validationSchema) as (keyof S)[],
  ) => {
    const reduceStateUpdates = (acc: ValidationState, property: keyof S) => {
      const updated = updateProperty(validationSchema)(property as any, value);
      return { ...acc, ...updated };
    };
    return maybe(props)
      .map(R.reduce(reduceStateUpdates, {}))
      .map(R.mergeRight(readValue(validationState)))
      .map(executeSideEffect(setValidationState))
      .map(calculateIsValid)
      .chain(R.defaultTo(true));
  };
}

export function createValidateAllIfTrue<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState): ValidateAllIfTrue<S> {
  return (
    value: any,
    props = Object.keys(validationSchema) as (keyof S)[],
  ) => {
    const reduceValids = (acc: ValidationState, property: keyof S) => {
      const updated = updateProperty(validationSchema)(property as any, value);
      return updated[property].isValid
        ? { ...acc, ...updated }
        : { ...acc, ...readValue(validationState)[property as any] };
    };
    return maybe(props)
      .map(R.reduce(reduceValids, {}))
      .map(R.mergeRight(readValue(validationState)))
      .map(executeSideEffect(setValidationState))
      .map(calculateIsValid)
      .chain(R.defaultTo(true));
  };
}

export function createGetAllErrors<S>(
  validationState: ValidationState | (() => ValidationState)
): GetAllErrors<S> {
  return (
    property: keyof S,
    vState = readValue(validationState),
  ) => {
    const errors = maybe(vState).map(prop(property)).map(prop('errors'));
    return errors.isJust ? errors.join() : [];
  };
}

export function createGetError<S>(
  validationState: ValidationState | (() => ValidationState)
): GetError<S> {
  return (property: keyof S, vState = readValue(validationState)) => {
    const error = maybe(vState)
      .map(prop(property))
      .map(prop('errors'))
      .map(R.head);
    return error.isJust ? error.join() : '';
  };

}

export function createGetFieldValid<S>(
  validationState: ValidationState | (() => ValidationState)
): GetFieldValid<S> {
  return (property: keyof S) => 
    isPropertyValid(property)(readValue(validationState))
}

export function calculateIsValid(
  validationState: ValidationState | (() => ValidationState)
): boolean {
  return Object.keys(readValue(validationState)).reduce((acc, curr) => {
    return acc ? isPropertyValid(curr)(readValue(validationState)) : acc
  }, true);
};

export function gatherValidationErrors<S>(
  state: ValidationState | (() => ValidationState)
) {
  return Object.keys(readValue(state)).reduce(
    (acc: string[], curr: string) => {
      return createGetError<S>(readValue(state))(curr as keyof S)
        ? [...acc, createGetError<S>(readValue(state))(curr as keyof S)]
        : acc;
    }, []);
}

/**
 * Create a new onBlur function that calls validate on a property matching the
 * name of the event whenever a blur event happens.
 * @param state the data controlling the form
 * @return function :: (event: any) => any
 */
export function createValidateOnBlur<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState,
): ValidateOnBlur<S> {
  return (state: S) => (
    event: any,
  ): void => {
    createValidate(
      validationSchema,
      readValue(validationState),
      setValidationState
    )(R.path(['target', 'name'], event) as keyof S, {
      ...state,
      ...eventNameValue(event),
    });
  };
}

/**
 * Create a new onChange function that calls validateIfTrue on a property
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
  return (
    onChange: (event: any) => any,
    state: S,
  ) => (event: any): unknown => {
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
