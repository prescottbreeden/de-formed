// --[ Validation Object Types ]------------------------------------------------
export type GetAllErrors<S> = (property: keyof S) => string[]
export type GetError<S> = (property: keyof S) => string
export type GetFieldValid<S> = (property: keyof S) => boolean
export type ResetValidationState = () => void
export type Validate<S> = (property: keyof S, value: S) => boolean
export type ValidateAll<S> = (value: S, keys?: Array<keyof S>) => boolean
export type ValidateAllIfTrue<S> = (value: S, keys?: Array<keyof S>) => boolean
export type ValidateIfTrue<S> = (property: keyof S, value: S) => boolean
export type ValidateOnBlur<S> = (value: S) => (event: any) => any
export type ValidateOnChange<S> = (
  onChange: (event: any) => any,
  value: S
) => (event: any) => any

export type SetValidationState = (
  validationState: ValidationState
) => void
export interface ValidationObject<S> {
  getAllErrors: GetAllErrors<S>
  getError: GetError<S>
  getFieldValid: GetFieldValid<S>
  isValid: boolean
  resetValidationState: ResetValidationState
  setValidationState: SetValidationState
  validate: Validate<S>
  validateAll: ValidateAll<S>
  validateAllIfTrue: ValidateAllIfTrue<S>
  validateIfTrue: ValidateIfTrue<S>
  validateOnBlur: ValidateOnBlur<S>
  validateOnChange: ValidateOnChange<S>
  validationErrors: string[]
  validationState: ValidationState
}

// --[ Schema Type ]------------------------------------------------------------
export type ValidationFunction<S> = (value: S) => boolean
export interface ValidationProps<S> {
  error: string | ((value: S) => string)
  validation: ValidationFunction<S>
}

export interface ValidationSchema<S> {
  [key: string]: Array<ValidationProps<S>>
}

export interface ValidationStateProperty {
  isValid: boolean
  errors: string[]
}

export type ValidationState = {
  [key: string]: ValidationStateProperty
}

// TODO: probably just scrap this, doesn't feel valuable to expose
export type EventName = {[key: string]: string | number | boolean}
