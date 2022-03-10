<p align="center">
  <img src="https://user-images.githubusercontent.com/35798153/157611790-96f35e8b-ee4f-44e4-b3c9-1864900a02f2.png" />
</p>

[![npm version](https://badge.fury.io/js/@de-formed%2Fbase.svg)](https://badge.fury.io/js/@de-formed%2Fbase)
[![Known Vulnerabilities](https://snyk.io/test/github/prescottbreeden/de-formed/badge.svg)](https://snyk.io/test/github/prescottbreeden/de-formed)
![example workflow](https://github.com/prescottbreeden/de-formed/actions/workflows/main.yml/badge.svg)
[![codecov](https://codecov.io/gh/prescottbreeden/de-formed/branch/main/graph/badge.svg?token=a1u71NhJwb)](https://codecov.io/gh/prescottbreeden/de-formed)

@De-Formed Validations offers a robust and unopinionated API to customize form and data validations. The functions in this library are aimed at unifying the implementation of @De-Formed for targeted JavaScript libraries or frameworks. Use these to either create an implementation for a library that doesn't exist yet or to create your own variant that suits your needs.

## Current Implementations
Unless you are looking to create your own de-formed variant, you are in the wrong repository. Use one of the links below.
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

## License

This project is licensed under the terms of the [MIT license](/LICENSE).
