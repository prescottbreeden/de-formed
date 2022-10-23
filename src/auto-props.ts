import startCase from 'lodash.startcase';

// --[ errors ]----------------------------------------------------------------
const err = (error: string) => (recieved: any) => {
  throw new Error(`${error} but received ${recieved}`);
};
const longerThanError = err('longerThan must be used on a string');
const shorterThanError = err('shorterThan must be used on a string');
const matchesError = err('matches must be used on a string');
const minError = err('min requires a number representation');
const maxError = err('max requires a number representation');

// --[ fucntional utils ]------------------------------------------------------
const trim = (value: any) => value.trim();
const truthy = (value: any) => !!value;
const pipe =
  (...fns: Function[]) =>
  (arg: any) =>
    fns.reduce((acc, curr) => curr(acc), arg);
const cond = (predicateFnMatrix: Function[][]) => (arg: any) => {
  for (const [predicate, func] of predicateFnMatrix) {
    if (predicate(arg)) return func(arg);
  }
};
const typeOf = (type: string) => (value: any) => typeof value === type;
const length = (value: string | any[]) => value.length;
const gt = (testVal: number) => (value: number) => value > testVal;
const lt = (testVal: number) => (value: number) => value < testVal;
const match = (regExp: RegExp) => (value: string) => regExp.test(value);
const eq = (a: any) => (b: any) => a === b

export const UNIT_TEST = {
  gt,
  length,
  lt,
  match,
  pipe,
  trim,
  truthy,
  typeOf,
};

export const required = (error?: string) => ({
  auto: true,
  prop: <S>(prop: keyof S) => ({
    error: error || `${startCase(prop as string)} is required.`,
    validation: (data: S): boolean =>
      cond([
        [eq(null), () => false],
        [eq(undefined), () => false],
        [typeOf('string'), pipe(trim, truthy)],
        [() => true, () => true],
      ])(data[prop]),
  }),
});

export const matches = (regex: RegExp, error?: string) => ({
  auto: true,
  prop: <S>(prop: keyof S) => ({
    error: error || `${startCase(prop as string)} is invalid.`,
    validation: (data: S): boolean =>
      cond([
        [typeOf('string'), match(regex)],
        [() => true, matchesError],
      ])(data[prop]),
  }),
});

export const longerThan = (len: number, error?: string) => ({
  auto: true,
  prop: <S>(prop: keyof S) => ({
    error:
      error ||
      `${startCase(prop as string)} must be more than ${len} characters.`,
    validation: (data: S): boolean =>
      cond([
        [typeOf('string'), pipe(trim, length, gt(len))],
        [typeOf('array'), pipe(length, gt(len))],
        [() => true, longerThanError],
      ])(data[prop]),
  }),
});

export const shorterThan = (len: number, error?: string) => ({
  auto: true,
  prop: <S>(prop: keyof S) => ({
    error:
      error ||
      `${startCase(prop as string)} must be fewer than ${len} characters.`,
    validation: (data: S): boolean =>
      cond([
        [typeOf('string'), pipe(trim, length, lt(len))],
        [typeOf('array'), pipe(length, lt(len))],
        [() => true, shorterThanError],
      ])(data[prop]),
  }),
});

export const min = (value: number, error?: string) => ({
  auto: true,
  prop: <S>(prop: keyof S) => ({
    error:
      error || `${startCase(prop as string)} must be greater than ${value}.`,
    validation: (data: S): boolean =>
      cond([
        [typeOf('number'), gt(value - 1)],
        [pipe(Number, isNaN, (x: boolean) => !x), pipe(Number, gt(value - 1))],
        [() => true, minError],
      ])(data[prop]),
  }),
});

export const max = (value: number, error?: string) => ({
  auto: true,
  prop: <S>(prop: keyof S) => ({
    error: error || `${startCase(prop as string)} must be less than ${value}.`,
    validation: (data: S): boolean =>
      cond([
        [typeOf('number'), lt(value + 1)],
        [pipe(Number, isNaN, (x: boolean) => !x), pipe(Number, gt(value - 1))],
        [() => true, maxError],
      ])(data[prop]),
  }),
});

export const is = (value: any | ((x: any) => boolean), error?: string) => ({
  auto: true,
  prop: <S>(prop: keyof S) => ({
    error: error || `${startCase(prop as string)} must be ${value}.`,
    validation: (data: S): boolean =>
      typeof value === 'function' ? value(data[prop]) : data[prop] === value,
  }),
});
