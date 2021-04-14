import * as R from 'ramda';
import { maybe } from './maybe';
import {
  compose,
  executeSideEffect,
  getValue,
  prop,
  stringIsLessThan,
  stringIsMoreThan,
  stringIsNotEmpty,
} from './utilities';
import {
  GetAllErrors,
  GetError,
  GetFieldValid,
  IsValid,
  ResetValidationState,
  SetValidationState,
  ValidateAll,
  ValidateAllIfTrue,
  ValidateIfTrue,
  ValidateOnBlur,
  ValidateOnChange,
  ValidationSchema,
  ValidationState,
} from './types';

export { compose, prop, stringIsLessThan, stringIsMoreThan, stringIsNotEmpty };

export const isPropertyValid = <S>(property: keyof S) => compose(
  R.defaultTo(true),
  R.path([property as any, 'isValid'])
);

export function createValidationState<S>(schema: ValidationSchema<S>): ValidationState {
  const buildState = (acc: ValidationState, key: keyof S) => ({
    ...acc,
    [key]: { isValid: true, errors: [] },
  });
  const state = maybe(schema).map(R.keys).map(R.reduce(buildState, {}));
  return state.isJust ? state.join() : {};
};

// // resetValidationState :: () -> void
// export function resetValidationState<S>(validationSchema: ValidationSchema<S>){
//     const createVState = createValidationState(validationSchema);
//     return (setValidationState: SetValidationState) => {
//       const resetState = R.pipe(createVState, setValidationState);
//       return () => resetState(validationSchema);
//     }
// };

// updateValidationState :: ValidationState -> ValidationState
// export const updateValidationState = (setValidationState: SetValidationState) =>
//   executeSideEffect(setValidationState);
export const trace = (msg: string) => (x: any) => {
  console.log(msg, x);
  return x;
}

// updatePropertyOnState :: string -> x -> ValidationState
export function updatePropertyOnState<S>(validationSchema: ValidationSchema<S>) {
  return R.curry((property: keyof S, value: any) => {
    const valueIsValid = R.pipe(prop('validation'), R.applyTo(value));
    const getErrorOrNone = R.ifElse(
      valueIsValid,
      R.always(''),
      R.prop('error'),
    );
    const state = maybe(validationSchema)
      .map(prop(property))
      .map(R.values)
      .map(R.map(getErrorOrNone))
      .map(R.filter(stringIsNotEmpty))
      .map((errors: string[]) => ({ errors, isValid: !errors.length }))
      .map(R.assoc(property as any, R.__, {}));
    return state.isJust ? state.join() : {};
  });
}

// validate :: validationState -> (string, value) -> boolean
export function createValidate<S>(
  validationState: ValidationState,
  setValidationState: SetValidationState) {
  return (property: keyof S, value: any) =>
    maybe(value)
      .map(updatePropertyOnState(property as any))
      .map(R.mergeRight(validationState))
      .map(executeSideEffect(setValidationState))
      .map(isPropertyValid(property))
      .chain(R.defaultTo(true));
}


// validateIfTrue :: validationState (string , value) -> boolean
export function createValidateIfTrue<S>(
  validationState: () => ValidationState,
  setValidationState: SetValidationState) {
  return (property: keyof S, value: any) => {
    const valid = maybe(value)
      .map(updatePropertyOnState(property as any))
      .map(R.mergeRight(validationState()))
      .map(
        R.ifElse(
          isPropertyValid(property),
          executeSideEffect(setValidationState),
          R.always(null),
        ),
      )
      .map(isPropertyValid(property));
    return valid.isJust ? valid.join() : true;
  };
}

// validateAll :: (validationSchema, validationState) -> (x, [string]) -> boolean
export function createValidateAll<S>(
  validationSchema: ValidationSchema<S>,
  validationState: () => ValidationState,
  setValidationState: SetValidationState): ValidateAll<S> {
  return (
    value: any,
    props = Object.keys(validationSchema) as (keyof S)[],
  ) => {
    const reduceStateUpdates = (acc: ValidationState, property: keyof S) => ({
      ...acc,
      ...updatePropertyOnState(validationSchema)(property as any, value),
    });
    return maybe(props)
      .map(R.reduce(reduceStateUpdates, {}))
      .map(R.mergeRight(validationState))
      .map(executeSideEffect(setValidationState))
      .map(calculateIsValid)
      .chain(R.defaultTo(true));
  };
}

// validateAllIfTrue :: (validationSchema, validationState) -> (x, [string]) -> boolean
export function createValidateAllIfTrue<S>(
  validationSchema: ValidationSchema<S>,
  validationState: () => ValidationState) {
  return (
    value: any,
    props = Object.keys(validationSchema) as (keyof S)[],
  ) => {
    const reduceValids = (acc: ValidationState, property: keyof S) => {
      const updated = updatePropertyOnState(validationSchema)(property as any, value);
      return updated[property].isValid
        ? { ...acc, ...updated }
        : { ...acc, ...validationState()[property as any] };
    };
    return maybe(props)
      .map(R.reduce(reduceValids, {}))
      .map(R.mergeRight(validationState))
      .map(calculateIsValid)
      .chain(R.defaultTo(true));
  };
}

// getAllErrors :: validationState -> (string, ValidationState) -> [string]
export function createGetAllErrors<S>(validationState: () => ValidationState): GetAllErrors<S> {
  return (
    property: keyof S,
    vState = validationState(),
  ) => {
    const errors = maybe(vState).map(prop(property)).map(prop('errors'));
    return errors.isJust ? errors.join() : [];
  };
}

// getError :: validationState -> (string, ValidationState) -> string
export function createGetError<S>(validationState: () => ValidationState | ValidationState): GetError<S> {
  return (property: keyof S, vState = getValue(validationState)) => {
    const error = maybe(vState)
      .map(prop(property))
      .map(prop('errors'))
      .map(R.head);
    return error.isJust ? error.join() : '';
  };

}

// getFieldValid :: validationState -> (string, ValidationState) -> boolean
export function createGetFieldValid<S>(validationState: ValidationState): GetFieldValid<S> {
  return (property: any, vState = validationState) => {
    const valid = maybe(vState).map(prop(property)).map(prop('isValid'));
    return valid.isJust ? valid.join() : true;
  };
}

// isValid :: createIsValid -> ValidationState -> boolean
export function calculateIsValid(validationState: () => ValidationState | ValidationState): boolean {
  return Object.keys(getValue(validationState)).reduce((acc, curr) => {
    return acc ? isPropertyValid(curr)(getValue(validationState)) : acc
  }, true);
};

// export const gatherValidationErrors = (state: () => ValidationState) => 
//     Object.keys(getValue(state)).reduce(
//       (acc: string[], curr: string) => {
//         return createGetError(getValue(state))(curr as keyof S)
//           ? [...acc, createGetError(getValue(state))(curr as keyof S)]
//           : acc;
//       }, []);

