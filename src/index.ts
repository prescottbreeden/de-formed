import {
  GetAllErrors,
  GetError,
  GetFieldValid,
  ResetValidationState,
  SetValidationState,
  Validate,
  ValidateAll,
  ValidateIfTrue,
  ValidateOnBlur,
  ValidateOnChange,
  ValidationFunction,
  ValidationSchema,
  ValidationState,
} from './types';
import { compose, prop } from './utilities';
import * as R from 'ramda';
import {createGetAllErrors, createGetError, createValidate, createValidateAll, createValidateAllIfTrue, createValidateIfTrue, createValidationState, isPropertyValid} from './validation-functions';

// useCache :: none -> [f, g]
const useCache = (initial: ValidationState) => {
  let value = initial;
  const setValue = (data: ValidationState) => {
    value = data;
    return data;
  }
  const getValue = () => value;
  return [getValue, setValue];
};

export function VO<S>(validationSchema: ValidationSchema<S>) {
  const [validationState, setValidationState] = compose(
    useCache,
    createValidationState,
  )(validationSchema);

  const resetValidationState: ResetValidationState = (): void => {
    return compose(
      setValidationState,
      createValidationState
    )(validationSchema);
  };

  const validate = createValidate(validationState, setValidationState);
  const validateAll = createValidateAll(
    validationSchema,
    validationState,
    setValidationState
  );
  const validateAllIfTrue = createValidateAllIfTrue(
    validationSchema,
    validationState
  );
  const validateIfTrue = createValidateIfTrue(
    validationState(),
    setValidationState);
  const getAllErrors = createGetAllErrors(validationState);
  const getError = createGetError(validationState);

  return {
    getAllErrors,
    getError,
    resetValidationState,
    validationState,
    validate,
    validateAll,
    validateAllIfTrue,
    validateIfTrue,
  }
}

export class Validation<S> {
  private _validationSchema: ValidationSchema<S>;
  private _validationState: ValidationState;

  public get isValid(): boolean {
    return this.allValid(this._validationState);
  }

  public get validationErrors(): string[] {
    const props = Object.keys(this._validationState);
    const errors = R.reduce(
      (acc: string[], curr: keyof S) => {
        const err = this.getError(curr);
        return err ? [...acc, err] : acc;
      },
      [],
      props as (keyof S)[],
    );
    return errors;
  }

  public get validationState(): ValidationState {
    return this._validationState;
  }


  /**
   *  Resets the validation state.
   */
  public resetValidationState: ResetValidationState = (): void => {
    this._validationState = createValidationState(this._validationSchema);
  };

  /**
   *  Overrides the existing validation state with another. WARNING: this feature
   *  is experimental and may be removed in future versions.
   *  @param newValidationState ValidationState
   */
  public setValidationState: SetValidationState = (
    newValidationState: ValidationState,
  ): void => {
    this._validationState = newValidationState;
  };

  private allValid = (state: ValidationState): boolean => {
    const keys = Object.keys(state);
    const valid = R.reduce(
      (acc: boolean, current: string) => {
        return acc ? isPropertyValid(current)(this._validationState) : acc;
      },
      true,
      keys,
    );
    return valid;
  };

  /**
   * Executes the value against all provided validation functions and updates
   * the validation state.
   * @param key string the name of the property being validated
   * @param value any the value to be tested for validation
   * @return true/false validation
   */
  private runAllValidators = (
    property: keyof S,
    state: S,
  ): ValidationState => {
    const runValidator = compose(
      (func: ValidationFunction<S>) => func(state),
      prop('validation'),
    );
    const bools: boolean[] = R.map(
      runValidator,
      prop(property, this._validationSchema),
    );
    const allValidationsValid: boolean = R.all(R.equals(true), bools);
    const errors = bools.reduce((acc: string[], curr: boolean, idx: number) => {
      const errorOf = compose(prop('errorMessage'), prop(idx), prop(property));
      return curr ? acc : [...acc, errorOf(this._validationSchema)];
    }, []);
    return {
      [property]: {
        isValid: allValidationsValid,
        errors: allValidationsValid ? [] : errors,
      },
    };
  };

  /**
   * Get the current error stored for a property on the validation object.
   * @param property the name of the property to retrieve
   * @return string
   */
  public getError: GetError<S> = (property: keyof S): string => {
    if (property in this._validationSchema) {
      const val = compose(R.head, prop('errors'), prop(property));
      return val(this._validationState) ? val(this._validationState) : '';
    }
    return '';
  };

  /**
   * Get the current error stored for a property on the validation object.
   * @param property the name of the property to retrieve
   * @return string[]
   */
  public getAllErrors: GetAllErrors<S> = (property: keyof S): string[] => {
    if (property in this._validationSchema) {
      const val = compose(prop('errors'), prop(property));
      return val(this._validationState);
    }
    return [];
  };

  /**
   * Get the current valid state stored for a property on the validation object.
   * If the property does not exist on the validationSchema getFieldValid will
   * return true by default.
   * @param property the name of the property to retrieve
   * @return boolean
   */
  public getFieldValid: GetFieldValid<S> = (
    property: keyof S,
  ): boolean => {
    if (property in this._validationSchema) {
      return isPropertyValid(property)(this._validationState);
    }
    return true;
  };

  /**
   * Executes a validation function on a value and updates the validation state.
   * @param property string the name of the property being validated
   * @param value any the value to be tested for validation
   * @return boolean
   */
  public validate: Validate<S> = (
    property: keyof S,
    state: S,
  ): boolean => {
    if (property in this._validationSchema) {
      const validations = this.runAllValidators(property, state);
      this._validationState = {
        ...this._validationState,
        ...validations,
      };
      return isPropertyValid(property)(this._validationState);
    }
    return true;
  };

  /**
   * Runs all validations against an object with all values and updates/returns
   * isValid state.
   * @param state any an object that contains all values to be validated
   * @param props string[] property names to check (optional)
   * @return boolean
   */
  public validateAll: ValidateAll<S> = (
    state: S,
    props: (keyof S)[] = Object.keys(this._validationSchema) as (keyof S)[],
  ): boolean => {
    const newState = R.reduce(
      (acc: ValidationState, property: keyof S) => {
        const r = this.runAllValidators(property, state);
        return { ...acc, ...r };
      },
      {},
      props,
    );
    this._validationState = newState;
    return this.allValid(newState);
  };

  /**
   * Updates the validation state if the validation succeeds.
   * @param key string the name of the property being validated
   * @param value any the value to be tested for validation
   * @return boolean
   */
  public validateIfTrue: ValidateIfTrue<S> = (
    property: keyof S,
    state: S,
  ): boolean => {
    if (property in this._validationSchema) {
      const validations = this.runAllValidators(property, state);
      if (isPropertyValid(property)(validations)) {
        const updated = { ...this._validationState, ...validations };
        this._validationState = updated;
      }
      return isPropertyValid(property)(validations);
    }
    return true;
  };

  /**
   * Create a new onBlur function that calls validate on a property matching the
   * name of the event whenever a blur event happens.
   * @param state the data controlling the form
   * @return function :: (event: any) => any
   */
  public validateOnBlur: ValidateOnBlur<S> = (state: S) => {
    return (event: any) => {
      const { value, name } = event.target;
      this.validate(name, {...state, [name]: value });
    };
  };

  /**
   * Create a new onChange function that calls validateIfTrue on a property
   * matching the name of the event whenever a change event happens.
   * @param onChange function to handle onChange events
   * @param state the data controlling the form
   * @return function :: (event: any) => any
   */
  public validateOnChange: ValidateOnChange<S> = (
    onChange: (event: any) => any,
    state: S,
  ) => {
    return (event: any) => {
      const { value, name } = event.target;
      this.validateIfTrue(name, { ...state, [name]: value });
      return onChange(event);
    };
  };
}

