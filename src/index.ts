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
 * determines if a property on the validation state is valid (true) or invalid
 * (false). Defaults to true if the the property doesn't exist.
 */
export function isPropertyValid<S>(
  property: keyof S,
  validationState: ValidationState,
): boolean {
  return validationState[property as string]?.isValid ?? true
}

/**
 * Determine if all properties on the ValidationState are valid.
 */
export function calculateIsValid(
  validationState: ValidationState | (() => ValidationState),
): boolean {
  const state = readValue(validationState)
  return Object.keys(state).reduce<boolean>((acc, curr) => {
    return acc ? isPropertyValid(curr, state) : acc
  }, true)
}

/**
 * Creates an array of errors grabing the first error for all properties on the
 * ValidationState. To create an error higherarchy, list validations on the
 * schema in order of priority.
 */
export function gatherValidationErrors<S>(
  state: ValidationState | (() => ValidationState),
): string[] {
  const validationState = readValue(state)
  const getFirstError = createGetError<S>(validationState)
  return Object.keys(validationState).reduce<string[]>((acc, curr) => {
    return getFirstError(curr as keyof S)
      ? [...acc, getFirstError(curr as keyof S)]
      : acc
  }, [])
}

function getKeys<S>({ validationSchema, config }: any) {
  return config?.yup
    ? (Object.keys(validationSchema.fields) as Array<keyof S>)
    : (Object.keys(validationSchema) as Array<keyof S>)
}

/**
 * Creates the validation state based on the keys of the defined schema
 */
export function createValidationState<S>({
  validationSchema,
  config,
}: {
  validationSchema: ValidationSchema<S>
  config?: SchemaConfig
}): ValidationState {
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

function handleYupUpdates<S>({
  dirty,
  property,
  state,
  validationSchema,
}: UpdateProperty<S>): ValidationStateProperty {
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
function handleUpdates<S>({
  dirty,
  property,
  state,
  validationSchema,
}: UpdateProperty<S>): ValidationStateProperty {
  const validationRules =
    validationSchema[property as keyof ValidationSchema<S>] ?? []

  // avoids running validation if there is no property in state that matches
  // this is to avoid unecessarily throwing errors on optional properties that
  // would be handled normally by a long hand validation rule
  const errors = validationRules
    .map((validationRule: Validation<S>) => {
      if ('auto' in validationRule) {
        if (property in (state as object)) {
          if(validationRule.prop(property).validation(state) === false) {
            const error = generateError(state, validationRule.prop(property).error)
            return error
          } else {
            return ''
          }
        } else {
          return ''
        }
      } else {
        return validationRule.validation(state) === false
          ? generateError(state, validationRule.error)
          : ''
      }
    })
    .filter(stringIsNotEmpty)

  return { dirty, errors, isValid: Boolean(!errors.length) }
}

export function updateProperty<S>({ config, ...props }: UpdateProperty<S>) {
  return config?.yup
    ? handleYupUpdates({ ...props })
    : handleUpdates({ ...props })
}

/**
 * Creates a validate function that is exposed on the ValidationObject which
 * updates the validationState and returns a boolean. Properties touched by
 * validate will be marked dirty in the validation state. If the property does
 * not exist in the validation state it skips computation and returns true.
 */
export function createValidate<S>({
  config,
  setValidationState,
  validationSchema,
  validationState,
}: DefaultProps<S>): Validate<S> {
  return function (property: keyof S, state: S): boolean {
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
      return isPropertyValid(property, newValidationState)
    } else {
      return true
    }
  }
}

/**
 * Creates a validateIfDirty function that is exposed on the ValidationObject
 * which updates the validationState if the property is dirty on the validation
 * state (has been touched by validate) and returns a boolean. If the property
 * does not exist on the validation state it skips computation and returns true.
 */
export function createValidateIfDirty<S>({
  config,
  setValidationState,
  validationSchema,
  validationState,
}: DefaultProps<S>): ValidateIfDirty<S> {
  return function (property: keyof S, state: S): boolean {
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
      const valid = isPropertyValid(property, updatedState)
      const dirty = vState[property].dirty
      if (dirty) {
        setValidationState(updatedState)
      }
      return valid
    } else {
      return true
    }
  }
}


/**
 * Creates a resetValidationState function that is expoised on the validationObject
 * which resets the current validtaion state by overwriting it with the default
 * truthy state.
 */
export function createResetValidationState<S>({
  config,
  setValidationState,
  validationSchema,
}: {
  config?: SchemaConfig
  setValidationState: SetValidationState
  validationSchema: ValidationSchema<S>
}): ResetValidationState {
  return function (): void {
    setValidationState(createValidationState<S>({ config, validationSchema }))
  }
}

/**
 * Creates a validateAll function that is exposed on the ValidationObject
 * which runs all validations against a supplied object updates
 * thevalidationState the validation passes and returns a boolean. Resulting
 * function takes an optional second parameter for validating a subset of
 * properties.
 */
export function createValidateAll<S>({
  config,
  setValidationState,
  validationSchema,
  validationState,
}: DefaultProps<S>): ValidateAll<S> {
  return function (
    state: S,
    props = getKeys({ validationSchema, config }),
  ): boolean {
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
}

/**
 * Creates a validateAllIfDirty function that is exposed on the
 * ValidationObject which runs all validations against a supplied object and
 * updates the validationState on any dirty fields and then returns a boolean
 */
export function createValidateAllIfDirty<S>({
  config,
  setValidationState,
  validationSchema,
  validationState,
}: DefaultProps<S>): ValidateAllIfDirty<S> {
  return function (
    state: S,
    props = getKeys({ validationSchema, config }),
  ): boolean {
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
}

/**
 * Creates a getAllErrors function that is exposed on the ValidationObject which
 * retrieves all errors for a given property on the ValidationState.
 * Defaults to an empty array.
 */
export function createGetAllErrors<S>(
  validationState: ValidationState | (() => ValidationState),
): GetAllErrors<S> {
  return function (property: keyof S, vState = readValue(validationState)) {
    return vState[property]?.errors ?? []
  }
}

/**
 * Creates a getError function that is exposed on the ValidationObject which
 * retrieves the first error for a given property on the ValidationState.
 * Defaults to an empty string.
 */
export function createGetError<S>(
  validationState: ValidationState | (() => ValidationState),
): GetError<S> {
  return function (
    property: keyof S,
    vState = readValue(validationState),
  ): string {
    return vState[property]?.errors[0] ?? ''
  }
}

/**
 * Creates a getFieldValid function that is exposed on the ValidationObject
 * which returns a boolean that represents if a given property on the
 * ValidationState is valid or not.
 */
export function createGetFieldValid<S>(
  validationState: ValidationState | (() => ValidationState),
): GetFieldValid<S> {
  return function (
    property: keyof S,
    vState = readValue(validationState),
  ): boolean {
    return isPropertyValid(property, vState)
  }
}

/**
 * Returns an onBlur function that calls validate on a property matching the
 * name of the event whenever a blur event happens.
 */
export function createValidateOnBlur<S>({
  config,
  validationSchema,
  validationState,
  setValidationState,
}: DefaultProps<S>): ValidateOnBlur<S> {
  return function (state: S): (event: any) => void {
    return function (event: any): void {
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
  }
}

/**
 * Returns an onChange function that calls validateIfDirty on a property
 * matching the name of the event whenever a change event happens.
 */
export function createValidateOnChange<S>({
  config,
  validationSchema,
  validationState,
  setValidationState,
}: DefaultProps<S>): ValidateOnChange<S> {
  return function (
    onChange: (event: any) => void,
    state: S,
  ): (event: any) => void {
    return function (event: any): any {
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
  }
}
