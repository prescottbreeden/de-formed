// --[ Validation State Types ]-------------------------------------------------
export interface ValidationStateProperty {
  dirty: boolean
  errors: string[]
  isValid: boolean
}
export type ValidationState = { [key: string]: ValidationStateProperty }

// --[ Schema Types ]-----------------------------------------------------------
export type ValidationFunction<S> = (value: S) => boolean
export type ValidationAutoProp = {
  auto: boolean
  prop: <S>(prop: keyof S) => ValidationProps<S>
}
export type Validation<S> =
  | {
      error: string | ((value: S) => string)
      validation: ValidationFunction<S>
    }
  | ValidationAutoProp
export type ValidationProps<S> = {
  error: string | ((value: S) => string)
  validation: ValidationFunction<S>
}
export type ValidationSchema<S> =
  | { [key: string]: Array<Validation<S>> }
  | {
      [key: string]: any
      fields: { [key: string]: any }
    } // yup object
export type SchemaConfig = {
  yup?: boolean
}


// --[ Validation Object Types ]------------------------------------------------
export type GetAllErrors<S> = (property: keyof S) => string[]
export type GetError<S> = (property: keyof S) => string
export type GetFieldValid<S> = (property: keyof S) => boolean
export type ResetValidationState = () => void
export type SetValidationState = (validationState: ValidationState) => void
export type Validate<S> = (property: keyof S, state: S) => boolean
export type ValidateAll<S> = (state: S, keys?: Array<keyof S>) => boolean
export type ValidateAllIfDirty<S> = (state: S, keys?: Array<keyof S>) => boolean
export type ValidateIfDirty<S> = (property: keyof S, state: S) => boolean
export type ValidateOnBlur<S> = (state: S) => (event: any) => any
export type ValidateOnChange<S> = (
  onChange: (event: any) => any,
  state: S,
) => (event: any) => any

export interface ValidationObject<S> {
  /**
   * Retrieves all error messages from the validation state for a specific key.
   *
   * @template S The object schema type.
   *
   * @param {keyof S} property - The property of the object whose validation errors are to be retrieved.
   * @returns {string[]} An array of error messages for the given property.
   *
   * @example
   * // Given the validation state
   * // validation state = {
   * //   name: {
   * //     dirty: true,
   * //     errors: ['Name is required', 'Name is too short'],
   * //     isValid: false
   * //   }
   * // }
   *
   * getAllErrors('name')
   * // returns ['Name is required', 'Name is too short']
   */
  getAllErrors: GetAllErrors<S>

  /**
   * Retrieves the first error message from the validation state for a specific
   * key. Error messages are stored in the same order as in the validation schema.
   *
   * @template S The object schema type.
   *
   * @param {keyof S} property - The property of the object whose first validation error is to be retrieved.
   * @returns {string} The first error message for the given property.
   *
   * @example
   * // Given the validation state
   * // validation state = {
   * //   name: {
   * //     dirty: true,
   * //     errors: ['Name is required', 'Name is too short'],
   * //     isValid: false
   * //   }
   * // }
   *
   * getError('name')
   * // returns 'Name is required'
   */
  getError: GetError<S>

  /**
   * Determines whether a specific key in the validation state is valid based on
   * the current validation state. This does not perform any validations but
   * rather checks the current state.
   *
   * @template S The object schema type.
   *
   * @param {keyof S} property - The property of the object whose validity is to be checked.
   * @returns {boolean} Returns `true` if the given property is valid according to the current validation state. Otherwise, it returns `false`.
   *
   * @example
   * // Given the validation state
   * // validation state = {
   * //   name: {
   * //     dirty: true,
   * //     errors: ['Name is required'],
   * //     isValid: false
   * //   }
   * // }
   *
   * getFieldValid('name')
   * // returns false
   */
  getFieldValid: GetFieldValid<S>

  /**
   * Boolean that represents whether all keys in the validation state are valid
   * based on the current validation state (does not run validations).
   * @returns boolean
   */
  isValid: boolean
  /**
   * Resets the validation state back to its initial state. This is useful when
   * a form needs to be cleared, or if the validation state needs to be
   * programmatically reset to clear all errors.
   *
   * @returns {void} No return value.
   *
   * @example
   * // Given the following schema and initial validation state:
   * // schema = { name: [required()] }
   * // validation state = {
   * //   name: {
   * //     dirty: true,
   * //     errors: ['Name is required'],
   * //     isValid: false
   * //   }
   * // }
   *
   * resetValidationState()
   *
   * // After running resetValidationState, the validation state is reset to:
   * // { name: { dirty: false, errors: [], isValid: true } }
   */
  resetValidationState: ResetValidationState

  /**
   * Replaces the current validation state with the given state. This is useful
   * for incorporating backend validations into the current validation state.
   *
   * @param {Object} validationState - The validation state to be set. This object should follow the validation state schema.
   * @returns {void} No return value.
   *
   * @example
   * // Given the following initial validation state
   * // validation state = { name: { dirty: false, errors: [], isValid: true } }
   *
   * setValidationState(
   *   { name: { dirty: true, errors: ['Name is required'], isValid: false } }
   * )
   *
   * // After running setValidationState, the validation state is updated to:
   * // { name: { dirty: true, errors: ['Name is required'], isValid: false } }
   */
  setValidationState: SetValidationState
  /**
   * Validates an object against a schema and updates the validation state. The
   * validation state includes the error messages and a boolean flag indicating
   * whether the property is valid. Used internally for `validateOnBlur`, useful
   * for customizing validation behavior for edge case requirements.
   *
   * @template S The object schema type.
   *
   * @param {keyof S} property - The property of the object to be validated.
   * @param {S} object - The object to be validated.
   * @returns {boolean} - Returns `true` if the property is valid according to
   * the schema. Otherwise, it returns `false`.
   *
   * @example
   * // Given the following schema and initial validation state:
   * // schema = { name: [required()] }
   * // validation state = { name: { dirty: false, errors: [], isValid: true } }
   * // state = { name: '' }
   *
   * validate('name', state)
   *
   * // This will return false and update the validation state to:
   * // { name: { dirty: true, errors: ['Name is required'], isValid: false } }
   */
  validate: Validate<S>

  /**
   * Executes all validations defined in the schema against the provided state.
   * It updates the validation state and marks all validated properties as
   * dirty. This can be overloaded with a list of keys; in this case, only the
   * validations defined on the schema that match the provided keys will be
   * executed.
   * 
   * @template S The object schema type.
   * 
   * @param {S} state - The state to be validated.
   * @param {(keyof S)[]} keys - The keys of the properties to be validated. Optional.
   * @returns {boolean} - Returns `true` if all properties are valid, otherwise returns `false`.
   *
   * @example
   * // schema = { name: [required()], email: [required()] }
   * const state = { name: '', email: '' };
   *
   * // returns false and updates validation state
   * validateAll(state);
   *
   * // returns false and updates validation state for just 'name'
   * validateAll(state, ['name']);
   */
  validateAll: ValidateAll<S>

  /**
   * Runs all validations defined in the schema against the provided state, but
   * only on fields that are marked as dirty. This can be overloaded with a list
   * of keys; in this case, only the validations defined on the schema that
   * match the provided keys will be executed, but again, only if these fields
   * are marked as dirty.
   * 
   * @template S The object schema type.
   * 
   * @param {S} state - The state to be validated.
   * @param {(keyof S)[]} keys - The keys of the properties to be validated. Optional.
   * @returns {boolean} - Returns `true` if all dirty properties are valid, otherwise returns `false`.
   *
   * @example
   * // schema = { name: [required()], email: [required()] }
   * const state = { name: 'John', email: '' }; // only name is dirty
   *
   * // returns true and upates only the 'name' property, ignoring email
   * validateAllIfDirty(state);
   *
   * // returns true and upates only the 'name' property, ignoring email
   * validateAllIfDirty(state, ['name', 'email']);
   */
  validateAllIfDirty: ValidateAllIfDirty<S>

  /**
   * Validates a single property if it is marked as dirty. Used internally for
   * `validateOnChange`, useful for customizing validation behavior for edge
   * case requirements.
   * 
   * @template S The object schema type.
   * 
   * @param {keyof S} property - The property to be validated.
   * @param {S} state - The state to be validated.
   * @returns {boolean} - Returns `true` if the property is valid, otherwise returns `false`.
   *
   * @example
   * // schema = { name: [required()], email: [required()] }
   * const state = { name: 'John' }; // name is dirty
   * 
   * // returns true and updates validation state
   * validateIfDirty('name', state);
   */
  validateIfDirty: ValidateIfDirty<S>

  /**
   * This method creates a validation function to be invoked when a form control
   * loses focus (on the "blur" event). It returns a new function that, when
   * executed, will handle the "blur" event and update the validation state
   * automatically.
   * 
   * Use this to perform validations immediately after a user has finished
   * interacting with a specific form control. This can provide real-time
   * feedback on the input validity as the user moves through the form.
   *
   * @template S - The type of the object schema to be validated.
   * 
   * @param {S} state - The current state of the form control to be validated.
   * @returns {Function} - A function to be used as a "blur" event handler, encapsulating the validation logic.
   *
   * @example
   * const state = { name: '' };
   *
   * // vanilla js example
   * const input = document.querySelector('input[name="name"]');
   * input.addEventListener('blur', validateOnBlur(state));
   *
   * // jsx example
   * <input
   *   name="name" 
   *   onChange={validateOnChange(onChange, state)}
   *   onBlur={validateOnBlur(state)} // <--
   *   value={state.name}
   * />
   *
   * // Now, the input field will validate on blur, and update the validation 
   * // state automatically.
   */
  validateOnBlur: ValidateOnBlur<S>
  
  /**
   * This method is responsible for validation when a form control's state
   * changes. It creates and returns a new function to handle the "change"
   * event. This returned function updates the validation state and calls the
   * provided onChange function, allowing seamless integration of validation
   * logic into the event handling workflow.
   *
   * The `onChange` function will be invoked with the change event, irrespective
   * of the validation outcome. This allows you to continue with your regular
   * event handling while the validation is also performed in the background.
   *
   * @template S - The type of the object schema to be validated.
   * 
   * @param {Function} onChange - A function that is invoked after the validation process. It's called with the change event.
   * @param {S} state - The current state of the form control to be validated.
   * @returns {Function} - A function to be used as a "change" event handler, encapsulating both the validation and the provided onChange logic.
   *
   * @example
   * const state = { name: '' };
   *
   * // vanilla js example
   * const input = document.querySelector('input[name="name"]');
   * const onChangeHandler = (e) => { 
   *   console.log(`Input value: ${e.target.value}`);
   * } 
   * input.addEventListener('change', onChangeHandler, state));
   *
   * // jsx example
   * <input
   *   name="name" 
   *   onChange={validateOnChange(onChange, state)} // <--
   *   onBlur={validateOnBlur(state)}
   *   value={state.name}
   * />
   *
   * // Now, the input field will validate on change, and update the validation
   * // state automatically. It will also log the new input value.
   */
  validateOnChange: ValidateOnChange<S>
  
  /**
   * A list of all validation error messages from the latest validation operation.
   * 
   * @type {string[]}
   */
  validationErrors: string[]

  /**
   * The current validation state for all properties on an object.
   * 
   * @type {ValidationState}
   */
  validationState: ValidationState
}

