import { Maybe } from '../maybe';
import {
  eventNameValue,
  executeSideEffect,
  pipe,
  readValue,
  stringIsNotEmpty,
} from '../utilities';

describe('validation helpers', () => {
  describe('pipe', () => {
    it('pipe functions into one func', () => {
      const add = (a: number) => (b: number) => a + b;
      const add3 = pipe(add(1), add(2));
      expect(add3(1)).toBe(4);
    });
  });

  describe('executeSideEffect', () => {
    it('returns argument if function returns undefined', () => {
      const sideEffect = () => undefined;
      const funcy = executeSideEffect(sideEffect)(42);
      expect(funcy).toBe(42);
    });
  });

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

  describe('Maybe', () => {
    it('returns a value if it is just', () => {
      expect(Maybe.of(42).join()).toBe(42);
    });
    it('returns a maybe if it is not just', () => {
      expect(Maybe.of(null).join()).toStrictEqual(Maybe.of(null));
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
      expect(eventNameValue(event)).toStrictEqual({ title: '' });
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
      expect(eventNameValue(event)).toStrictEqual({ title: false });
    });
    it('returns an error if event has no target property', () => {
      const event = { };
      expect(eventNameValue(event)).toStrictEqual({ error: "unable to parse values" });
    });
  });
});
