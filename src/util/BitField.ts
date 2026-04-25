/**
 * Represents a data structure for handling bitfield-based permissions.
 * Each permission is a single bit in a bigint, allowing efficient
 * combination and checking of multiple permissions.
 */
export class BitField {
  /** The raw bitfield value */
  public bitfield: bigint;

  /** Default bit value (0n) */
  static DefaultBit: bigint = 0n;

  /** Mapping of flag names to their bit values — override in subclasses */
  static Flags: Record<string, bigint> = {};

  constructor(bits: BitFieldResolvable = BitField.DefaultBit) {
    this.bitfield = BitField.resolve(bits);
  }

  /**
   * Checks whether the bitfield has a specific bit or bits.
   * @param bit - Bit(s) to check for
   */
  has(bit: BitFieldResolvable): boolean {
    const resolved = BitField.resolve(bit);
    return (this.bitfield & resolved) === resolved;
  }

  /**
   * Checks whether the bitfield has any of the given bits.
   * @param bits - Bits to check for
   */
  any(bits: BitFieldResolvable): boolean {
    const resolved = BitField.resolve(bits);
    return (this.bitfield & resolved) !== 0n;
  }

  /**
   * Adds bits to the bitfield.
   * @param bits - Bits to add
   */
  add(...bits: BitFieldResolvable[]): this {
    let total = BitField.DefaultBit;
    for (const bit of bits) {
      total |= BitField.resolve(bit);
    }
    this.bitfield |= total;
    return this;
  }

  /**
   * Removes bits from the bitfield.
   * @param bits - Bits to remove
   */
  remove(...bits: BitFieldResolvable[]): this {
    let total = BitField.DefaultBit;
    for (const bit of bits) {
      total |= BitField.resolve(bit);
    }
    this.bitfield &= ~total;
    return this;
  }

  /**
   * Returns an array of flag names that are set in this bitfield.
   * Requires the subclass to define static Flags.
   */
  toArray(): string[] {
    const flags = (this.constructor as typeof BitField).Flags;
    return Object.entries(flags)
      .filter(([, bit]) => this.has(bit))
      .map(([name]) => name);
  }

  /**
   * Freezes the bitfield, making it immutable.
   */
  freeze(): Readonly<this> {
    return Object.freeze(this);
  }

  /**
   * Serializes the bitfield to a string.
   */
  serialize(): string {
    return this.bitfield.toString();
  }

  /**
   * Resolves a BitFieldResolvable to a bigint.
   * @param bit - Value to resolve
   */
  static resolve(bit: BitFieldResolvable): bigint {
    if (typeof bit === 'bigint') return bit;
    if (typeof bit === 'number') return BigInt(bit);
    if (typeof bit === 'string') {
      const resolved = this.Flags[bit];
      if (resolved !== undefined) return resolved;
      // Try parsing as numeric string
      const parsed = BigInt(bit);
      if (!Number.isNaN(Number(bit))) return parsed;
      throw new RangeError(`Unknown BitField flag: ${bit}`);
    }
    if (bit instanceof BitField) return bit.bitfield;
    if (Array.isArray(bit)) {
      return bit.reduce<bigint>((acc, val) => acc | this.resolve(val), 0n);
    }
    throw new TypeError(`Expected BitFieldResolvable, received ${typeof bit}`);
  }
}

/**
 * Types that can be resolved to a BitField value.
 */
export type BitFieldResolvable = bigint | number | string | BitField | BitFieldResolvable[];
