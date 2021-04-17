import {
  compose,
  executeSideEffect,
  prop,
  readValue,
  stringIsNotEmpty
} from '../utilities';

describe('validation helpers', () => {
  describe('compose', () => {
    it('composes functions into one func', () => {
      const add = (a: number) => (b: number) => a + b;
      const add3 = compose(
        add(1),
        add(2),
      );
      expect(add3(1)).toBe(4);
    });
  });

  describe('prop', () => {
    it('returns undefined if object is null or undefined', () => {
      expect(prop('dingo', null)).toBe(undefined);
      expect(prop('dingo', undefined)).toBe(undefined);
    });
  });

  describe('executeSideEffect', () => {
    it('returns argument if function returns undefined', () => {
      const sideEffect = (x: any) => undefined;
      const funcy = executeSideEffect(sideEffect, 42);
      expect(funcy).toBe(42);
    });
  });

  describe('stringIsNotEmpty', () => {
    it('returns true if string has length', () => {
      expect(stringIsNotEmpty("dingo")).toBe(true);
    });
    it('returns false if string has no length', () => {
      expect(stringIsNotEmpty("")).toBe(false);
    });
    it('returns false if string has white space', () => {
      expect(stringIsNotEmpty(" ")).toBe(false);
    });
  });

  describe('readValue', () => {
    it('returns a value if it is a value', () => {
      expect(readValue("dingo")).toBe("dingo");
    });
    it('returns the function call if it is a function', () => {
      expect(readValue(() => "dingo")).toBe("dingo");
    });
  });
});
