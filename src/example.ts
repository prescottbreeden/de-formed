import { ValidationObject, ValidationSchema, ValidationState } from './types';
import { pipe } from './utilities';
import {
  calculateIsValid,
  createGetAllErrors,
  createGetError,
  createGetFieldValid,
  createResetValidationState,
  createValidate,
  createValidateAll,
  createValidateAllIfTrue,
  createValidateIfTrue,
  createValidateOnBlur,
  createValidateOnChange,
  createValidationState,
  gatherValidationErrors,
} from '../src';

// useCache :: ValidationState -> [(unit -> ValidationState), (ValidationState -> unit)]
const useCache = (initial: ValidationState) => {
  let state = initial;
  const setState = (data: ValidationState) => {
    state = data;
    return data;
  };
  const retrieveState = () => state;
  return [retrieveState, setState];
};

export function Validation<S>(validationSchema: ValidationSchema<S>) {
  const [getValidationState, setValidationState] = pipe(
    createValidationState,
    useCache,
  )(validationSchema);

  const resetValidationState = createResetValidationState(
    validationSchema,
    setValidationState,
  );

  const validate = createValidate(
    validationSchema,
    getValidationState,
    setValidationState,
  );

  const validateAll = createValidateAll(
    validationSchema,
    getValidationState,
    setValidationState,
  );

  const validateAllIfTrue = createValidateAllIfTrue(
    validationSchema,
    getValidationState,
    setValidationState,
  );

  const validateIfTrue = createValidateIfTrue(
    validationSchema,
    getValidationState,
    setValidationState,
  );

  const validateOnBlur = createValidateOnBlur(
    validationSchema,
    getValidationState,
    setValidationState,
  );

  const validateOnChange = createValidateOnChange(
    validationSchema,
    getValidationState,
    setValidationState,
  );

  const getError = createGetError<S>(getValidationState);
  const getAllErrors = createGetAllErrors<S>(getValidationState);
  const getFieldValid = createGetFieldValid<S>(getValidationState);

  const validationObject: ValidationObject<S> = {
    getAllErrors,
    getError,
    getFieldValid,
    isValid: true,
    resetValidationState,
    setValidationState,
    validate,
    validateAll,
    validateAllIfTrue,
    validateIfTrue,
    validateOnBlur,
    validateOnChange,
    validationErrors: [],
    validationState: {},
  };

  Object.defineProperty(validationObject, 'isValid', {
    get: () => calculateIsValid(getValidationState),
    enumerable: true,
  });

  Object.defineProperty(validationObject, 'validationState', {
    get: getValidationState,
    enumerable: true,
  });

  Object.defineProperty(validationObject, 'validationErrors', {
    get: () => gatherValidationErrors(getValidationState),
    enumerable: true,
  });

  return validationObject;
}
