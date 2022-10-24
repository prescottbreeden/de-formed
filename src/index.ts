import type {
  GetAllErrors,
  GetError,
  GetFieldValid,
  ResetValidationState,
  SchemaConfig,
  SetValidationState,
  Validate,
  ValidateAll,
  ValidateAllIfDirty,
  ValidateIfDirty,
  ValidateOnBlur,
  ValidateOnChange,
  Validation,
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
export * from './auto-props'

type UpdateProperty<S> = {
  config?: SchemaConfig
  dirty: boolean
  property: keyof S
  state: S
  validationSchema: ValidationSchema<S>
}
type DefaultProps<S> = {
  config?: SchemaConfig
  setValidationState: SetValidationState
  validationSchema: ValidationSchema<S>
  validationState: ValidationState | (() => ValidationState)
}

/**
 * Curried function that takes a string and returns a function which
 * determines if a property on the validation state is valid (true) or invalid
 * (false). Defaults to true if the the property doesn't exist.
 */
export const isPropertyValid =
  <S>(property: keyof S) =>
  (validationState: ValidationState): boolean =>
    validationState[property as string]?.isValid ?? true

/**
 * Determine if all properties on the ValidationState are valid.
 */
export const calculateIsValid = (
  validationState: ValidationState | (() => ValidationState),
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
  state: ValidationState | (() => ValidationState),
): string[] => {
  const validationState = readValue(state)
  const getFirstError = createGetError<S>(validationState)
  return Object.keys(validationState).reduce<string[]>((acc, curr) => {
    return getFirstError(curr as keyof S)
      ? [...acc, getFirstError(curr as keyof S)]
      : acc
  }, [])
}

const getKeys = <S>({ validationSchema, config }: any) =>
  config?.yup
    ? (Object.keys(validationSchema.fields) as Array<keyof S>)
    : (Object.keys(validationSchema) as Array<keyof S>)

/**
 * Creates the validation state based on the keys of the defined schema
 */
export const createValidationState = <S>({
  validationSchema,
  config,
}: {
  validationSchema: ValidationSchema<S>
  config?: SchemaConfig
}): ValidationState => {
  return getKeys({ config, validationSchema }).reduce<ValidationState>(
    (acc, key) => {
      acc[key] = {
        dirty: false,
        errors: [],
        isValid: true,
      }
      return acc
    },
    {},
  )
}

const handleYupUpdates = <S>({
  dirty,
  property,
  state,
  validationSchema,
}: UpdateProperty<S>): ValidationStateProperty => {
  let errors: string[] = []
  let isValid = true
  const { fields } = validationSchema
  const exists = Object.keys(fields).includes(property as string)
  try {
    if (exists) {
      validationSchema.validateSyncAt(property, state, {
        abortEarly: false,
      })
    }
  } catch (error: any) {
    errors = error.inner.reduce(
      (acc: any, curr: any) => [...acc, curr.message],
      [],
    )
    isValid = false
  }
  return { dirty, errors, isValid }
}

/**
 * Helper function to create updated properties to merge with the ValidationState.
 */
const handleUpdates = <S>({
  dirty,
  property,
  state,
  validationSchema,
}: UpdateProperty<S>): ValidationStateProperty => {
  const validationRules =
    validationSchema[property as keyof ValidationSchema<S>] ?? []

  // avoids running validation if there is no property in state that matches
  // this is to avoid unecessarily throwing errors on optional properties that
  // would be handled normally by a long hand validation rule
  const errors = validationRules
    .map((validationRule: Validation<S>) => {
      if ('auto' in validationRule) {
        return property in state
          ? validationRule.prop(property).validation(state) === false
            ? generateError(state, validationRule.prop(property).error)
            : ''
          : '' // if property is not in state, ignore validation
      } else {
        return validationRule.validation(state) === false
          ? generateError(state, validationRule.error)
          : ''
      }
    })
    .filter(stringIsNotEmpty)

  return { dirty, errors, isValid: Boolean(!errors.length) }
}

export const updateProperty = <S>({ config, ...props }: UpdateProperty<S>) =>
  config?.yup ? handleYupUpdates({ ...props }) : handleUpdates({ ...props })

/**
 * Creates a validate function that is exposed on the ValidationObject which
 * updates the validationState and returns a boolean. If the property doesn't
 * exist in the validation state it skips computation and returns true
 */
export const createValidate =
  <S>({
    config,
    setValidationState,
    validationSchema,
    validationState,
  }: DefaultProps<S>): Validate<S> =>
  (property: keyof S, state: S) => {
    const vState = readValue(validationState)
    if (vState[property]) {
      const newValidationState = {
        ...vState,
        [property]: updateProperty({
          config,
          dirty: true,
          property,
          state,
          validationSchema,
        }),
      }
      setValidationState(newValidationState)
      return isPropertyValid(property)(newValidationState)
    } else {
      return true
    }
  }

/**
 * Creates a resetValidationState function that is expoised on the validationObject
 * which resets the current validtaion state by overwriting it with the default
 * truthy state.
 */
export const createResetValidationState =
  <S>({
    config,
    setValidationState,
    validationSchema,
  }: {
    config?: SchemaConfig
    setValidationState: SetValidationState
    validationSchema: ValidationSchema<S>
  }): ResetValidationState =>
  (): void =>
    setValidationState(createValidationState<S>({ config, validationSchema }))

/**
 * Creates a validateIfDirty function that is exposed on the ValidationObject
 * which updates the validationState if the validation passes and returns a
 * boolean. If the property does not exist on the validation state it skips
 * computation and returns true.
 */
export const createValidateIfDirty =
  <S>({
    config,
    setValidationState,
    validationSchema,
    validationState,
  }: DefaultProps<S>): ValidateIfDirty<S> =>
  (property: keyof S, state: S): boolean => {
    const vState = readValue(validationState)
    if (vState[property]) {
      const updatedState: ValidationState = {
        ...vState,
        [property]: updateProperty<S>({
          config,
          dirty: vState[property].dirty,
          property,
          state,
          validationSchema,
        }),
      }
      const valid = isPropertyValid(property)(updatedState)
      const dirty = vState[property].dirty
      if (dirty) {
        setValidationState(updatedState)
      }
      return valid
    } else {
      return true
    }
  }

/**
 * Creates a validateAll function that is exposed on the ValidationObject
 * which runs all validations against a supplied updates the validationState
 * the validation passes and returns a boolean. Resulting function takes an
 * optional second parameter for validating a subset of properties.
 */
export const createValidateAll =
  <S>({
    config,
    setValidationState,
    validationSchema,
    validationState,
  }: DefaultProps<S>): ValidateAll<S> =>
  (state: S, props = getKeys({ validationSchema, config })): boolean => {
    const vState = readValue(validationState)
    const updatedState = props.reduce<ValidationState>(
      (acc, property) => ({
        ...acc,
        [property as keyof ValidationState]: updateProperty<S>({
          config,
          dirty: true,
          property,
          state,
          validationSchema,
        }),
      }),
      vState,
    )
    setValidationState(updatedState)
    return calculateIsValid(updatedState)
  }

/**
 * Creates a validateAllIfDirty function that is exposed on the
 * ValidationObject which runs all validations against a supplied updates the
 * validationState the validation passes and returns a boolean
 */
export const createValidateAllIfDirty =
  <S>({
    config,
    setValidationState,
    validationSchema,
    validationState,
  }: DefaultProps<S>): ValidateAllIfDirty<S> =>
  (state: S, props = getKeys({ validationSchema, config })): boolean => {
    const vState = readValue(validationState)
    const updatedState = props.reduce<ValidationState>((acc, property) => {
      const isDirty = acc[property as keyof ValidationState]?.dirty ?? false
      return isDirty
        ? {
            ...acc,
            [property as keyof ValidationState]: updateProperty<S>({
              config,
              dirty: isDirty,
              property,
              state,
              validationSchema,
            }),
          }
        : acc
    }, vState)
    setValidationState(updatedState)
    return calculateIsValid(updatedState)
  }

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
    vState[property]?.errors ?? []

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
    return vState[property]?.errors[0] ?? ''
  }

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
    isPropertyValid(property)(vState)

/**
 * Returns an onBlur function that calls validate on a property matching the
 * name of the event whenever a blur event happens.
 */
export const createValidateOnBlur =
  <S>({
    config,
    validationSchema,
    validationState,
    setValidationState,
  }: DefaultProps<S>): ValidateOnBlur<S> =>
  (state: S) =>
  (event: any): void => {
    const incomingFormState = {
      ...state,
      ...eventNameValue(event),
    }
    const validate: Validate<S> = createValidate({
      config,
      validationSchema,
      validationState: readValue(validationState),
      setValidationState,
    })
    validate(event.target.name, incomingFormState)
  }

/**
 * Returns an onChange function that calls validateIfDirty on a property
 * matching the name of the event whenever a change event happens.
 */
export const createValidateOnChange =
  <S>({
    config,
    validationSchema,
    validationState,
    setValidationState,
  }: DefaultProps<S>): ValidateOnChange<S> =>
  (onChange: (event: any) => any, state: S) =>
  (event: any): any => {
    const incomingFormState = {
      ...state,
      ...eventNameValue(event),
    }
    const validateIfDirty: ValidateIfDirty<S> = createValidateIfDirty({
      config,
      validationSchema,
      validationState: readValue(validationState),
      setValidationState,
    })
    validateIfDirty(event.target.name, incomingFormState)
    return onChange(event)
  }
