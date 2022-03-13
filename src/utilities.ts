/**
 *  curry :: ((a, b, ...) -> c) -> a -> b -> ... -> c
 */
export function curry(fn: (...args: any) => any) {
  const arity = fn.length;

  return function $curry(...args: any): any {
    if (args.length < arity) {
      return $curry.bind(null, ...args);
    }
    return fn.call(null, ...args);
  };
}

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
};

/**
 * @De-Formed
 * Internal Utility. Function that takes either a string or a function stransforming a form state
 * to a string to generate an error for the validation state.
 */
export const generateError =
  <S>(state: S) =>
  (s: string | ((state: S) => string)) => {
    return typeof s === 'function' ? s(state) : s;
  };

/**
 *  @De-formed
 *  Internal Utility. Takes an event and extracts either the target.value
 *  property (or the target.checked property if type is 'checkbox') and returns
 *  it as the value of a key of target.name.
 *
 *  This allows for easy event updates by merging the output of this function
 *  with the current state of the form.
 *
 *  @example
 *  input: { target: { name: 'firstName', type: 'text', value: 'bob' } }
 *  output: { firstName: 'bob' }
 *
 *  input: { target: { checked: true, name: 'subscribed', type: 'checkbox' } }
 *  output: { subscribed: true }
 *
 *  [example usage]
 *  const genericOnChange = pipe(
 *    eventNameValue,
 *    merge(formState),
 *    setFormState
 *  )
 */
export const eventNameValue = (
  event: any,
): {
  [key: string]: string | number | boolean;
} => {
  if (event?.target) {
    const { name, checked, type, value } = event.target;
    if (type === 'checkbox') {
      return { [name]: checked };
    } else {
      return { [name]: value };
    }
  }
  throw new Error(
    `"eventNameValue" cannot read object ${event} because it does not have a target property.`,
  );
};

/**
 *  @De-formed
 *  Internal Utility. Curried function that takes a string and a value and
 *  returns a fake event object to integrate form components that do not emit
 *  event objects. If you need to customize the event type you will need to use
 *  your own event emitter. "Text" is used as the event type by default in leu
 *  of "undefined" or "custom" to avoid potential type conflicts.
 *
 *  @example
 *  input: ("selected", "I love validations")
 *  output: {
 *    target: {
 *      name: 'selected',
 *      type: 'text',
 *      value: 'I love validations'
 *    }
 *  }
 *
 *  input: "selected"
 *  output (value) => ({
 *    target: {
 *      name: 'selected',
 *      type: 'text',
 *      value,
 *    }
 *  })
 *
 *  [example usage]
 *  const genericOnChange = pipe(
 *    eventNameValue,
 *    merge(formState),
 *    setFormState
 *  )
 *
 *  const handleSelectChange = pipe(
 *    createFakeEvent('selected'),
 *    genericOnChange
 *  )
 */
export const createFakeEvent = curry(
  (name: string, value: string | number | boolean): any => ({
    target: { name, value, type: 'text' },
  }),
);
