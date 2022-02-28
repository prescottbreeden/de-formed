import { eventNameValue, readValue, stringIsNotEmpty } from './utilities';
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
 * Curried function that takes a string and returns a function which
 * determines if a property on the validation state is valid (true) or invalid
 * (false)
 */
export const isPropertyValid =
  <S>(property: keyof S) =>
  (validationState: ValidationState<S>) => {
    return validationState[property]?.isValid ?? true;
  };

/**
 * Determine if all properties on the ValidationState are valid.
 */
export const calculateIsValid = <S>(
  validationState: ValidationState<S> | (() => ValidationState<S>),
): boolean => {
  const state = readValue(validationState);
  return Object.keys(state).reduce<boolean>((acc, curr) => {
    return acc ? isPropertyValid(curr)(state) : acc;
  }, true);
};

/**
 * Creates an array of errors grabing the first error for all properties on the
 * ValidationState. To create an error higherarchy, list validations on the
 * schema in order of priority.
 */
export const gatherValidationErrors = <S>(
  state: ValidationState<S> | (() => ValidationState<S>),
) => {
  const validationState = readValue(state);
  const getFirstError = createGetError<S>(validationState);
  return Object.keys(validationState).reduce<string[]>((acc, curr) => {
    return getFirstError(curr as keyof S)
      ? [...acc, getFirstError(curr as keyof S)]
      : acc;
  }, []);
};

/**
 * Creates the validation state based on the defined schema
 */
export const createValidationState = <S>(
  validationSchema: ValidationSchema<S>,
): ValidationState<S> =>
  Object.keys(validationSchema).reduce<ValidationState<S>>((acc, key) => {
    acc[key as keyof S] = { isValid: true, errors: [] };
    return acc;
  }, {} as ValidationState<S>);

/**
 * Helper function to create updated properties to merge with the ValidationState.
 * If the property doesn't exist it defaults to truthy state.
 */
export const updateProperty =
  <S>(validationSchema: ValidationSchema<S>) =>
  (property: keyof S, state: S): ValidationStateProperty => {
    const validationProps = validationSchema[
      property as keyof ValidationSchema<S>
    ]
      ? validationSchema[property as keyof ValidationSchema<S>]
      : [];

    const errors = validationProps
      .map((vProp) => (vProp.validation(state) ? '' : vProp.error))
      .filter(stringIsNotEmpty);

    return {
      errors,
      isValid: Boolean(!errors.length),
    };
  };

/**
 * Creates a validate function that is exposed on the ValidationObject which
 * updates the validationState and returns a boolean
 */
export const createValidate =
  <S>(
    validationSchema: ValidationSchema<S>,
    validationState: ValidationState<S> | (() => ValidationState<S>),
    setValidationState: SetValidationState<S>,
  ): Validate<S> =>
  (property: keyof S, value: S) => {
    const state = readValue(validationState);
    state[property] = updateProperty(validationSchema)(property, value);
    setValidationState(state);
    return isPropertyValid(property)(state);
  };

/**
 * Creates a resetValidationState function that is expoised on the validationObject
 * which resets the current validtaion state by overwriting it with the default
 * truthy state.
 */
export const createResetValidationState =
  <S>(
    validationSchema: ValidationSchema<S>,
    setValidationState: SetValidationState<S>,
  ): ResetValidationState =>
  () => {
    setValidationState(createValidationState(validationSchema));
  };

/**
 * Creates a validateIfTrue function that is exposed on the ValidationObject
 * which updates the validationState if the validation passes and returns a
 * boolean.
 */
export const createValidateIfTrue =
  <S>(
    validationSchema: ValidationSchema<S>,
    validationState: ValidationState<S> | (() => ValidationState<S>),
    setValidationState: SetValidationState<S>,
  ): ValidateIfTrue<S> =>
  (property: keyof S, value: S) => {
    const state = readValue(validationState);
    const updatedState = {
      ...state,
      [property]: updateProperty(validationSchema)(property, value),
    };
    const valid = isPropertyValid(property)(updatedState);
    if (valid) {
      setValidationState(updatedState);
    }
    return valid;
  };

/**
 * Creates a validateAll function that is exposed on the ValidationObject
 * which runs all validations against a supplied updates the validationState
 * the validation passes and returns a boolean. Resulting function takes an
 * optional second parameter for validating a subset of properties.
 */
export const createValidateAll =
  <S>(
    validationSchema: ValidationSchema<S>,
    validationState: ValidationState<S> | (() => ValidationState<S>),
    setValidationState: SetValidationState<S>,
  ): ValidateAll<S> =>
  (value: any, props = Object.keys(validationSchema) as (keyof S)[]) => {
    const updatedState = props.reduce<ValidationState<S>>((acc, property) => {
      acc[property] = updateProperty(validationSchema)(property, value);
      return acc;
    }, readValue(validationState));
    setValidationState(updatedState);
    return calculateIsValid(updatedState);
  };

/**
 * Creates a validateAll function that is exposed on the ValidationObject
 * which runs all validations against a supplied updates the validationState
 * the validation passes and returns a boolean
 */
export const createValidateAllIfTrue =
  <S>(
    validationSchema: ValidationSchema<S>,
    validationState: ValidationState<S> | (() => ValidationState<S>),
    setValidationState: SetValidationState<S>,
  ): ValidateAllIfTrue<S> =>
  (value: any, props = Object.keys(validationSchema) as (keyof S)[]) => {
    const updatedState = props.reduce<ValidationState<S>>((acc, property) => {
      const updated = updateProperty(validationSchema)(property, value);
      return updated.isValid ? { ...acc, [property]: updated } : acc;
    }, readValue(validationState));
    setValidationState(updatedState);
    return calculateIsValid(updatedState);
  };

/**
 * Creates a getAllErrors function that is exposed on the ValidationObject which
 * retrieves all errors for a given property on the ValidationState.
 * Defaults to an empty array.
 */
export const createGetAllErrors =
  <S>(
    validationState: ValidationState<S> | (() => ValidationState<S>),
  ): GetAllErrors<S> =>
  (property: keyof S, vState = readValue(validationState)) => {
    return vState[property]?.errors ?? [];
  };

/**
 * Creates a getError function that is exposed on the ValidationObject which
 * retrieves the first error for a given property on the ValidationState.
 * Defaults to an empty string.
 */
export const createGetError =
  <S>(
    validationState: ValidationState<S> | (() => ValidationState<S>),
  ): GetError<S> =>
  (property: keyof S, vState = readValue(validationState)) => {
    return vState[property]?.errors[0] ?? '';
  };

/**
 * Creates a getFieldValid function that is exposed on the ValidationObject
 * which returns a boolean that represents if a given property on the
 * ValidationState is valid or not.
 */
export const createGetFieldValid =
  <S>(
    validationState: ValidationState<S> | (() => ValidationState<S>),
  ): GetFieldValid<S> =>
  (property: keyof S, vState = readValue(validationState)) =>
    isPropertyValid(property)(vState);

/**
 * Returns an onBlur function that calls validate on a property matching the
 * name of the event whenever a blur event happens.
 */
export const createValidateOnBlur =
  <S>(
    validationSchema: ValidationSchema<S>,
    validationState: ValidationState<S> | (() => ValidationState<S>),
    setValidationState: SetValidationState<S>,
  ): ValidateOnBlur<S> =>
  (state: S) =>
  (event: any): void => {
    createValidate(
      validationSchema,
      readValue(validationState),
      setValidationState,
    )(event.target.name, {
      ...state,
      ...eventNameValue(event),
    });
  };

/**
 * Returns an onChange function that calls validateIfTrue on a property
 * matching the name of the event whenever a change event happens.
 */
export const createValidateOnChange =
  <S>(
    validationSchema: ValidationSchema<S>,
    validationState: ValidationState<S> | (() => ValidationState<S>),
    setValidationState: SetValidationState<S>,
  ): ValidateOnChange<S> =>
  (onChange: (event: any) => any, state: S) =>
  (event: any): unknown => {
    createValidateIfTrue(
      validationSchema,
      readValue(validationState),
      setValidationState,
    )(event.target.name, {
      ...state,
      ...eventNameValue(event),
    });
    return onChange(event);
  };
