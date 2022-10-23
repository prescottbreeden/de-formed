import {
  GetAllErrors,
  GetError,
  GetFieldValid,
  ResetValidationState,
  SchemaConfig,
  Validate,
  ValidateAll,
  ValidateAllIfDirty,
  ValidateIfDirty,
  ValidateOnBlur,
  ValidateOnChange,
  ValidationObject,
  ValidationSchema,
  ValidationState,
} from '../src/types';
import {
  calculateIsValid,
  createGetAllErrors,
  createGetError,
  createGetFieldValid,
  createResetValidationState,
  createValidate,
  createValidateAll,
  createValidateAllIfDirty,
  createValidateIfDirty,
  createValidateOnBlur,
  createValidateOnChange,
  createValidationState,
  gatherValidationErrors,
} from '../src';
import { readValue } from '../src/utilities';

// Use whatever kind of statemanagement you like, or use something simple like this
const useCache = (
  initial: ValidationState | (() => ValidationState),
): [() => ValidationState, (data: ValidationState) => ValidationState] => {
  let state = readValue(initial);
  const setValidationState = (data: ValidationState) => {
    state = data;
    return data;
  };
  const getValidationState = () => state;
  return [getValidationState, setValidationState];
};

export function Validation<S>(
  validationSchema: ValidationSchema<S>,
  config?: SchemaConfig,
) {
  const [getValidationState, setValidationState] = useCache(
    createValidationState({
      validationSchema,
      config,
    }),
  );

  const resetValidationState: ResetValidationState =
    createResetValidationState({
      config,
      setValidationState,
      validationSchema,
    });

  const validate: Validate<S> = createValidate({
    config,
    setValidationState,
    validationSchema,
    validationState: getValidationState,
  });

  const validateAll: ValidateAll<S> = createValidateAll({
    config,
    setValidationState,
    validationSchema,
    validationState: getValidationState,
  });

  const validateAllIfDirty: ValidateAllIfDirty<S> = createValidateAllIfDirty({
    config,
    setValidationState,
    validationSchema,
    validationState: getValidationState,
  });

  const validateIfDirty: ValidateIfDirty<S> = createValidateIfDirty({
    config,
    setValidationState,
    validationSchema,
    validationState: getValidationState,
  });

  const validateOnBlur: ValidateOnBlur<S> = createValidateOnBlur({
    config,
    setValidationState,
    validationSchema,
    validationState: getValidationState,
  });

  const validateOnChange: ValidateOnChange<S> = createValidateOnChange({
    config,
    setValidationState,
    validationSchema,
    validationState: getValidationState,
  });

  const getError: GetError<S> = createGetError<S>(getValidationState);

  const getAllErrors: GetAllErrors<S> =
    createGetAllErrors<S>(getValidationState);

  const getFieldValid: GetFieldValid<S> =
    createGetFieldValid<S>(getValidationState);

  const validationObject: ValidationObject<S> = {
    getAllErrors,
    getError,
    getFieldValid,
    isValid: true,
    resetValidationState,
    setValidationState,
    validate,
    validateAll,
    validateAllIfDirty,
    validateIfDirty,
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
