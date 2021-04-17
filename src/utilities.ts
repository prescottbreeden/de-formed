import * as R from 'ramda';

//  curry :: ((a, b, ...) -> c) -> a -> b -> ... -> c
function curry(fn: any) {
  const arity = fn.length;

  return function $curry(...args: any[]): any {
    if (args.length < arity) {
      return $curry.bind(null, ...args);
    }

    return fn.call(null, ...args);
  };
}

//  compose :: ((a -> b), (b -> c),  ..., (y -> z)) -> a -> z
export const compose = (...fns: any[]) => (...args: any[]) =>
  fns.reduceRight((res, fn) => [fn.call(null, ...res)], args)[0];

//  prop :: String -> {a} -> [a | Undefined]
export const prop = curry((p: string, obj: any) => (obj ? obj[p] : undefined));

// executeSideEffect :: (f -> any) -> x -> f(x) | x
export const executeSideEffect = curry((f: any, x: any) => f(x) || x);

// stringIsNotEmpty :: string -> boolean
export const stringIsNotEmpty = compose(
  R.gt(R.__, 0),
  R.length,
  R.trim
);

export const readValue = (f: any) => {
  return typeof f === 'function' ? f() : f;
}

