import { ValidationSchema, ValidationState } from '../src/types';
import { Validation } from '../examples/vanilla';
import { readValue, stringIsNotEmpty } from '../src/utilities';

type TestSchema = {
  name: string;
  age: number;
  dingo: boolean;
  agreement: boolean;
};

const schema: ValidationSchema<TestSchema> = {
  name: [
    {
      error: 'Name is required.',
      validation: ({ name }) => stringIsNotEmpty(name),
    },
    {
      error: 'Cannot be bob.',
      validation: ({ name }) => name !== 'bob',
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
  agreement: [
    {
      error: 'Must accept terms.',
      validation: ({ agreement }) => Boolean(agreement),
    },
  ],
};

const mockValidationState: ValidationState = {
  name: {
    dirty: false,
    isValid: true,
    errors: [],
  },
  age: {
    dirty: false,
    isValid: true,
    errors: [],
  },
  agreement: {
    dirty: false,
    isValid: true,
    errors: [],
  },
};

const defaultState = {
  name: 'jack',
  dingo: false,
  age: 42,
  agreement: true,
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
    expect(v.validationState).toStrictEqual(mockValidationState);
  });

  it('handles a bogus schema', () => {
    const v = Validation(undefined as any);
    expect(v.isValid).toBe(true);
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
      v.validate('name', { name: '' } as TestSchema);
      const output = v.getError('name');
      expect(output).toBe('Name is required.');
    });
  });

  describe('getFieldValid', () => {
    it('returns true by default', () => {
      const v = Validation(schema);
      const output = v.getFieldValid('name');
      expect(output).toBe(true);
    });
    it('returns true if the property does not exist', () => {
      const v = Validation(schema);
      const output = v.getFieldValid('balls' as keyof TestSchema);
      expect(output).toBe(true);
    });
    it('retrieves an invalid state', () => {
      const v = Validation(schema);
      const state = {
        ...defaultState,
        name: '',
      };
      v.validate('name', state);
      const output = v.getFieldValid('name');
      expect(output).toBe(false);
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
      v.validate('name', { name: '', dingo: true } as TestSchema);
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
          dirty: true,
          errors: ['Must be dingo.'],
          isValid: false,
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
    it('returns true if given bogus property names', () => {
      const v = Validation(schema);
      let output: boolean;
      output = v.validateAll(failingState, ['dingo', 'jack'] as any);
      expect(output).toBe(true);
    });
    it('updates the validation state', () => {
      const v = Validation(schema);
      v.validateAll(failingState);
      expect(v.validationState).toStrictEqual({
        age: {
          dirty: true,
          errors: ["Must be 18."],
          isValid: false
        },
        agreement: {
          dirty: true,
          errors: [],
          isValid: true
        },
        name: {
          dirty: true,
          errors: ["Cannot be bob."],
          isValid: false
        },
      });
      v.validateIfDirty('name', { ...failingState, name: 'dingo' });
      expect(v.validationState).toStrictEqual({
        age: {
          dirty: true,
          errors: ["Must be 18."],
          isValid: false
        },
        agreement: {
          dirty: true,
          errors: [],
          isValid: true
        },
        name: {
          dirty: true,
          errors: [],
          isValid: true
        },
      });
    })
  });

  describe('validateAllIfDirty', () => {
    it('returns a boolean', () => {
      const v = Validation(schema);
      v.validateAll(failingState)
      const output = v.validateAllIfDirty(defaultState);
      expect(typeof output).toBe('boolean');
    });
    it('returns true if validations pass', () => {
      const v = Validation(schema);
      v.validateAll(failingState)
      const output = v.validateAllIfDirty(defaultState);
      expect(output).toBe(true);
    });
    it('ignores failing validations', () => {
      const v = Validation(schema);
      const output = v.validateAllIfDirty(failingState);
      expect(output).toBe(true);
    });
    it('handles nested validation reductions', () => {
      const data = [defaultState, defaultState, defaultState];
      const v = Validation(schema);
      v.validateAll(failingState)
      const output = data.map((s) => v.validateAllIfDirty(s));
      expect(output).toStrictEqual([true, true, true]);
    });
    it('validates a subsection of keys', () => {
      const v = Validation(schema);
      v.validateAllIfDirty(failingState);
      expect(v.getError('age')).toBe('');
      v.validateAllIfDirty(failingState, ['name']);
      expect(v.getError('age')).toBe('');
    });
    it('handles missing properties', () => {
      const wonkySchema = {
        ...schema,
        canSave: [
          {
            error: 'you cannot save',
            validation: (state: any) => !!state.name,
          },
        ],
      };
      const v = Validation(wonkySchema);
      v.validateAllIfDirty(failingState);
      expect(v.getError('canSave' as keyof TestSchema)).toBe('');
    });
    it('returns true if given bogus property names', () => {
      const v = Validation(schema);
      let output: boolean;
      output = v.validateAllIfDirty(failingState, ['dingo', 'jack'] as any);
      expect(output).toBe(true);
    });
  });

  describe('validateIfDirty', () => {
    it('returns a boolean if key exists', () => {
      const v = Validation(schema);
      const state = {
        ...defaultState,
        name: 'bob',
      };
      const output = v.validateIfDirty('name', state);
      expect(typeof output).toBe('boolean');
    });
    it('returns true if key does not exist', () => {
      const v = Validation(schema);
      const name = 'balls' as keyof TestSchema;
      const state = {
        ...defaultState,
        name: 'bob',
      };
      const output = v.validateIfDirty(name, state);
      expect(output).toBe(true);
    });
    it('updates the validationState when validation fails', () => {
      const v = Validation(schema);
      const name = 'name';
      const state = {
        ...defaultState,
        name: 'chuck',
        dingo: true,
      };
      v.validateIfDirty(name, state);
      expect(v.isValid).toBe(true);
      expect(v.validationState).toStrictEqual(mockValidationState);
    });
    it('updates the validationState when an invalid validation succeeds', () => {
      const v = Validation(schema);
      const state = {
        ...defaultState,
        name: 'bob',
      };
      const state2 = {
        ...defaultState,
        name: 'jack',
      };
      v.validate('name', state);
      expect(v.isValid).toBe(false);
      v.validateIfDirty('name', state2);
      expect(v.isValid).toBe(true);
      expect(v.validationState).toStrictEqual({
        ...mockValidationState,
        name: {
          dirty: true,
          errors: [],
          isValid: true
        }
      });
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

  describe('createValidateOnBlur', () => {
    it('creates a function that calls validate when given an event', () => {
      const v = Validation(schema);
      const handleBlur = v.validateOnBlur(defaultState);
      const event = {
        target: {
          name: 'name',
          value: 'bob',
        },
      };
      expect(v.isValid).toBe(true);
      handleBlur(event);
      expect(v.isValid).toBe(false);
    });
  });

  describe('createValidateOnChange', () => {
    describe('creates a function that calls validateIfDirty when given an event', () => {
      // useCache :: none -> [f, g]
      function useCache<S>(initial: S) {
        let value = initial;
        const setValue = (data: S) => {
          value = data;
          return data;
        };
        const retrieveValue = () => value;
        return [retrieveValue, setValue];
      }
      it('does not update falsey events', () => {
        const v = Validation(schema);
        const onChange = (x: any) => x;
        const handleChange = v.validateOnChange(onChange, defaultState);
        const event = {
          target: {
            name: 'name',
            value: '',
          },
        };
        handleChange(event);
        expect(v.isValid).toBe(true);
      });
      it('updates truthy events', () => {
        const [getState] = useCache(failingState);
        const v = Validation(schema);
        const onChange = (x: any) => x;
        const handleChange = v.validateOnChange(onChange, readValue(getState));
        const event = {
          target: {
            name: 'name',
            value: 'notbob',
          },
        };
        v.validate('name', failingState);
        expect(v.getFieldValid('name')).toBe(false);
        handleChange(event);
        expect(v.getFieldValid('name')).toBe(true);
      });
      it('updates checked values', () => {
        const [getState] = useCache(failingState);
        const v = Validation(schema);
        const onChange = (x: any) => x;
        const handleChange = v.validateOnChange(onChange, readValue(getState));
        const event = {
          target: {
            name: 'agreement',
            checked: true,
            type: 'checkbox',
          },
        };
        v.validate('agreement', { ...defaultState, agreement: false });
        expect(v.getFieldValid('agreement')).toBe(false);
        handleChange(event);
        expect(v.getFieldValid('agreement')).toBe(true);
      });
    });
  });
});
