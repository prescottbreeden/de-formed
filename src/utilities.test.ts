import {
  eventNameValue,
  generateError,
  readValue,
  startCase,
  stringIsNotEmpty,
} from '../src/utilities';

describe('utilties', () => {
  describe('startcase', () => {
    it('ignores undefined and null', () => {
      expect(startCase(null as any)).toBe('')
      expect(startCase(undefined as any)).toBe('')
    })
    it('title cases a camelCased propery', () => {
      expect(startCase('rubberBabyBuggyBumpers')).toBe('Rubber Baby Buggy Bumpers')
    })
    it('title cases a crazy object properties', () => {
      const props = {
        0: true,
        t0: true,
        $twenty2: true
      }
      const keys = Object.keys(props)
      expect(startCase(keys[0])).toBe('0')
      expect(startCase(keys[1])).toBe('T0')
      expect(startCase(keys[2])).toBe('$twenty2')
    })
  })
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
    it('throws an error if event has no target property', () => {
      const event = {};
      const willThrowError = () => {
        eventNameValue(event);
      };
      expect(willThrowError).toThrow(
        Error(
          `"eventNameValue" cannot read event object because it does not have a target property.`,
        ),
      );
    });
    it('throws an error if event is nullish', () => {
      const event = undefined;
      const willThrowError = () => {
        eventNameValue(event);
      };
      expect(willThrowError).toThrow(
        Error(
          `"eventNameValue" cannot read event object because it does not have a target property.`,
        ),
      );
    });
  });

  describe('generateError', () => {
    it('returns a string if given a string', () => {
      const result = generateError({ name: 'bob ross' }, 'bob ross is awesome');
      expect(result).toBe('bob ross is awesome');
    });
    it('returns a string if given a function', () => {
      const error = ({ name }: any) => `${name} is nifty`;
      const result = generateError({ name: 'bob ross' }, error);
      expect(result).toBe('bob ross is nifty');
    });
  });
});
