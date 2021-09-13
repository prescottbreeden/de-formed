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
  ValidationObject,
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
 * Creates the validation state based on the defined schema
 */
export function createValidationState<S>(
  schema: ValidationSchema<S>,
): ValidationState {
  return schema
    ? Object.keys(schema).reduce<ValidationState>((acc, key) => {
        acc[key] = { isValid: true, errors: [] };
        return acc;
      }, {})
    : {};
}

export class BaseValidation<S> implements ValidationObject<S> {
  private schema: ValidationSchema<S>;
  private state: ValidationState | (() => ValidationState);
  setValidationState: SetValidationState;
  constructor(
    validationSchema: ValidationSchema<S>,
    validationState: ValidationState | (() => ValidationState),
    setValidationState: SetValidationState,
  ) {
    this.schema = validationSchema;
    this.state = validationState;
    this.setValidationState = setValidationState;
  }

  get isValid() {
    return this.calculateIsValid();
  }

  get validationErrors() {
    return this.gatherValidationErrors();
  }

  get validationState(): ValidationState {
    return readValue(this.state);
  }

  /**
   * Higher order function that takes a string and returns a function which
   * determines if a property on the validation state is valid (true) or invalid
   * (false)
   */
  private isPropertyValid = (
    property: keyof S,
    validationState: ValidationState,
  ) => {
    return validationState[property as any]?.isValid ?? true;
  };

  /**
   * Helper function to determine if all properties on the ValidationState are
   * valid.
   */
  private calculateIsValid(state = readValue(this.state)): boolean {
    return Object.keys(state).reduce<boolean>((acc, curr) => {
      return acc ? this.isPropertyValid(curr as keyof S, state) : acc;
    }, true);
  }

  /**
   * Helper function to generate an array of errors grabing the first error for
   * all properties on the ValidationState
   */
  private gatherValidationErrors() {
    const validationState = readValue(this.state);
    const getFirstError = this.getError;
    return Object.keys(validationState).reduce<string[]>((acc, curr) => {
      return getFirstError(curr as keyof S)
        ? [...acc, getFirstError(curr as keyof S)]
        : acc;
    }, []);
  }

  /**
   * Helper function to create updated properties to merge with the ValidationState.
   * If the property doesn't exist it defaults to truthy state.
   */
  private updateProperty = (
    property: keyof S,
    state: S,
  ): ValidationStateProperty => {
    const validationProps = this.schema[property as any]
      ? this.schema[property as any]
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
   * Updates the validationState and returns a boolean
   */
  validate: Validate<S> = (property: keyof S, value: S) => {
    const state = readValue(this.state);
    state[property] = this.updateProperty(property as any, value);
    this.setValidationState(state);
    return this.isPropertyValid(property, state);
  };

  /**
   * Creates a resetValidationState function that is expoised on the validationObject
   * which resets the current validtaion state by overwriting it with the default
   * truthy state.
   */
  resetValidationState: ResetValidationState = () => {
    this.setValidationState(createValidationState(this.schema));
  };

  /**
   * Updates the validationState if the validation passes and returns a
   * boolean.
   */
  validateIfTrue: ValidateIfTrue<S> = (property: keyof S, value: S) => {
    const updatedState = {
      ...readValue(this.state),
      [property]: this.updateProperty(property, value),
    };
    const valid = this.isPropertyValid(property, updatedState);
    if (valid) {
      this.setValidationState(updatedState);
    }
    return valid;
  };

  /**
   * Runs all validations against a supplied updates the validationState
   * the validation passes and returns a boolean. Resulting function takes an
   * optional second parameter for validating a subset of properties.
   */
  validateAll: ValidateAll<S> = (
    value: any,
    props = Object.keys(this.schema) as (keyof S)[],
  ) => {
    const updatedState = props.reduce<ValidationState>((acc, property) => {
      acc[property as string] = this.updateProperty(property, value);
      return acc;
    }, readValue(this.state));
    this.setValidationState(updatedState);
    return this.calculateIsValid(updatedState);
  };

  /**
   * Runs all validations against a supplied updates the validationState
   * the validation passes and returns a boolean
   */
  validateAllIfTrue: ValidateAllIfTrue<S> = (
    value: any,
    props = Object.keys(this.schema) as (keyof S)[],
  ) => {
    const updatedState = props.reduce<ValidationState>((acc, property) => {
      const updated = this.updateProperty(property, value);
      if (updated.isValid) {
        acc[property as string] = updated;
      }
      return acc;
    }, readValue(this.state));
    this.setValidationState(updatedState);
    return this.calculateIsValid(updatedState);
  };

  /**
   * Retrieves all errors for a given property on the ValidationState.
   * Defaults to an empty array.
   */
  getAllErrors: GetAllErrors<S> = (
    property: keyof S,
    vState = readValue(this.state),
  ) => {
    return vState[property]?.errors ?? [];
  };

  /**
   * Retrieves the first error for a given property on the ValidationState.
   * Defaults to an empty string.
   */
  getError: GetError<S> = (
    property: keyof S,
    vState = readValue(this.state),
  ) => {
    return vState[property]?.errors[0] ?? '';
  };

  /**
   * Returns a boolean that represents if a given property on the
   * ValidationState is valid or not.
   */
  getFieldValid: GetFieldValid<S> = (
    property: keyof S,
    vState = readValue(this.state),
  ) => this.isPropertyValid(property, vState);

  /**
   * Returns an onBlur function that calls validate on a property matching the
   * name of the event whenever a blur event happens.
   */
  validateOnBlur: ValidateOnBlur<S> =
    (state: S) =>
    (event: any): void => {
      this.validate(event.target.name, {
        ...state,
        ...eventNameValue(event),
      });
    };

  /**
   * Returns an onChange function that calls validateIfTrue on a property
   * matching the name of the event whenever a change event happens.
   */
  validateOnChange: ValidateOnChange<S> =
    (onChange: (event: any) => any, state: S) =>
    (event: any): unknown => {
      this.validateIfTrue(event.target.name, {
        ...state,
        ...eventNameValue(event),
      });
      return onChange(event);
    };
}
