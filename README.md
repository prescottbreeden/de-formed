# @De-Formed Validations

@De-Formed Validations offers a robust and unopinionated API to customize form and data validations. The functions in this library are aimed at unifying the implementation of @De-Formed for targeted JavaScript libraries or frameworks. Use these to either create an implementation for a library that doesn't exist yet or to create your own variant that suits your needs.

## Current Implementations
- [React Hook](https://github.com/prescottbreeden/de-formed-validations-react) 
- [Node / VanillaJS](https://github.com/prescottbreeden/de-formed-validations-node) 

## Install
```
yarn add @de-formed/base
```
```
npm i @de-formed/base
```
## Basic Usage

### Decide how you want to provide state and reusability
- `ValidationState` can be an object or a function that returns an object
- `SetValidationState` is a function that updates the state
- How you want to provide state is purely up to you.

```ts
// example.ts
// a function that generates a validation object for a node application

export function Validation<S>(validationSchema: ValidationSchema<S>) {
  // state can be handled however you wish, see example.ts for useCache code
  const [getValidationState, setValidationState] = useCache(
    createValidationState(validationSchema),
  );

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
```
## Coverage
![coverage](https://github.com/prescottbreeden/de-formed-validations-react/blob/master/coverage.png?raw=true)

## License

This project is licensed under the terms of the [MIT license](/LICENSE).
