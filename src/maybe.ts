export class Maybe {
  private _value: any;

  get isNothing() {
    return this._value === null || this._value === undefined;
  }

  get isJust() {
    return !this.isNothing;
  }

  constructor(x: any) {
    this._value = x;
  }

  // ----- Pointed Maybe
  static of(x: any) {
    return new Maybe(x);
  }

  // ----- Functor Maybe
  map(fn: any) {
    return this.isNothing ? this : Maybe.of(fn(this._value));
  }

  join() {
    return this.isNothing ? this : this._value;
  }
}
