import * as R from 'ramda';

export const pipe =
  (...fns: ((a: any) => any)[]) =>
    (arg: any) =>
      fns.reduce((acc, fn) => fn(acc), arg);

// export function prop<T>(p: keyof T) {
//   return (obj: T) => (obj ? obj[p] : undefined);
// }

export const executeSideEffect = (fn: (arg: any) => void) => (arg: any) => {
  fn(arg);
  return arg;
};

export function stringIsNotEmpty(string: string): boolean {
  return pipe(R.trim, R.length, R.gt(R.__, 0))(string);
}

export const readValue = (value: any) => {
  return typeof value === 'function' ? value() : value;
};

export function eventNameValue(event: any) {
  return pipe(
    R.prop('target'),
    R.converge(R.objOf, [
      R.prop('name'),
      R.ifElse(R.prop('value'), R.prop('value'), R.prop('checked')),
    ]),
  )(event);
};
