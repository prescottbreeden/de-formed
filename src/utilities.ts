/**
 *  @De-formed
 *  Internal utility function. Takes an argument and if that argument is a
 *  function then it will call it with no parameters, otherwise it will just
 *  return the argument.
 */
export const readValue = <A>(value: A) => {
  return typeof value === 'function' ? value() : value;
};

/**
 *  @De-formed
 *  Internal utility function.
 */
export const stringIsNotEmpty = (str: string): boolean => {
  return str.trim().length > 0;
}

/**
 * @De-Formed
 * Internal Utility. Function that takes either a string or a function stransforming a form state
 * to a string to generate an error for the validation state.
 */
export const generateError = <S>(state: S) => (
  s: string | ((state: S) => string)
) => {
  return typeof s === 'function' ? s(state) : s
}


/**
 *  @De-formed
 *  Internal utility function. Takes an event and extracts either the target
 *  value property or the target checked property and returns it as the value
 *  of a key by the event name.
 *  @example
 *  input: { target: { value: 'bob' }, name: 'firstName' }
 *  output: { firstName: 'bob' }
 */
export const eventNameValue = (event: any): {
  [key: string]: string | number | boolean;
} => {
  if (event?.target) {
    const {name, checked, type, value} = event.target;
    if (type === 'checkbox') {
      return {[name]: checked};
    } else {
      return {[name]: value};
    }
  }
  throw new Error(`"eventNameValue" cannot read object ${event} because it does not have a target property.`)
}
