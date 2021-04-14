import {
  ResetValidationState,
  ValidationSchema,
  ValidationState,
} from './types';
import { compose, prop, executeSideEffect, getValue } from './utilities';
import {
  calculateIsValid,
  createValidateAll,
  createValidationState,
  isPropertyValid,
  updatePropertyOnState
} from './validation-functions';
import { maybe } from './maybe';
import * as R from 'ramda';

// useCache :: none -> [f, g]
const useCache = (initial: ValidationState) => {
  let value = initial;
  const setValue = (data: ValidationState) => {
    value = data;
    return data;
  }
  const retrieveValue = () => value;
  return [retrieveValue, setValue];
};

export function Validation<S>(validationSchema: ValidationSchema<S>) {
  const [getValidationState, setValidationState] = compose(
    useCache,
    createValidationState,
  )(validationSchema);

  const resetValidationState: ResetValidationState = (): void => {
    return compose(
      setValidationState,
      createValidationState
    )(validationSchema);
  };

  // const validate = createValidate(getValidationState, setValidationState);
  const validate = (property: keyof S, value: any) =>
    maybe(value)
      .map(updatePropertyOnState(validationSchema)(property as any))
      .map(R.mergeRight(getValidationState()))
      .map(executeSideEffect(setValidationState))
      .map(isPropertyValid(property))
      .chain(R.defaultTo(true));

  const validateAll = createValidateAll(
    validationSchema,
    getValidationState,
    setValidationState
  );

  const getError = (property: keyof S, vState = getValidationState()) => {
    const error = maybe(vState)
      .map(prop(property))
      .map(prop('errors'))
      .map(R.head);
    return error.isJust ? error.join() : '';
  }

  const getAllErrors = (
    property: keyof S,
    vState = getValidationState(),
  ) => {
    const errors = maybe(vState).map(prop(property)).map(prop('errors'));
    return errors.isJust ? errors.join() : [];
  };

  const gatherValidationErrors = (state: () => ValidationState) => 
    Object.keys(getValue(state)).reduce(
      (acc: string[], curr: string) => {
        return getError(curr as keyof S)
          ? [...acc, getError(curr as keyof S)]
          : acc;
      }, []);

  const validationObject = {
    getAllErrors,
    getError,
    isValid: null,
    resetValidationState,
    setValidationState,
    validate,
    validateAll,
    validationErrors: null,
    validationState: null,
  }

  Object.defineProperty(
    validationObject,
    'isValid', {
      get: () => calculateIsValid(getValidationState),
      enumerable: true,
    });

  Object.defineProperty(
    validationObject,
    'validationState', {
      get: getValidationState,
      enumerable: true,
    });

  Object.defineProperty(
    validationObject,
    'validationErrors', {
      get: () => gatherValidationErrors(getValidationState),
      enumerable: true,
    });

  return validationObject;
}

