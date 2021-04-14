/// <reference types="ts-toolbelt" />
import { compose, prop, stringIsLessThan, stringIsMoreThan, stringIsNotEmpty } from './utilities';
import { GetAllErrors, GetError, GetFieldValid, SetValidationState, ValidateAll, ValidationSchema, ValidationState } from './types';
export { compose, prop, stringIsLessThan, stringIsMoreThan, stringIsNotEmpty };
export declare const isPropertyValid: <S>(property: keyof S) => (...args: any[]) => any;
export declare function createValidationState<S>(schema: ValidationSchema<S>): ValidationState;
export declare function updatePropertyOnState<S>(validationSchema: ValidationSchema<S>): import("Function/Curry").Curry<(property: keyof S, value: any) => any>;
export declare function createValidate<S>(validationState: ValidationState, setValidationState: SetValidationState): (property: keyof S, value: any) => any;
export declare function createValidateIfTrue<S>(validationState: () => ValidationState, setValidationState: SetValidationState): (property: keyof S, value: any) => any;
export declare function createValidateAll<S>(validationSchema: ValidationSchema<S>, validationState: () => ValidationState, setValidationState: SetValidationState): ValidateAll<S>;
export declare function createValidateAllIfTrue<S>(validationSchema: ValidationSchema<S>, validationState: () => ValidationState): (value: any, props?: (keyof S)[]) => any;
export declare function createGetAllErrors<S>(validationState: () => ValidationState): GetAllErrors<S>;
export declare function createGetError<S>(validationState: () => ValidationState): GetError<S>;
export declare function createGetFieldValid<S>(validationState: ValidationState): GetFieldValid<S>;
export declare function isValid(validationState: () => ValidationState): boolean;
export declare function createGenerateValidationErrors(): (state: () => ValidationState) => string[];
