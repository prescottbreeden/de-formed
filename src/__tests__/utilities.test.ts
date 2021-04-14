import {
  stringIsLessThan,
  stringIsMoreThan,
  stringIsNotEmpty
} from '../utilities';

describe('validation helpers', () => {
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

  describe('stringIsLessThan', () => {
    it('returns true if string has length less than argument', () => {
      expect(stringIsLessThan(6, "dingo")).toBe(true);
    });
    it('returns false if string has more length than argument', () => {
      expect(stringIsLessThan(0, "f")).toBe(false);
    });
    it('trims whitespace', () => {
      expect(stringIsLessThan(2, " s")).toBe(true);
    });
  });

  describe('stringIsMoreThan', () => {
    it('returns true if string has more less than argument', () => {
      expect(stringIsMoreThan(5, "dingo")).toBe(false);
    });
    it('returns false if string has more length than argument', () => {
      expect(stringIsMoreThan(0, "f")).toBe(true);
    });
    it('trims whitespace', () => {
      expect(stringIsMoreThan(1, " s")).toBe(false);
    });
  });
});
