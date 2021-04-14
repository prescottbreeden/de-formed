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
exports.Validation = void 0;
const utilities_1 = require("./utilities");
const validation_functions_1 = require("./validation-functions");
const maybe_1 = require("./maybe");
const R = __importStar(require("ramda"));
const useCache = (initial) => {
    let value = initial;
    const setValue = (data) => {
        value = data;
        return data;
    };
    const retrieveValue = () => value;
    return [retrieveValue, setValue];
};
function Validation(validationSchema) {
    const [getValidationState, setValidationState] = utilities_1.compose(useCache, validation_functions_1.createValidationState)(validationSchema);
    const resetValidationState = () => {
        return utilities_1.compose(setValidationState, validation_functions_1.createValidationState)(validationSchema);
    };
    const validate = (property, value) => maybe_1.maybe(value)
        .map(validation_functions_1.updatePropertyOnState(validationSchema)(property))
        .map(R.mergeRight(getValidationState()))
        .map(utilities_1.executeSideEffect(setValidationState))
        .map(validation_functions_1.isPropertyValid(property))
        .chain(R.defaultTo(true));
    const validateAll = validation_functions_1.createValidateAll(validationSchema, getValidationState, setValidationState);
    const getError = (property, vState = getValidationState()) => {
        const error = maybe_1.maybe(vState)
            .map(utilities_1.prop(property))
            .map(utilities_1.prop('errors'))
            .map(R.head);
        return error.isJust ? error.join() : '';
    };
    const getAllErrors = (property, vState = getValidationState()) => {
        const errors = maybe_1.maybe(vState).map(utilities_1.prop(property)).map(utilities_1.prop('errors'));
        return errors.isJust ? errors.join() : [];
    };
    const gatherValidationErrors = (state) => Object.keys(utilities_1.getValue(state)).reduce((acc, curr) => {
        return getError(curr)
            ? [...acc, getError(curr)]
            : acc;
    }, []);
    const validationObject = {
        getAllErrors,
        getError,
        isValid: null,
        resetValidationState,
        setValidationState,
        validate,
        validateAll,
        validationErrors: null,
        validationState: null,
    };
    Object.defineProperty(validationObject, 'isValid', {
        get: () => validation_functions_1.calculateIsValid(getValidationState),
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
exports.Validation = Validation;
//# sourceMappingURL=index.js.map