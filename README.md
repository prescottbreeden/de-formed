# @De-Formed Validations Constructors

@De-Formed Validations offers a robust and unopinionated API to customize form and data validations. The functions in this library are aimed at unifying the implementation of @De-Formed for targeted libraries or frameworks.

## Install
```
yarn add @de-formed/constructors
```
```
npm i @de-formed/constructors
```
## Basic Usage

### Step 1: Create a file to define your validations.
```ts
// example.ts
// a function that generates a validation object for a node application

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

  const validate = 
    createValidate(
      validationSchema,
      getValidationState,
      setValidationState
    );

  const validateAll = 
    createValidateAll(
      validationSchema,
      getValidationState,
      setValidationState
    );

  const validateAllIfTrue =
    createValidateAllIfTrue(
      validationSchema,
      getValidationState,
      setValidationState
  );

  const validateIfTrue = 
    createValidateIfTrue(
      validationSchema,
      getValidationState,
      setValidationState
  );

  const validateOnBlur =
    createValidateOnBlur(
      validationSchema,
      getValidationState,
      setValidationState
  );

  const validateOnChange =
    createValidateOnChange(
      validationSchema,
      getValidationState,
      setValidationState
  );

  const getError = createGetError<S>(getValidationState);
  const getAllErrors = createGetAllErrors<S>(getValidationState)
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
```
## Coverage
![coverage](https://github.com/prescottbreeden/de-formed-validations-react/blob/master/coverage.png?raw=true)

## License

This project is licensed under the terms of the [MIT license](/LICENSE).
