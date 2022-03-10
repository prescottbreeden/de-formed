import type {
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
} from './types'
import {
  eventNameValue,
  generateError,
  readValue,
  stringIsNotEmpty,
} from './utilities'

export * from './types'
export {eventNameValue}

/**
 * Curried function that takes a string and returns a function which
 * determines if a property on the validation state is valid (true) or invalid
 * (false). Defaults to true if the the property doesn't exist.
 */
export const isPropertyValid = <S>(property: keyof S) => (
  validationState: ValidationState
): boolean => validationState[property as string]?.isValid ?? true

/**
 * Determine if all properties on the ValidationState are valid.
 */
export const calculateIsValid = (
  validationState: ValidationState | (() => ValidationState)
): boolean => {
  const state = readValue(validationState)
  return Object.keys(state).reduce<boolean>((acc, curr) => {
    return acc ? isPropertyValid(curr)(state) : acc
  }, true)
}

/**
 * Creates an array of errors grabing the first error for all properties on the
 * ValidationState. To create an error higherarchy, list validations on the
 * schema in order of priority.
 */
export const gatherValidationErrors = <S>(
  state: ValidationState | (() => ValidationState)
): string[] => {
  const validationState = readValue(state)
  const getFirstError = createGetError<S>(validationState)
  return Object.keys(validationState).reduce<string[]>((acc, curr) => {
    return getFirstError(curr as keyof S)
      ? [...acc, getFirstError(curr as keyof S)]
      : acc
  }, [])
}

/**
 * Creates the validation state based on the defined schema
 */
export const createValidationState = <S>(
  validationSchema: ValidationSchema<S> = {}
): ValidationState =>
  Object.keys(validationSchema).reduce<ValidationState>((acc, key) => {
    return {
      ...acc,
      [key]: {
        errors: [],
        isValid: true,
      },
    }
  }, {} as ValidationState)

/**
 * Helper function to create updated properties to merge with the ValidationState.
 * If the property doesn't exist it defaults to truthy state.
 */
export const updateProperty = <S>(validationSchema: ValidationSchema<S>) => (
  property: keyof S,
  state: S
): ValidationStateProperty => {
  const validationProps =
    validationSchema[property as keyof ValidationSchema<S>] ?? []

  const errors = validationProps
    .map(vProp =>
      vProp.validation(state) ? '' : generateError(state)(vProp.error)
    )
    .filter(stringIsNotEmpty)

  return {
    errors,
    isValid: Boolean(!errors.length),
  }
}

/**
 * Creates a validate function that is exposed on the ValidationObject which
 * updates the validationState and returns a boolean
 */
export const createValidate = <S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState
): Validate<S> => (property: keyof S, value: S) => {
  const state = {
    ...readValue(validationState),
    [property]: updateProperty(validationSchema)(property, value),
  }
  setValidationState(state)
  return isPropertyValid(property)(state)
}

/**
 * Creates a resetValidationState function that is expoised on the validationObject
 * which resets the current validtaion state by overwriting it with the default
 * truthy state.
 */
export const createResetValidationState = <S>(
  validationSchema: ValidationSchema<S>,
  setValidationState: SetValidationState
): ResetValidationState => (): void =>
    setValidationState(createValidationState(validationSchema))

/**
 * Creates a validateIfTrue function that is exposed on the ValidationObject
 * which updates the validationState if the validation passes and returns a
 * boolean.
 */
export const createValidateIfTrue = <S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState
): ValidateIfTrue<S> => (property: keyof S, value: S): boolean => {
  const state = readValue(validationState)
  const updatedState = {
    ...state,
    [property]: updateProperty(validationSchema)(property, value),
  }
  const valid = isPropertyValid(property)(updatedState)
  if (valid) {
    setValidationState(updatedState)
  }
  return valid
}

/**
 * Creates a validateAll function that is exposed on the ValidationObject
 * which runs all validations against a supplied updates the validationState
 * the validation passes and returns a boolean. Resulting function takes an
 * optional second parameter for validating a subset of properties.
 */
export const createValidateAll = <S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState
): ValidateAll<S> => (
  value: S,
  props = Object.keys(validationSchema) as Array<keyof S>
): boolean => {
    const state = readValue(validationState)
    const updatedState = props.reduce<ValidationState>((acc, property) => {
      return {
        ...acc,
        [property]: updateProperty(validationSchema)(property, value),
      }
    }, state)
    setValidationState(updatedState)
    return calculateIsValid(updatedState)
  }

/**
 * Creates a validateAll function that is exposed on the ValidationObject
 * which runs all validations against a supplied updates the validationState
 * the validation passes and returns a boolean
 */
export const createValidateAllIfTrue = <S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState
): ValidateAllIfTrue<S> => (
  value: S,
  props = Object.keys(validationSchema) as Array<keyof S>
): boolean => {
    const state = readValue(validationState)
    const updatedState = props.reduce<ValidationState>((acc, property) => {
      const updated = updateProperty(validationSchema)(property, value)
      return updated.isValid ? {...acc, [property]: updated} : acc
    }, state)
    setValidationState(updatedState)
    return calculateIsValid(updatedState)
  }

/**
 * Creates a getAllErrors function that is exposed on the ValidationObject which
 * retrieves all errors for a given property on the ValidationState.
 * Defaults to an empty array.
 */
export const createGetAllErrors = <S>(
  validationState: ValidationState | (() => ValidationState)
): GetAllErrors<S> => (
  property: keyof S,
  vState = readValue(validationState)
) => vState[property]?.errors ?? []

/**
 * Creates a getError function that is exposed on the ValidationObject which
 * retrieves the first error for a given property on the ValidationState.
 * Defaults to an empty string.
 */
export const createGetError = <S>(
  validationState: ValidationState | (() => ValidationState)
): GetError<S> => (
  property: keyof S,
  vState = readValue(validationState)
): string => vState[property]?.errors[0] ?? ''

/**
 * Creates a getFieldValid function that is exposed on the ValidationObject
 * which returns a boolean that represents if a given property on the
 * ValidationState is valid or not.
 */
export const createGetFieldValid = <S>(
  validationState: ValidationState | (() => ValidationState)
): GetFieldValid<S> => (
  property: keyof S,
  vState = readValue(validationState)
): boolean => isPropertyValid(property)(vState)

/**
 * Returns an onBlur function that calls validate on a property matching the
 * name of the event whenever a blur event happens.
 */
export const createValidateOnBlur = <S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState
): ValidateOnBlur<S> => (state: S) => (event: any): void => {
  const incomingFormState = {
    ...state,
    ...eventNameValue(event),
  }
  const validate = createValidate(
    validationSchema,
    readValue(validationState),
    setValidationState
  )
  validate(event.target.name, incomingFormState)
}

/**
 * Returns an onChange function that calls validateIfTrue on a property
 * matching the name of the event whenever a change event happens.
 */
export const createValidateOnChange = <S>(
  validationSchema: ValidationSchema<S>,
  validationState: ValidationState | (() => ValidationState),
  setValidationState: SetValidationState
): ValidateOnChange<S> => (onChange: (event: any) => any, state: S) => (
  event: any
): any => {
  const incomingFormState = {
    ...state,
    ...eventNameValue(event),
  }
  const validateIfTrue = createValidateIfTrue(
    validationSchema,
    readValue(validationState),
    setValidationState
  )
  validateIfTrue(event.target.name, incomingFormState)
  return onChange(event)
}
