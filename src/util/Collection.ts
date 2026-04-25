/**
 * An extended Map with utility methods for managing cached data.
 * helpers over the standard Map<K, V> for filtering, searching,
 * and transforming cached entities.
 *
 * @typeParam K - The key type
 * @typeParam V - The value type
 */
export class Collection<K, V> extends Map<K, V> {
  /**
   * Returns the first value in the collection, or undefined if empty.
   */
  first(): V | undefined {
    return this.values().next().value;
  }

  /**
   * Returns the first key in the collection, or undefined if empty.
   */
  firstKey(): K | undefined {
    return this.keys().next().value;
  }

  /**
   * Returns the last value in the collection, or undefined if empty.
   */
  last(): V | undefined {
    const arr = [...this.values()];
    return arr[arr.length - 1];
  }

  /**
   * Returns a random value from the collection, or undefined if empty.
   */
  random(): V | undefined {
    const arr = [...this.values()];
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Searches for a single value where the given function returns truthy.
   * @param fn - Function to test each value
   */
  find(fn: (value: V, key: K, collection: this) => boolean): V | undefined {
    for (const [key, val] of this) {
      if (fn(val, key, this)) return val;
    }
    return undefined;
  }

  /**
   * Returns a new Collection containing only the values where the given function returns truthy.
   * @param fn - Function to filter values
   */
  filter(fn: (value: V, key: K, collection: this) => boolean): Collection<K, V> {
    const results = new Collection<K, V>();
    for (const [key, val] of this) {
      if (fn(val, key, this)) results.set(key, val);
    }
    return results;
  }

  /**
   * Maps each value to another value and returns an array of the results.
   * @param fn - Function to transform each value
   */
  map<T>(fn: (value: V, key: K, collection: this) => T): T[] {
    const results: T[] = [];
    for (const [key, val] of this) {
      results.push(fn(val, key, this));
    }
    return results;
  }

  /**
   * Similar to Array.some(). Returns true if any value passes the test.
   * @param fn - Function to test each value
   */
  some(fn: (value: V, key: K, collection: this) => boolean): boolean {
    for (const [key, val] of this) {
      if (fn(val, key, this)) return true;
    }
    return false;
  }

  /**
   * Similar to Array.every(). Returns true if all values pass the test.
   * @param fn - Function to test each value
   */
  every(fn: (value: V, key: K, collection: this) => boolean): boolean {
    for (const [key, val] of this) {
      if (!fn(val, key, this)) return false;
    }
    return true;
  }

  /**
   * Similar to Array.reduce(). Applies a function against an accumulator and each value.
   * @param fn - Reducer function
   * @param initialValue - Starting accumulator value
   */
  reduce<T>(fn: (accumulator: T, value: V, key: K, collection: this) => T, initialValue: T): T {
    let accumulator = initialValue;
    for (const [key, val] of this) {
      accumulator = fn(accumulator, val, key, this);
    }
    return accumulator;
  }

  /**
   * Returns an array of all values.
   */
  toArray(): V[] {
    return [...this.values()];
  }

  /**
   * Returns an array of all keys.
   */
  toKeyArray(): K[] {
    return [...this.keys()];
  }

  /**
   * Returns the value if it exists, otherwise calls the defaultValueGenerator,
   * sets the result, and returns it.
   * @param key - Key to look up
   * @param defaultValueGenerator - Function that creates the default value
   */
  ensure(key: K, defaultValueGenerator: () => V): V {
    const existing = this.get(key);
    if (existing !== undefined) return existing;

    const defaultValue = defaultValueGenerator();
    this.set(key, defaultValue);
    return defaultValue;
  }

  /**
   * Creates a new Collection by merging this one with another.
   * @param other - The other collection to merge
   */
  concat(other: Collection<K, V>): Collection<K, V> {
    const merged = new Collection<K, V>(this);
    for (const [key, val] of other) {
      merged.set(key, val);
    }
    return merged;
  }

  /**
   * Returns a shallow clone of this collection.
   */
  clone(): Collection<K, V> {
    return new Collection<K, V>(this);
  }

  /**
   * Checks whether all keys from the given iterable exist in this collection.
   * @param keys - Keys to check
   */
  hasAll(...keys: K[]): boolean {
    return keys.every((key) => this.has(key));
  }

  /**
   * Checks whether any of the given keys exist in this collection.
   * @param keys - Keys to check
   */
  hasAny(...keys: K[]): boolean {
    return keys.some((key) => this.has(key));
  }

  /**
   * Partitions the collection into two collections based on the predicate.
   * The first collection contains values where the predicate is true,
   * the second contains values where it is false.
   * @param fn - Predicate function
   */
  partition(fn: (value: V, key: K, collection: this) => boolean): [Collection<K, V>, Collection<K, V>] {
    const truthy = new Collection<K, V>();
    const falsy = new Collection<K, V>();
    for (const [key, val] of this) {
      if (fn(val, key, this)) {
        truthy.set(key, val);
      } else {
        falsy.set(key, val);
      }
    }
    return [truthy, falsy];
  }

  /**
   * Sorts the collection entries by the comparator and returns a new Collection.
   * @param compareFn - Compare function (same as Array.sort)
   */
  sort(compareFn: (a: V, b: V, aKey: K, bKey: K) => number): Collection<K, V> {
    const entries = [...this.entries()].sort((a, b) => compareFn(a[1], b[1], a[0], b[0]));
    const sorted = new Collection<K, V>();
    for (const [key, val] of entries) {
      sorted.set(key, val);
    }
    return sorted;
  }
}
