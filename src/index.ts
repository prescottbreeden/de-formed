import type {
  GetAllErrors,
  GetError,
  GetFieldValid,
  ResetValidationState,
  SetValidationState,
  Validate,
  ValidateAll,
  ValidateAllIfDirty,
  ValidateIfDirty,
  ValidateOnBlur,
  ValidateOnChange,
  ValidationSchema,
  ValidationState,
  ValidationStateProperty,
} from './types';
import {
  eventNameValue,
  generateError,
  readValue,
  stringIsNotEmpty,
} from './utilities';

export * from './types';

/**
 * Curried function that takes a string and returns a function which
 * determines if a property on the validation state is valid (true) or invalid
 * (false). Defaults to true if the the property doesn't exist.
 */
export const isPropertyValid =
  <S>(property: keyof S) =>
  (validationState: ValidationState): boolean =>
    validationState[property as string]?.isValid ?? true;

/**
 * Determine if all properties on the ValidationState are valid.
 */
export const calculateIsValid = (
  validationState: ValidationState | (() => ValidationState),
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
  state: ValidationState | (() => ValidationState),
): string[] => {
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
  validationSchema: ValidationSchema<S> = {},
): ValidationState =>
  Object.keys(validationSchema).reduce<ValidationState>((acc, key) => {
    acc[key] = {
      dirty: false,
      errors: [],
      isValid: true,
    };
    return acc;
  }, {});

/**
 * Helper function to create updated properties to merge with the ValidationState.
 * If the property doesn't exist it defaults to truthy state.
 */
export const updateProperty = <S>({
  validationSchema,
  property,
  state,
  dirty,
}: {
  validationSchema: ValidationSchema<S>;
  property: keyof S;
  state: S;
  dirty: boolean;
}): ValidationStateProperty => {
  const validationRules =
    validationSchema[property as keyof ValidationSchema<S>] ?? [];

  const errors = validationRules
    .map((validationRule) =>
      validationRule.validation(state)
        ? ''
        : generateError(state)(validationRule.error),
    )
    .filter(stringIsNotEmpty);

  return {
    dirty,
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
    validationState: ValidationState | (() => ValidationState),
    setValidationState: SetValidationState,
  ): Validate<S> =>
  (property: keyof S, state: S) => {
    const vState = readValue(validationState);
    if (vState[property]) {
      const newValidationState = {
        ...vState,
        [property]: updateProperty({
          validationSchema,
          property,
          state,
          dirty: true,
        }),
      };
      setValidationState(newValidationState);
      return isPropertyValid(property)(newValidationState);
    }
    return true;
  };

/**
 * Creates a resetValidationState function that is expoised on the validationObject
 * which resets the current validtaion state by overwriting it with the default
 * truthy state.
 */
export const createResetValidationState =
  <S>(
    validationSchema: ValidationSchema<S>,
    setValidationState: SetValidationState,
  ): ResetValidationState =>
  (): void =>
    setValidationState(createValidationState(validationSchema));

/**
 * Creates a validateIfDirty function that is exposed on the ValidationObject
 * which updates the validationState if the validation passes and returns a
 * boolean.
 */
export const createValidateIfDirty =
  <S>(
    validationSchema: ValidationSchema<S>,
    validationState: ValidationState | (() => ValidationState),
    setValidationState: SetValidationState,
  ): ValidateIfDirty<S> =>
  (property: keyof S, state: S): boolean => {
    const vState = readValue(validationState);
    if (vState[property]) {
      const updatedState: ValidationState = {
        ...vState,
        [property]: updateProperty<S>({
          validationSchema,
          property,
          state,
          dirty: vState[property].dirty,
        }),
      };
      const valid = isPropertyValid(property)(updatedState);
      const dirty = vState[property].dirty;
      if (dirty) {
        setValidationState(updatedState);
      }
      return valid;
    }
    return true;
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
    validationState: ValidationState | (() => ValidationState),
    setValidationState: SetValidationState,
  ): ValidateAll<S> =>
  (
    state: S,
    props = Object.keys(validationSchema) as Array<keyof S>,
  ): boolean => {
    const vState = readValue(validationState);
    const updatedState = props.reduce<ValidationState>(
      (acc, property) => ({
        ...acc,
        [property as keyof ValidationState]: updateProperty<S>({
          validationSchema,
          property,
          state,
          dirty: true,
        }),
      }),
      vState,
    );
    setValidationState(updatedState);
    return calculateIsValid(updatedState);
  };

/**
 * Creates a validateAllIfDirty function that is exposed on the
 * ValidationObject which runs all validations against a supplied updates the
 * validationState the validation passes and returns a boolean
 */
export const createValidateAllIfDirty =
  <S>(
    validationSchema: ValidationSchema<S>,
    validationState: ValidationState | (() => ValidationState),
    setValidationState: SetValidationState,
  ): ValidateAllIfDirty<S> =>
  (
    state: S,
    props = Object.keys(validationSchema) as Array<keyof S>,
  ): boolean => {
    const vState = readValue(validationState);
    const updatedState = props.reduce<ValidationState>((acc, property) => {
      const isDirty = acc[property as keyof ValidationState]?.dirty ?? false;
      return isDirty
        ? {
            ...acc,
            [property as keyof ValidationState]: updateProperty<S>({
              validationSchema,
              property,
              state,
              dirty: isDirty,
            }),
          }
        : acc;
    }, vState);
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
    validationState: ValidationState | (() => ValidationState),
  ): GetAllErrors<S> =>
  (property: keyof S, vState = readValue(validationState)) =>
    vState[property]?.errors ?? [];

/**
 * Creates a getError function that is exposed on the ValidationObject which
 * retrieves the first error for a given property on the ValidationState.
 * Defaults to an empty string.
 */
export const createGetError =
  <S>(
    validationState: ValidationState | (() => ValidationState),
  ): GetError<S> =>
  (property: keyof S, vState = readValue(validationState)): string => {
    return vState[property]?.errors[0] ?? '';
  };

/**
 * Creates a getFieldValid function that is exposed on the ValidationObject
 * which returns a boolean that represents if a given property on the
 * ValidationState is valid or not.
 */
export const createGetFieldValid =
  <S>(
    validationState: ValidationState | (() => ValidationState),
  ): GetFieldValid<S> =>
  (property: keyof S, vState = readValue(validationState)): boolean =>
    isPropertyValid(property)(vState);

/**
 * Returns an onBlur function that calls validate on a property matching the
 * name of the event whenever a blur event happens.
 */
export const createValidateOnBlur =
  <S>(
    validationSchema: ValidationSchema<S>,
    validationState: ValidationState | (() => ValidationState),
    setValidationState: SetValidationState,
  ): ValidateOnBlur<S> =>
  (state: S) =>
  (event: any): void => {
    const incomingFormState = {
      ...state,
      ...eventNameValue(event),
    };
    const validate = createValidate(
      validationSchema,
      validationState,
      setValidationState,
    );
    validate(event.target.name, incomingFormState);
  };

/**
 * Returns an onChange function that calls validateIfDirty on a property
 * matching the name of the event whenever a change event happens.
 */
export const createValidateOnChange =
  <S>(
    validationSchema: ValidationSchema<S>,
    validationState: ValidationState | (() => ValidationState),
    setValidationState: SetValidationState,
  ): ValidateOnChange<S> =>
  (onChange: (event: any) => any, state: S) =>
  (event: any): any => {
    const incomingFormState = {
      ...state,
      ...eventNameValue(event),
    };
    const validateIfDirty = createValidateIfDirty(
      validationSchema,
      readValue(validationState),
      setValidationState,
    );
    validateIfDirty(event.target.name, incomingFormState);
    return onChange(event);
  };
