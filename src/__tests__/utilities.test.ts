import { eventNameValue, readValue, stringIsNotEmpty } from '../utilities';

describe('validation helpers', () => {
  describe('stringIsNotEmpty', () => {
    it('returns true if string has length', () => {
      expect(stringIsNotEmpty('dingo')).toBe(true);
    });
    it('returns false if string has no length', () => {
      expect(stringIsNotEmpty('')).toBe(false);
    });
    it('returns false if string has white space', () => {
      expect(stringIsNotEmpty(' ')).toBe(false);
    });
  });

  describe('readValue', () => {
    it('returns a value if it is a value', () => {
      expect(readValue('dingo')).toBe('dingo');
    });
    it('returns the function call if it is a function', () => {
      expect(readValue(() => 'dingo')).toBe('dingo');
    });
  });

  describe('eventNameValue', () => {
    it('returns the value of a text event', () => {
      const event = {
        target: {
          name: 'title',
          checked: false,
          type: 'text',
          value: '',
        },
      };
      expect(eventNameValue(event as any)).toStrictEqual({ title: '' });
    });
    it('returns the value of a checkbox event', () => {
      const event = {
        target: {
          name: 'title',
          checked: false,
          type: 'checkbox',
          value: '',
        },
      };
      expect(eventNameValue(event as any)).toStrictEqual({ title: false });
    });
    it('returns an error if event has no target property', () => {
      const event = {};
      expect(eventNameValue(event as any)).toStrictEqual({
        error: 'unable to parse values',
      });
    });
  });
});
