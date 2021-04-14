import { GetAllErrors, GetError, GetFieldValid, ResetValidationState, SetValidationState, Validate, ValidateAll, ValidateIfTrue, ValidateOnBlur, ValidateOnChange, ValidationSchema, ValidationState } from './types';
export declare function VO<S>(validationSchema: ValidationSchema<S>): {
    getAllErrors: GetAllErrors<unknown>;
    getError: GetError<unknown>;
    resetValidationState: ResetValidationState;
    validationState: any;
    validate: (property: never, value: any) => any;
    validateAll: ValidateAll<S>;
    validateAllIfTrue: (value: any, props?: (keyof S)[]) => any;
    validateIfTrue: (property: never, value: any) => any;
};
export declare class Validation<S> {
    private _validationSchema;
    private _validationState;
    get isValid(): boolean;
    get validationErrors(): string[];
    get validationState(): ValidationState;
    resetValidationState: ResetValidationState;
    setValidationState: SetValidationState;
    private allValid;
    private runAllValidators;
    getError: GetError<S>;
    getAllErrors: GetAllErrors<S>;
    getFieldValid: GetFieldValid<S>;
    validate: Validate<S>;
    validateAll: ValidateAll<S>;
    validateIfTrue: ValidateIfTrue<S>;
    validateOnBlur: ValidateOnBlur<S>;
    validateOnChange: ValidateOnChange<S>;
}
