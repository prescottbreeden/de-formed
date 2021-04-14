import { ValidationSchema, ValidationState } from '../types';
import { Validation } from '../index';
import {stringIsNotEmpty} from '../validation-functions';
import {compose, prop} from '../utilities';
import {defaultTo, equals, not} from 'ramda';

type TestSchema = {
  name: string;
  age: number;
  dingo?: boolean;
};

const schema: ValidationSchema<TestSchema> = {
  name: [
    {
      error: 'Name is required.',
      validation: compose(
        stringIsNotEmpty,
        defaultTo(''),
        prop('name')
      )
    },
    {
      error: 'Cannot be bob.',
      validation: compose(
        not,
        equals('bob'),
        prop('name'),
      )
    },
    {
      error: 'Must be dingo.',
      validation: (state: TestSchema) => {
        return state.dingo ? state.name === 'dingo' : true;
      },
    },
  ],
  age: [
    {
      error: 'Must be 18.',
      validation: (state: TestSchema) => state.age >= 18,
    },
  ],
};

const mockValidationState: ValidationState = {
  name: {
    isValid: true,
    errors: [],
  },
  age: {
    isValid: true,
    errors: [],
  },
};

const defaultState = {
  name: 'jack',
  dingo: false,
  age: 42,
};

const failingState = {
  ...defaultState,
  name: 'bob',
  age: 15,
};


describe('useValidation tests', () => {
  it('should be defined', () => {
    expect(Validation).toBeDefined();
  });

  it('builds the object correctly and checks types', () => {
    const v = Validation(schema);
    expect(typeof v.getError).toBe('function');
    expect(typeof v.getAllErrors).toBe('function');
    expect(typeof v.isValid).toBe('boolean');
    expect(typeof v.validate).toBe('function');
    expect(typeof v.validateAll).toBe('function');
    expect(Array.isArray(v.validationErrors)).toBe(true);
    expect(typeof v.validationState).toBe('object');
  });

  it('returns all functions and read-only objects defined by class', () => {
    const v = Validation(schema);
    expect(v.validationState).toStrictEqual(mockValidationState);
    expect(Object.keys(v)).toStrictEqual([
      'getAllErrors',
      'getError',
      'isValid',
      'resetValidationState',
      'setValidationState',
      'validate',
      'validateAll',
      'validationErrors',
      'validationState',
    ]);
  });

  describe('getError', () => {
    it('returns empty string by default', () => {
      const v = Validation(schema);
      const output = v.getError('name');
      expect(output).toBe('');
    });

    it('returns empty string if the property does not exist', () => {
      const v = Validation(schema);
      const output = v.getError('balls' as keyof TestSchema);
      expect(output).toBe('');
    });

    it('retrieves an error message', () => {
      const v = Validation(schema);
      v.validate('name', { name: '' });
      const output = v.getError('name');
      expect(output).toBe('Name is required.');
    });
  });

  describe('getAllErrors', () => {
    it('returns empty array by default', () => {
      const v = Validation(schema);
      const output = v.getAllErrors('name');
      expect(output).toStrictEqual([]);
    });

    it('returns empty array if the property does not exist', () => {
      const v = Validation(schema);
      const output = v.getAllErrors('balls' as keyof TestSchema);
      expect(output).toStrictEqual([]);
    });

    it('retrieves array of all error messages', () => {
      const v = Validation(schema);
      v.validate('name', { name: '', dingo: true });
      const output = v.getAllErrors('name');
      expect(output).toStrictEqual(['Name is required.', 'Must be dingo.']);
    });
  });

  describe('isValid', () => {
    it('returns true by default', () => {
      const v = Validation(schema);
      expect(v.isValid).toBe(true);
    });

    it('changes to false after a validation fails', () => {
      const v = Validation(schema);
      const output = v.validate('name', failingState);
      expect(v.isValid).toBe(output);
      expect(v.isValid).toBe(false);
    });

    it('changes to true after a failed validation passes', () => {
      const v = Validation(schema);
      v.validate('name', failingState);
      v.validate('name', defaultState);
      const output = v.isValid;
      expect(output).toBe(true);
    });
  });

  describe('validate', () => {
    it('returns a boolean if key exists', () => {
      const v = Validation(schema);
      const output = v.validate('name', defaultState);
      expect(typeof output).toBe('boolean');
    });

    it('returns true if key does not exist', () => {
      let output: boolean;
      const v = Validation(schema);
      const name = 'balls' as keyof TestSchema;
      output = v.validate(name, defaultState);
      expect(output).toBe(true);
    });

    it('updates the validationState when validation fails', () => {
      const v = Validation(schema);
      const validationState: ValidationState = {
        ...mockValidationState,
        name: {
          isValid: false,
          errors: ['Must be dingo.'],
        },
      };
      const state = { name: 'mary', dingo: true } as TestSchema;
      v.validate('name', state);
      expect(v.isValid).toBe(false);
      expect(v.validationState).toStrictEqual(validationState);
    });
  });

  describe('validateAll', () => {
    it('returns a boolean', () => {
      const v = Validation(schema);
      let output: boolean;
      output = v.validateAll(defaultState);
      expect(typeof output).toBe('boolean');
    });

    it('returns true if validations pass', () => {
      const v = Validation(schema);
      let output: boolean;
      output = v.validateAll(defaultState);
      expect(output).toBe(true);
    });

    it('returns false if any validation fails', () => {
      const v = Validation(schema);
      let output: boolean;
      output = v.validateAll(failingState);
      expect(output).toBe(false);
    });
  });

  describe('validationErrors', () => {
    it('returns an empty array', () => {
      const v = Validation(schema);
      expect(v.validationErrors).toStrictEqual([]);
    });

    it('returns an array of all errors', () => {
      const v = Validation(schema);
      v.validateAll(failingState);
      expect(v.validationErrors).toStrictEqual([
        'Cannot be bob.',
        'Must be 18.',
      ]);
    });
  });

  describe('resetValidationState', () => {
    it('resets the validation state', () => {
      const v = Validation(schema);
      v.validateAll(failingState);
      v.resetValidationState();
      expect(v.isValid).toBe(true);
    });
  });
  describe('validationErrors', () => {
    it('adds validation errors when validation state is invalid', () => {
      const v = Validation(schema);
      v.validateAll(failingState);
      expect(v.validationErrors).toStrictEqual([
        'Cannot be bob.',
        'Must be 18.',
      ]);
    });
    it('removes validation errors when validation state is valid', () => {
      const v = Validation(schema);
      v.validateAll(failingState);
      v.validateAll(defaultState);
      expect(v.validationErrors).toStrictEqual([]);
    });
  });

  describe('setValidationState', () => {
    it('overrides the existing validation state with a new one', () => {
      const v1 = Validation(schema);
      const v2 = Validation(schema);
      v1.validateAll(failingState);
      v2.setValidationState(v1.validationState);
      expect(v1.validationState).toStrictEqual(v2.validationState);
    });
  });
});


