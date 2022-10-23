import { Validation } from '../examples/vanilla';
import {
  UNIT_TEST,
  is,
  longerThan,
  matches,
  max,
  min,
  required,
  shorterThan,
} from '../src/auto-props';

const { gt, length, lt, match, pipe, trim, truthy, typeOf } = UNIT_TEST;

describe('predicates', () => {
  describe('gt', () => {
    it('returns true if 2 > 1', () => {
      expect(gt(1)(2)).toBe(true);
    });
  });
  describe('lt', () => {
    it('returns true if 1 < 2', () => {
      expect(lt(2)(1)).toBe(true);
    });
  });
  describe('match', () => {
    it('returns true if string matches regex', () => {
      expect(match(/dingo/)('dingo')).toBe(true);
    });
  });
  describe('truthy', () => {
    it('returns true if value is truthy', () => {
      expect(truthy('dingo')).toBe(true);
      expect(truthy('')).toBe(false);
      expect(truthy(undefined)).toBe(false);
      expect(truthy(null)).toBe(false);
    });
  });
});

describe('functional utils', () => {
  it('pipe', () => {
    const add = (a: number) => (b: number) => a + b;
    expect(pipe(add(1), add(2), add(3))(0)).toBe(6);
  });
});

describe('other', () => {
  describe('length', () => {
    it('returns length of array', () => {
      expect(length([1])).toBe(1);
    });
    it('returns length of string', () => {
      expect(length(['a'])).toBe(1);
    });
  });
  describe('trim', () => {
    it('returns a trimmed string', () => {
      expect(trim(' dingo ')).toBe('dingo');
    });
  });
  describe('typeOf', () => {
    it('returns true if type matches argument', () => {
      expect(typeOf('string')('dingo')).toBe(true);
      expect(typeOf('function')(() => null)).toBe(true);
      expect(typeOf('number')(42)).toBe(true);
    });
  });
});

describe('autoprops', () => {
  describe('required', () => {
    it('returns false if empty string', () => {
      const v = Validation<{ name: string }>({
        name: [required()],
      });
      expect(v.validate('name', { name: ' ' })).toBe(false);
      expect(v.validate('name', { name: 'dingo' })).toBe(true);
    });
    it('returns true if value is a number', () => {
      const v = Validation<{ age: number | undefined | null }>({
        age: [required()],
      });
      expect(v.validate('age', { age: undefined })).toBe(false);
      expect(v.validate('age', { age: null })).toBe(false);
      expect(v.validate('age', { age: 42 })).toBe(true);
    });
  });
  describe('matches', () => {
    it('returns false if string doesnt match autoprop', () => {
      const v = Validation<{ name: string }>({
        name: [matches(/bob ross/)],
      });
      expect(v.validate('name', { name: ' ' })).toBe(false);
      expect(v.validate('name', { name: 'bobross' })).toBe(false);
      expect(v.validate('name', { name: 'bob ross' })).toBe(true);
    });
    it('throws if you pass a non string', () => {
      const v = Validation<{ age: number }>({
        age: [matches(/bob ross/)],
      });
      expect(() => { v.validate('age', { age: 42 }) }).toThrowError(
        'matches must be used on a string but received 42',
      );
    });
  });
  describe('shorterThan', () => {
    it('returns false if string is longer than autoprop', () => {
      const v = Validation<{ name: string }>({
        name: [shorterThan(2)],
      });
      expect(v.validate('name', { name: 'aa ' })).toBe(false);
      expect(v.validate('name', { name: 'a ' })).toBe(true);
      expect(v.validate('name', { name: 'a' })).toBe(true);
    });
    it('throws if you pass a non string', () => {
      const v = Validation<{ age: number }>({
        age: [shorterThan(42)],
      });
      expect(() => { v.validate('age', { age: 42 }) }).toThrowError(
        'shorterThan must be used on a string but received 42',
      );
    });
  });
  describe('longerThan', () => {
    it('returns false string is shorter than autoprop', () => {
      const v = Validation<{ name: string }>({
        name: [longerThan(2)],
      });
      expect(v.validate('name', { name: ' ' })).toBe(false);
      expect(v.validate('name', { name: 'dingo' })).toBe(true);
    });
    it('throws if you pass a non string', () => {
      const v = Validation<{ age: number }>({
        age: [longerThan(42)],
      });
      expect(() => { v.validate('age', { age: 42 }) }).toThrowError(
        'longerThan must be used on a string but received 42',
      );
    });
  });
  describe('min', () => {
    it('returns false if value is less than autoprop', () => {
      const v = Validation<{ age: number }>({
        age: [min(18)],
      });
      expect(v.validate('age', { age: 17 })).toBe(false);
      expect(v.validate('age', { age: 18 })).toBe(true);
    });
    it('throws if you pass a non number', () => {
      const v = Validation<{ name: string }>({
        name: [min(42)],
      });
      expect(() => { v.validate('name', { name: 'dingo' }) }).toThrowError(
        'min requires a number representation but received dingo',
      );
    });
  });
  describe('max', () => {
    it('returns false value is greater than autoprop', () => {
      const v = Validation<{ age: number }>({
        age: [max(18)],
      });
      expect(v.validate('age', { age: 19 })).toBe(false);
      expect(v.validate('age', { age: 18 })).toBe(true);
    });
    it('throws if you pass a non number', () => {
      const v = Validation<{ name: string }>({
        name: [max(42)],
      });
      expect(() => { v.validate('name', { name: 'dingo' }) }).toThrowError(
        'max requires a number representation but received dingo',
      );
    });
  });
  describe('is', () => {
    it('returns false if strings dont match', () => {
      const v = Validation<{ name: string }>({
        name: [is('dingo')],
      });
      expect(v.validate('name', { name: ' ' })).toBe(false);
      expect(v.validate('name', { name: 'dingo' })).toBe(true);
    });
    it('returns false if numbers dont match', () => {
      const v = Validation<{ age: number }>({
        age: [is(42)],
      });
      expect(v.validate('age', { age: 9 })).toBe(false);
      expect(v.validate('age', { age: 42 })).toBe(true);
    });
    it('returns false if predicate reutns false', () => {
      const v = Validation<{ age: number }>({
        age: [is((val: number) => val === 42)],
      });
      expect(v.validate('age', { age: 9 })).toBe(false);
      expect(v.validate('age', { age: 42 })).toBe(true);
    });
  });
});
