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
  ResetValidationState,
  SetValidationState,
  Validate,
  ValidateAll,
  ValidateAllIfTrue,
  ValidateIfTrue,
  ValidateOnBlur,
  ValidateOnChange,
  ValidationFunction,
  ValidationProps,
  ValidationSchema,
  ValidationState,
  ValidationStateProperty,
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
 * @param string
 * @return boolean
 */
export const isPropertyValid = <S>(
  property: keyof S,
): ((v: ValidationSchema<S>) => boolean) =>
  R.pipe<ValidationSchema<S>, boolean | undefined, boolean>(
    R.path([property as any, 'isValid']),
    R.defaultTo(true),
  );

/**
 * Helper function to determine if all properties on the ValidationState are
 * valid.
 * @param  ValidationState
 * @return boolean
 */
export function calculateIsValid(
  validationState: ValidationState | (() => ValidationState),
): boolean {
  const isValid = (acc: boolean, curr: string): boolean =>
    acc ? isPropertyValid(curr)(readValue(validationState)) : acc;
  return Object.keys(readValue(validationState)).reduce(isValid, true);
}

/**
 * Helper function to generate an array of errors grabing the first error for
 * all properties on the ValidationState
 * @param  ValidationState
 * @return [string]
 */
export function gatherValidationErrors<S>(
  state: ValidationState | (() => ValidationState),
) {
  const validationState = readValue(state);
  const getFirstError = createGetError<S>(validationState);
  return Object.keys(validationState).reduce((acc: string[], curr: string) => {
    return getFirstError(curr as keyof S)
      ? [...acc, getFirstError(curr as keyof S)]
      : acc;
  }, []);
}

/**
 * Creates the validation state based on the defined schema
 * @param  ValidationSchema
 * @return ValidationState
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

/**
 * Helper function to create updated properties to merge with the ValidationState.
 * If the property doesn't exist it defaults to truthy state.
 * @param  ValidationSchema
 * @return function(string, any): ValidationState
 */
export function updateProperty<S>(validationSchema: ValidationSchema<S>) {
  return R.curry((property: keyof S, state: S): ValidationState => {
    // valueIsValid :: string -> boolean
    const valueIsValid = R.pipe(
      R.prop<string, ValidationFunction<S>>('validation'),
      R.applyTo(state),
    );

    // getErrorOrNone :: string -> string
    const getErrorOrNone = R.ifElse(
      valueIsValid,
      R.always(''),
      R.prop('error'),
    );

    // updateValidationStateProp :: string[] -> ValidationStateProperty
    const updateValidationStateProp = (
      errors: string[],
    ): ValidationStateProperty => ({
      errors,
      isValid: Boolean(!errors.length),
    });

    return R.pipe(
      R.prop<string, ValidationProps<S>[]>(property as any),
      R.defaultTo([]),
      R.map(getErrorOrNone),
      R.filter(stringIsNotEmpty),
      updateValidationStateProp,
      R.assoc(property as any, R.__, {}),
    )(validationSchema);
  });
}

/**
 * Creates a validate function that is exposed on the ValidationObject which
 * updates the validationState and returns a boolean
 * @param  ValidationSchema
 * @param  ValidationState
 * @param  SetValidationState
 * @return function(string, any): boolean
 */
export function createValidate<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState,
): Validate<S> {
  return (property: keyof S, value: S) => {
    return Maybe.of(value)
      .map(updateProperty(validationSchema)(property as any))
      .map(R.mergeRight(readValue(validationState)))
      .map(executeSideEffect(setValidationState))
      .map(isPropertyValid(property))
      .join();
  };
}

/**
 * Creates a resetValidationState function that is expoised on the validationObject
 * which resets the current validtaion state by overwriting it with the default
 * truthy state.
 * @param  ValidationSchema
 * @return ValidationState
 */
export function createResetValidationState<S>(
  validationSchema: ValidationSchema<S>,
  setValidationState: SetValidationState,
): ResetValidationState {
  return () => {
    setValidationState(createValidationState(validationSchema));
  };
}

/**
 * Creates a validateIfTrue function that is exposed on the ValidationObject
 * which updates the validationState if the validation passes and returns a
 * boolean.
 * @param  ValidationSchema
 * @param  ValidationState
 * @param  SetValidationState
 * @return function(string, any): boolean
 */
export function createValidateIfTrue<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState,
): ValidateIfTrue<S> {
  return (property: keyof S, value: S) => {
    const valid = Maybe.of(value)
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

/**
 * Creates a validateAll function that is exposed on the ValidationObject
 * which runs all validations against a supplied updates the validationState
 * the validation passes and returns a boolean. Resulting function takes an
 * optional second parameter for validating a subset of properties.
 * @param  ValidationSchema
 * @param  ValidationState
 * @param  SetValidationState
 * @return function(state, [string]): boolean
 */
export function createValidateAll<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState,
): ValidateAll<S> {
  return (value: any, props = Object.keys(validationSchema) as (keyof S)[]) => {
    const updateProperties = (acc: ValidationState, property: string) => ({
      ...acc,
      ...updateProperty(validationSchema)(property as any, value),
    });
    return Maybe.of(props)
      .map(R.reduce(updateProperties, readValue(validationState)))
      .map(R.mergeRight(readValue(validationState)))
      .map(executeSideEffect(setValidationState))
      .map(calculateIsValid)
      .join();
  };
}

/**
 * Creates a validateAll function that is exposed on the ValidationObject
 * which runs all validations against a supplied updates the validationState
 * the validation passes and returns a boolean
 * @param  ValidationSchema
 * @param  ValidationState
 * @param  SetValidationState
 * @return function(string, [string]?): boolean
 */
export function createValidateAllIfTrue<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState,
): ValidateAllIfTrue<S> {
  return (value: any, props = Object.keys(validationSchema) as (keyof S)[]) => {
    const updateProperties = (acc: ValidationState, property: string) => {
      const updated = updateProperty(validationSchema)(property as any, value);
      return R.path([property, 'isValid'], updated)
        ? { ...acc, ...updated }
        : { ...acc };
    };
    return Maybe.of(props)
      .map(R.reduce(updateProperties, readValue(validationState)))
      .map(R.mergeRight(readValue(validationState)))
      .map(executeSideEffect(setValidationState))
      .map(calculateIsValid)
      .join();
  };
}

/**
 * Creates a getAllErrors function that is exposed on the ValidationObject which
 * retrieves all errors for a given property on the ValidationState.
 * Defaults to an empty array.
 * @param  ValidationState
 * @return function(string, ValidationState?): [string]
 */
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

/**
 * Creates a getError function that is exposed on the ValidationObject which
 * retrieves the first error for a given property on the ValidationState.
 * Defaults to an empty string.
 * @param  ValidationState
 * @return function(string, ValidationState?): string
 */
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

/**
 * Creates a getFieldValid function that is exposed on the ValidationObject
 * which returns a boolean that represents if a given property on the
 * ValidationState is valid or not.
 * @param  ValidationState
 * @return function(string, ValidationState?): boolean
 */
export function createGetFieldValid<S>(
  validationState: ValidationState | (() => ValidationState),
): GetFieldValid<S> {
  return (property: keyof S, vState = readValue(validationState)) =>
    R.pipe(isPropertyValid(property))(vState);
}

/**
 * Returns an onBlur function that calls validate on a property matching the
 * name of the event whenever a blur event happens.
 * @param  ValidationSchema
 * @param  ValidationState
 * @param  SetValidationState
 * @return function(event: any): void
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
 * @param  ValidationSchema
 * @param  ValidationState
 * @param  SetValidationState
 * @return function(event: any): unknown
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
