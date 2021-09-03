export class Maybe {
  $value: any;

  get isNothing() {
    return this.$value === null || this.$value === undefined;
  }

  get isJust() {
    return !this.isNothing;
  }

  constructor(x: any) {
    this.$value = x;
  }

  // ----- Pointed Maybe
  static of(x: any) {
    return new Maybe(x);
  }

  // ----- Functor Maybe
  map(fn: any) {
    return this.isNothing ? this : Maybe.of(fn(this.$value));
  }

  join() {
    return this.isNothing ? this : this.$value;
  }

}
