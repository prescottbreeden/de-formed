import { ResetValidationState, ValidationSchema } from './types';
export declare function Validation<S>(validationSchema: ValidationSchema<S>): {
    getAllErrors: (property: keyof S, vState?: any) => any;
    getError: (property: keyof S, vState?: any) => any;
    isValid: null;
    resetValidationState: ResetValidationState;
    setValidationState: any;
    validate: (property: keyof S, value: any) => any;
    validateAll: import("./types").ValidateAll<S>;
    validationErrors: null;
    validationState: null;
};
