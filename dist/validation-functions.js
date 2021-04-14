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
exports.createGenerateValidationErrors = exports.isValid = exports.createGetFieldValid = exports.createGetError = exports.createGetAllErrors = exports.createValidateAllIfTrue = exports.createValidateAll = exports.createValidateIfTrue = exports.createValidate = exports.updatePropertyOnState = exports.createValidationState = exports.isPropertyValid = exports.stringIsNotEmpty = exports.stringIsMoreThan = exports.stringIsLessThan = exports.prop = exports.compose = void 0;
const R = __importStar(require("ramda"));
const maybe_1 = require("./maybe");
const utilities_1 = require("./utilities");
Object.defineProperty(exports, "compose", { enumerable: true, get: function () { return utilities_1.compose; } });
Object.defineProperty(exports, "prop", { enumerable: true, get: function () { return utilities_1.prop; } });
Object.defineProperty(exports, "stringIsLessThan", { enumerable: true, get: function () { return utilities_1.stringIsLessThan; } });
Object.defineProperty(exports, "stringIsMoreThan", { enumerable: true, get: function () { return utilities_1.stringIsMoreThan; } });
Object.defineProperty(exports, "stringIsNotEmpty", { enumerable: true, get: function () { return utilities_1.stringIsNotEmpty; } });
exports.isPropertyValid = (property) => utilities_1.compose(R.defaultTo(true), R.path([property, 'isValid']));
function createValidationState(schema) {
    const buildState = (acc, key) => ({
        ...acc,
        [key]: { isValid: true, errors: [] },
    });
    const state = maybe_1.maybe(schema).map(R.keys).map(R.reduce(buildState, {}));
    return state.isJust ? state.join() : {};
}
exports.createValidationState = createValidationState;
;
function updatePropertyOnState(validationSchema) {
    return R.curry((property, value) => {
        const valueIsValid = R.pipe(utilities_1.prop('validation'), R.applyTo(value));
        const getErrorOrNone = R.ifElse(valueIsValid, R.always(''), R.prop('error'));
        const state = maybe_1.maybe(validationSchema)
            .map(utilities_1.prop(property))
            .map(R.values)
            .map(R.map(getErrorOrNone))
            .map(R.filter(utilities_1.stringIsNotEmpty))
            .map((errors) => ({ errors, isValid: !errors.length }))
            .map(R.assoc(property, R.__, {}));
        return state.isJust ? state.join() : {};
    });
}
exports.updatePropertyOnState = updatePropertyOnState;
function createValidate(validationState, setValidationState) {
    return (property, value) => maybe_1.maybe(value)
        .map(updatePropertyOnState(property))
        .map(R.mergeRight(validationState))
        .map(utilities_1.executeSideEffect(setValidationState))
        .map(exports.isPropertyValid(property))
        .chain(R.defaultTo(true));
}
exports.createValidate = createValidate;
function createValidateIfTrue(validationState, setValidationState) {
    return (property, value) => {
        const valid = maybe_1.maybe(value)
            .map(updatePropertyOnState(property))
            .map(R.mergeRight(validationState()))
            .map(R.ifElse(exports.isPropertyValid(property), utilities_1.executeSideEffect(setValidationState), R.always(null)))
            .map(exports.isPropertyValid(property));
        return valid.isJust ? valid.join() : true;
    };
}
exports.createValidateIfTrue = createValidateIfTrue;
function createValidateAll(validationSchema, validationState, setValidationState) {
    return (value, props = Object.keys(validationSchema)) => {
        const reduceStateUpdates = (acc, property) => ({
            ...acc,
            ...updatePropertyOnState(validationSchema)(property, value),
        });
        return maybe_1.maybe(props)
            .map(R.reduce(reduceStateUpdates, {}))
            .map(R.mergeRight(validationState))
            .map(utilities_1.executeSideEffect(setValidationState))
            .map(isValid)
            .chain(R.defaultTo(true));
    };
}
exports.createValidateAll = createValidateAll;
function createValidateAllIfTrue(validationSchema, validationState) {
    return (value, props = Object.keys(validationSchema)) => {
        const reduceValids = (acc, property) => {
            const updated = updatePropertyOnState(validationSchema)(property, value);
            return updated[property].isValid
                ? { ...acc, ...updated }
                : { ...acc, ...validationState()[property] };
        };
        return maybe_1.maybe(props)
            .map(R.reduce(reduceValids, {}))
            .map(R.mergeRight(validationState))
            .map(isValid)
            .chain(R.defaultTo(true));
    };
}
exports.createValidateAllIfTrue = createValidateAllIfTrue;
function createGetAllErrors(validationState) {
    return (property, vState = validationState()) => {
        const errors = maybe_1.maybe(vState).map(utilities_1.prop(property)).map(utilities_1.prop('errors'));
        return errors.isJust ? errors.join() : [];
    };
}
exports.createGetAllErrors = createGetAllErrors;
function createGetError(validationState) {
    return (property, vState = validationState()) => {
        const error = maybe_1.maybe(vState)
            .map(utilities_1.prop(property))
            .map(utilities_1.prop('errors'))
            .map(R.head);
        return error.isJust ? error.join() : '';
    };
}
exports.createGetError = createGetError;
function createGetFieldValid(validationState) {
    return (property, vState = validationState) => {
        const valid = maybe_1.maybe(vState).map(utilities_1.prop(property)).map(utilities_1.prop('isValid'));
        return valid.isJust ? valid.join() : true;
    };
}
exports.createGetFieldValid = createGetFieldValid;
function isValid(validationState) {
    return Object.keys(validationState()).reduce((acc, curr) => {
        return acc ? exports.isPropertyValid(curr)(validationState()) : acc;
    }, true);
}
exports.isValid = isValid;
;
function createGenerateValidationErrors() {
    return (state) => Object.keys(state()).reduce((acc, curr) => {
        return createGetError(state)(curr)
            ? [...acc, createGetError(state)(curr)]
            : acc;
    }, []);
}
exports.createGenerateValidationErrors = createGenerateValidationErrors;
//# sourceMappingURL=validation-functions.js.map