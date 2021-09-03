import {
  ResetValidationState,
  ValidationSchema,
  ValidationState,
} from './types';
import { pipe } from './utilities';
import {
  calculateIsValid,
  createGetAllErrors,
  createGetError,
  createGetFieldValid,
  createValidate,
  createValidateAll,
  createValidateAllIfTrue,
  createValidateIfTrue,
  createValidateOnBlur,
  createValidateOnChange,
  createValidationState,
  gatherValidationErrors,
} from '../src';

// useCache :: none -> [f, g]
const useCache = (initial: ValidationState) => {
  let value = initial;
  const setValue = (data: ValidationState) => {
    value = data;
    return data;
  };
  const retrieveValue = () => value;
  return [retrieveValue, setValue];
};

export function Validation<S>(validationSchema: ValidationSchema<S>) {
  const [getValidationState, setValidationState] = pipe(
    createValidationState,
    useCache,
  )(validationSchema);

  const resetValidationState: ResetValidationState = (): void => {
    return pipe(createValidationState, setValidationState)(validationSchema);
  };

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

  const validationObject = {
    getAllErrors,
    getError,
    getFieldValid,
    isValid: null,
    resetValidationState,
    setValidationState,
    validate,
    validateAll,
    validateAllIfTrue,
    validateIfTrue,
    validateOnBlur,
    validateOnChange,
    validationErrors: null,
    validationState: null,
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
