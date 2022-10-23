// // --[ Validation Object Types ]------------------------------------------------
export type GetAllErrors<S> = (property: keyof S) => string[];
export type GetError<S> = (property: keyof S) => string;
export type GetFieldValid<S> = (property: keyof S) => boolean;
export type ResetValidationState = () => void;
export type Validate<S> = (property: keyof S, value: S) => boolean;
export type ValidateAll<S> = (value: S, keys?: Array<keyof S>) => boolean;
export type ValidateAllIfDirty<S> = (
  value: S,
  keys?: Array<keyof S>,
) => boolean;
export type ValidateIfDirty<S> = (property: keyof S, value: S) => boolean;
export type ValidateOnBlur<S> = (value: S) => (event: any) => any;
export type ValidateOnChange<S> = (
  onChange: (event: any) => any,
  value: S,
) => (event: any) => any;

export type SetValidationState = (validationState: ValidationState) => void;
export interface ValidationObject<S> {
  getAllErrors: GetAllErrors<S>;
  getError: GetError<S>;
  getFieldValid: GetFieldValid<S>;
  isValid: boolean;
  resetValidationState: ResetValidationState;
  setValidationState: SetValidationState;
  validate: Validate<S>;
  validateAll: ValidateAll<S>;
  validateAllIfDirty: ValidateAllIfDirty<S>;
  validateIfDirty: ValidateIfDirty<S>;
  validateOnBlur: ValidateOnBlur<S>;
  validateOnChange: ValidateOnChange<S>;
  validationErrors: string[];
  validationState: ValidationState;
}

// --[ Schema Type ]------------------------------------------------------------
export type ValidationFunction<S> = (value: S) => boolean;
export type ValidationAutoProp = {
  auto: boolean;
  prop: <S>(prop: keyof S) => ValidationProps<S>;
};
export type Validation<S> =
  | {
      error: string | ((value: S) => string);
      validation: ValidationFunction<S>;
    }
  | ValidationAutoProp;
export type ValidationProps<S> = {
  error: string | ((value: S) => string);
  validation: ValidationFunction<S>;
};

export type ValidationSchema<S> =
  | { [key: string]: Array<Validation<S>> }
  | {
      [key: string]: any;
      fields: { [key: string]: any };
    }; // yup object

export interface ValidationStateProperty {
  dirty: boolean;
  errors: string[];
  isValid: boolean;
}

export type ValidationState = {
  [key: string]: ValidationStateProperty;
};

export type SchemaConfig = {
  yup?: boolean;
};
