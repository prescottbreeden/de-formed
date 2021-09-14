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
 * Higher order function that takes a string and returns a function which
 * determines if a property on the validation state is valid (true) or invalid
 * (false)
 */
export const isPropertyValid =
  <S>(property: keyof S) =>
  (validationState: ValidationState) => {
    return validationState[property as any]?.isValid ?? true;
  };

/**
 * Helper function to determine if all properties on the ValidationState are
 * valid.
 */
export function calculateIsValid(
  validationState: ValidationState | (() => ValidationState),
): boolean {
  const state = readValue(validationState);
  return Object.keys(state).reduce<boolean>((acc, curr) => {
    const checkIfValid = isPropertyValid(curr);
    return acc ? checkIfValid(state) : acc;
  }, true);
}

/**
 * Helper function to generate an array of errors grabing the first error for
 * all properties on the ValidationState
 */
export function gatherValidationErrors<S>(
  state: ValidationState | (() => ValidationState),
) {
  const validationState = readValue(state);
  const getFirstError = createGetError<S>(validationState);
  return Object.keys(validationState).reduce<string[]>((acc, curr) => {
    return getFirstError(curr as keyof S)
      ? [...acc, getFirstError(curr as keyof S)]
      : acc;
  }, []);
}

/**
 * Creates the validation state based on the defined schema
 */
export function createValidationState<S>(
  validationSchema: ValidationSchema<S>,
): ValidationState {
  return validationSchema
    ? Object.keys(validationSchema).reduce<ValidationState>((acc, key) => {
        acc[key] = { isValid: true, errors: [] };
        return acc;
      }, {})
    : {};
}

/**
 * Helper function to create updated properties to merge with the ValidationState.
 * If the property doesn't exist it defaults to truthy state.
 */
export function updateProperty<S>(validationSchema: ValidationSchema<S>) {
  return (property: keyof S, state: S): ValidationStateProperty => {
    const validationProps = validationSchema[property as any]
      ? validationSchema[property as any]
      : [];

    const errors = validationProps
      .map((vProp) => (vProp.validation(state) ? '' : vProp.error))
      .filter(stringIsNotEmpty);

    return {
      errors,
      isValid: Boolean(!errors.length),
    };
  };
}

/**
 * Creates a validate function that is exposed on the ValidationObject which
 * updates the validationState and returns a boolean
 */
export function createValidate<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState,
): Validate<S> {
  return (property: keyof S, value: S) => {
    const state = readValue(validationState);
    state[property] = updateProperty(validationSchema)(property, value);
    setValidationState(state);
    return isPropertyValid(property)(state);
  };
}

/**
 * Creates a resetValidationState function that is expoised on the validationObject
 * which resets the current validtaion state by overwriting it with the default
 * truthy state.
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
 */
export function createValidateIfTrue<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState,
): ValidateIfTrue<S> {
  return (property: keyof S, value: S) => {
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
}

/**
 * Creates a validateAll function that is exposed on the ValidationObject
 * which runs all validations against a supplied updates the validationState
 * the validation passes and returns a boolean. Resulting function takes an
 * optional second parameter for validating a subset of properties.
 */
export function createValidateAll<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState,
): ValidateAll<S> {
  return (value: any, props = Object.keys(validationSchema) as (keyof S)[]) => {
    const state = readValue(validationState);
    const updatedState = props.reduce<ValidationState>((acc, property) => {
      acc[property as string] = updateProperty(validationSchema)(
        property,
        value,
      );
      return acc;
    }, state);
    setValidationState(updatedState);
    return calculateIsValid(updatedState);
  };
}

/**
 * Creates a validateAll function that is exposed on the ValidationObject
 * which runs all validations against a supplied updates the validationState
 * the validation passes and returns a boolean
 */
export function createValidateAllIfTrue<S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState,
): ValidateAllIfTrue<S> {
  return (value: any, props = Object.keys(validationSchema) as (keyof S)[]) => {
    const state = readValue(validationState);
    const updatedState = props.reduce<ValidationState>((acc, property) => {
      const updated = updateProperty(validationSchema)(property, value);
      if (updated.isValid) {
        acc[property as string] = updated;
      }
      return acc;
    }, state);
    setValidationState(updatedState);
    return calculateIsValid(updatedState);
  };
}

/**
 * Creates a getAllErrors function that is exposed on the ValidationObject which
 * retrieves all errors for a given property on the ValidationState.
 * Defaults to an empty array.
 */
export function createGetAllErrors<S>(
  validationState: ValidationState | (() => ValidationState),
): GetAllErrors<S> {
  return (property: keyof S, vState = readValue(validationState)) => {
    return vState[property]?.errors ?? [];
  };
}

/**
 * Creates a getError function that is exposed on the ValidationObject which
 * retrieves the first error for a given property on the ValidationState.
 * Defaults to an empty string.
 */
export function createGetError<S>(
  validationState: ValidationState | (() => ValidationState),
): GetError<S> {
  return (property: keyof S, vState = readValue(validationState)) => {
    return vState[property]?.errors[0] ?? '';
  };
}

/**
 * Creates a getFieldValid function that is exposed on the ValidationObject
 * which returns a boolean that represents if a given property on the
 * ValidationState is valid or not.
 */
export function createGetFieldValid<S>(
  validationState: ValidationState | (() => ValidationState),
): GetFieldValid<S> {
  return (property: keyof S, vState = readValue(validationState)) =>
    isPropertyValid(property)(vState);
}

/**
 * Returns an onBlur function that calls validate on a property matching the
 * name of the event whenever a blur event happens.
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
      )(event.target.name, {
        ...state,
        ...eventNameValue(event),
      });
    };
}

/**
 * Returns an onChange function that calls validateIfTrue on a property
 * matching the name of the event whenever a change event happens.
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
      )(event.target.name, {
        ...state,
        ...eventNameValue(event),
      });
      return onChange(event);
    };
}
