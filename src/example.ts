import { ValidationSchema, ValidationState } from './types';
import { createValidationState, BaseValidation } from '../src';
import { readValue } from './utilities';

// Use whatever kind of state management you like, this is a simple example
const useCache = (initial: ValidationState | (() => ValidationState)) => {
  let state = readValue(initial);
  const setValidationState = (data: ValidationState) => {
    state = data;
    return data;
  };
  const getValidationState = (): ValidationState => state;
  return { getValidationState, setValidationState };
};

// Once you have your state management plan, create a function that accepts a
// schema and injects your state
export function Validation<S>(validationSchema: ValidationSchema<S>) {
  const { getValidationState, setValidationState } = useCache(() =>
    createValidationState(validationSchema),
  );
  return new BaseValidation(
    validationSchema,
    getValidationState,
    setValidationState,
  );
}
