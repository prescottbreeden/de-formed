import {
  SchemaConfig,
  ValidationSchema,
  ValidationState,
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
const useState = <T>(initial: T | (() => T)): [() => T, (data: T) => T] => {
  let _state = readValue(initial);
  const setState = (data: T) => {
    _state = data;
    return data;
  };
  const state = () => _state;
  return [state, setState];
};

export function Validation<S>(
  validationSchema: ValidationSchema<S>,
  config?: SchemaConfig,
) {
  const [validationState, setValidationState] = useState<ValidationState>(
    createValidationState({
      validationSchema,
      config,
    }),
  );

  const resetValidationState = createResetValidationState({
    config,
    setValidationState,
    validationSchema,
  });

  const validate = createValidate({
    config,
    setValidationState,
    validationSchema,
    validationState,
  });

  const validateAll = createValidateAll({
    config,
    setValidationState,
    validationSchema,
    validationState,
  });

  const validateAllIfDirty = createValidateAllIfDirty({
    config,
    setValidationState,
    validationSchema,
    validationState,
  });

  const validateIfDirty = createValidateIfDirty({
    config,
    setValidationState,
    validationSchema,
    validationState,
  });

  const validateOnBlur = createValidateOnBlur({
    config,
    setValidationState,
    validationSchema,
    validationState,
  });

  const validateOnChange = createValidateOnChange({
    config,
    setValidationState,
    validationSchema,
    validationState,
  });

  const getError = createGetError<S>(validationState);
  const getAllErrors = createGetAllErrors<S>(validationState);
  const getFieldValid = createGetFieldValid<S>(validationState);

  const validationObject = {
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
    get: () => calculateIsValid(validationState),
    enumerable: true,
  });

  Object.defineProperty(validationObject, 'validationState', {
    get: validationState,
    enumerable: true,
  });

  Object.defineProperty(validationObject, 'validationErrors', {
    get: () => gatherValidationErrors(validationState),
    enumerable: true,
  });

  return validationObject;
}
