<p align="center">
  <img src="https://user-images.githubusercontent.com/35798153/157611790-96f35e8b-ee4f-44e4-b3c9-1864900a02f2.png" />
</p>

[![npm version](https://badge.fury.io/js/@de-formed%2Fbase.svg)](https://badge.fury.io/js/@de-formed%2Fbase)
[![Known Vulnerabilities](https://snyk.io/test/github/prescottbreeden/de-formed/badge.svg)](https://snyk.io/test/github/prescottbreeden/de-formed)
![example workflow](https://github.com/prescottbreeden/de-formed/actions/workflows/main.yml/badge.svg)
[![codecov](https://codecov.io/gh/prescottbreeden/de-formed/branch/main/graph/badge.svg?token=a1u71NhJwb)](https://codecov.io/gh/prescottbreeden/de-formed)
![size](https://img.shields.io/bundlephobia/minzip/@de-formed/base)

@De-Formed Validations offers a highly customizable API to create form and data
validations. The functions in this library are aimed at unifying the
implementation of @De-Formed for targeted JavaScript libraries or frameworks.
Use these to either create an implementation for a library that doesn't exist
yet or to create your own variant that suits your needs.

@De-Formed is used and trusted in production at both Google and Microsoft.

## Why Use De-Formed?

1. **Modular** - decoupled from your form architecture.
1. **Composable** - turn your validations and forms into Lego bricks.
1. **Extendable** - add/modify the API as you see fit
1. **Unopinionated** - customize your UX to the Moon 🚀
1. **Lightweight** - [compare it on bundlephobia](https://bundlephobia.com/package/@de-formed/react-validations)
1. **Easy to Use** - its all functions
1. **Easy to Test** - unit test your validation rules, integration test their implementation

## Yup Compatible

If you are already using Yup or wish to use its schema design, simply pass your
Yup schema to De-Formed with the following config option

Config Object:

```
{
  yup: true
}
```

## Current Implementations

This repository is to generate customized De-Formed variants. If you are
looking for an existing solution, please visit one of the links below.

- [React Hook](https://github.com/prescottbreeden/de-formed-validations-react)
- [Node / VanillaJS](https://github.com/prescottbreeden/de-formed-validations-node)

## Install

```
yarn add @de-formed/base
```

```
npm i @de-formed/base
```

## Usage

There are a number of reasons you might wish to build your own customuized
Validation API:

1. An implementation of De-Formed doesn't work with your target framework
1. Integration directly with a different state engine (e.g., redux)
1. Simplify and slim down the API to the only the functionality desired
1. Extend and add custom functionality to the API not provided
1. Customize De-Formed to fit with other dependencies of your application

Perhaps you need De-Formed to kick off a redux action everytime a particular
validation fires? Perhaps you have a more preferred state engine you wish to
use? Instead of creating a wrapper around the default implementations which
creates an unecessary layer of abstraction, additional peformance cost, and
additional memory useage, you can simply import the factories and build your
own that suits your needs.

Implementing your own is as simple as using one of the current implementations
(e.g. @de-formed/react-validations or @de-formed/node-validations) as a
template and modify however you see fit. All you need is the factories provided
by @de-formed/base.

### Factories all the way down

De-Formed is built with factories that accept your state's getter and setter.
You can use the default implementation provided in `examples/vanilla.ts`, build
your own, or integrate with a state engine of your choosing. If you need further
customization, you can modify the factories themselves in `index.ts` and use
the `config` object to pass around additional settings. Most low-level
customizations will only require you to modify the `updateProperty` however (as
example) you may decide that expanding the validation state to contain
additional properties is benefitial for your particular needs.

### Providing State and a Config object

- `Config` is an optional object that can be read anywhere in de-formed to
  modify its behavior. Current implementations use this to provide Yup
  integration:

  (e.g., `{ yup: true }`)

- `ValidationState` can be an object or a function that returns an object
- `SetValidationState` is a function that updates the state
- How you want to provide state is purely up to you.

```ts
// example.ts
// a function that generates a validation object for a node application

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

  const resetValidationState: ResetValidationState = createResetValidationState(
    {
      config,
      setValidationState,
      validationSchema,
    },
  );

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
```

## Adding new implementations of @de-formed to NPM

If there is no current implementation that works for your framework in the
@De-Formed ecosystem you can open a feature request with a PR containing your
implementation to make it available for others. The current `ValidationObject`
type is the intended de-facto implementation and should be adheared to. If this
object is missing functionality you think would benefit @De-Formed, please make
a feature request and provide an example of what you would like to be
available. Please keep in mind, while enhancements will be eagerly read, a huge
motivation for @De-Formed is to keep it small. Keeping @De-Formed around 1-2kb
in size is very important to us.

## License

This project is licensed under the terms of the [MIT license](/LICENSE).
