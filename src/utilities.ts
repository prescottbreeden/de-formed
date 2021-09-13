import * as R from 'ramda';

/**
 *  @De-formed
 *  Internal utility function. Basic pipe function with looser typing.
 */
export const pipe =
  (...fns: ((a: any) => any)[]) =>
  (arg: any) =>
    fns.reduce((acc, fn) => fn(acc), arg);

/**
 *  @De-formed
 *  Internal utility function. Wraps a function that returns unit
 *  and instead returns the argument.
 */
export const executeSideEffect = (fn: (arg: any) => void) => (arg: any) => {
  fn(arg);
  return arg;
};

/**
 *  @De-formed
 *  Internal utility function.
 *  @param string
 *  @returns boolean
 */
export function stringIsNotEmpty(str: string): boolean {
  return pipe(R.trim, R.length, R.gt(R.__, 0))(str);
}

/**
 *  @De-formed
 *  Internal utility function. Takes an argument and if that argument is a
 *  function then it will call it with no parameters, otherwise it will just
 *  return the argument.
 */
export const readValue = (value: any) => {
  return typeof value === 'function' ? value() : value;
};

/**
 *  @De-formed
 *  Internal utility function. Takes an event and extracts either the target
 *  value property or the target checked property and returns it as the value
 *  of a key by the event name.
 *  @example
 *  input: { target: { value: 'bob' }, name: 'firstName' }
 *  output: { firstName: 'bob' }
 */
export function eventNameValue(event: any): {
  [key: string]: string | number | boolean;
} {
  if (event.target) {
    const { name, checked, type, value } = event.target;
    if (type === 'checkbox') return { [name]: checked };
    return { [name]: value };
  }
  return { error: 'unable to parse values' };
}
