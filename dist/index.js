"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validation = exports.VO = void 0;
const utilities_1 = require("./utilities");
const R = __importStar(require("ramda"));
const validation_functions_1 = require("./validation-functions");
const useCache = (initial) => {
    let value = initial;
    const setValue = (data) => {
        value = data;
        return data;
    };
    const getValue = () => value;
    return [getValue, setValue];
};
function VO(validationSchema) {
    const [validationState, setValidationState] = utilities_1.compose(useCache, validation_functions_1.createValidationState)(validationSchema);
    const resetValidationState = () => {
        return utilities_1.compose(setValidationState, validation_functions_1.createValidationState)(validationSchema);
    };
    const validate = validation_functions_1.createValidate(validationState, setValidationState);
    const validateAll = validation_functions_1.createValidateAll(validationSchema, validationState, setValidationState);
    const validateAllIfTrue = validation_functions_1.createValidateAllIfTrue(validationSchema, validationState);
    const validateIfTrue = validation_functions_1.createValidateIfTrue(validationState(), setValidationState);
    const getAllErrors = validation_functions_1.createGetAllErrors(validationState);
    const getError = validation_functions_1.createGetError(validationState);
    return {
        getAllErrors,
        getError,
        resetValidationState,
        validationState,
        validate,
        validateAll,
        validateAllIfTrue,
        validateIfTrue,
    };
}
exports.VO = VO;
class Validation {
    constructor() {
        this.resetValidationState = () => {
            this._validationState = validation_functions_1.createValidationState(this._validationSchema);
        };
        this.setValidationState = (newValidationState) => {
            this._validationState = newValidationState;
        };
        this.allValid = (state) => {
            const keys = Object.keys(state);
            const valid = R.reduce((acc, current) => {
                return acc ? validation_functions_1.isPropertyValid(current)(this._validationState) : acc;
            }, true, keys);
            return valid;
        };
        this.runAllValidators = (property, state) => {
            const runValidator = utilities_1.compose((func) => func(state), utilities_1.prop('validation'));
            const bools = R.map(runValidator, utilities_1.prop(property, this._validationSchema));
            const allValidationsValid = R.all(R.equals(true), bools);
            const errors = bools.reduce((acc, curr, idx) => {
                const errorOf = utilities_1.compose(utilities_1.prop('errorMessage'), utilities_1.prop(idx), utilities_1.prop(property));
                return curr ? acc : [...acc, errorOf(this._validationSchema)];
            }, []);
            return {
                [property]: {
                    isValid: allValidationsValid,
                    errors: allValidationsValid ? [] : errors,
                },
            };
        };
        this.getError = (property) => {
            if (property in this._validationSchema) {
                const val = utilities_1.compose(R.head, utilities_1.prop('errors'), utilities_1.prop(property));
                return val(this._validationState) ? val(this._validationState) : '';
            }
            return '';
        };
        this.getAllErrors = (property) => {
            if (property in this._validationSchema) {
                const val = utilities_1.compose(utilities_1.prop('errors'), utilities_1.prop(property));
                return val(this._validationState);
            }
            return [];
        };
        this.getFieldValid = (property) => {
            if (property in this._validationSchema) {
                return validation_functions_1.isPropertyValid(property)(this._validationState);
            }
            return true;
        };
        this.validate = (property, state) => {
            if (property in this._validationSchema) {
                const validations = this.runAllValidators(property, state);
                this._validationState = {
                    ...this._validationState,
                    ...validations,
                };
                return validation_functions_1.isPropertyValid(property)(this._validationState);
            }
            return true;
        };
        this.validateAll = (state, props = Object.keys(this._validationSchema)) => {
            const newState = R.reduce((acc, property) => {
                const r = this.runAllValidators(property, state);
                return { ...acc, ...r };
            }, {}, props);
            this._validationState = newState;
            return this.allValid(newState);
        };
        this.validateIfTrue = (property, state) => {
            if (property in this._validationSchema) {
                const validations = this.runAllValidators(property, state);
                if (validation_functions_1.isPropertyValid(property)(validations)) {
                    const updated = { ...this._validationState, ...validations };
                    this._validationState = updated;
                }
                return validation_functions_1.isPropertyValid(property)(validations);
            }
            return true;
        };
        this.validateOnBlur = (state) => {
            return (event) => {
                const { value, name } = event.target;
                this.validate(name, { ...state, [name]: value });
            };
        };
        this.validateOnChange = (onChange, state) => {
            return (event) => {
                const { value, name } = event.target;
                this.validateIfTrue(name, { ...state, [name]: value });
                return onChange(event);
            };
        };
    }
    get isValid() {
        return this.allValid(this._validationState);
    }
    get validationErrors() {
        const props = Object.keys(this._validationState);
        const errors = R.reduce((acc, curr) => {
            const err = this.getError(curr);
            return err ? [...acc, err] : acc;
        }, [], props);
        return errors;
    }
    get validationState() {
        return this._validationState;
    }
}
exports.Validation = Validation;
//# sourceMappingURL=index.js.map