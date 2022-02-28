import { EventName } from './types';

/**
 *  @De-formed
 *  Internal utility function.
 *  @param string
 *  @returns boolean
 */
export function stringIsNotEmpty(str: string): boolean {
  return str.trim().length > 0;
}

/**
 *  @De-formed
 *  Internal utility function. Takes an argument and if that argument is a
 *  function then it will call it with no parameters, otherwise it will just
 *  return the argument.
 *  @example
 *  input: 42
 *  output: 42
 *
 *  input: () => 42
 *  output: 42
 */
export const readValue = <T>(value: T) => {
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
export function eventNameValue(event: any): EventName {
  if (event.target) {
    const { name, checked, type, value } = event.target;
    return type === 'checkbox' ? { [name]: checked } : { [name]: value };
  }
  return { error: 'unable to parse values' };
}
