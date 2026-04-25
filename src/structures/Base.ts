import type { Client } from '../client/Client';

export abstract class Base {
  /** Reference to the Client that instantiated this structure */
  public readonly client: Client;

  /** The unique identifier of this entity */
  public readonly id: string;

  constructor(client: Client, id: string) {
    this.client = client;
    this.id = id;
  }

  /**
   * Returns a JSON representation of this structure.
   * Subclasses should override to include their specific fields.
   */
  toJSON(): Record<string, unknown> {
    return { id: this.id };
  }

  /**
   * Returns the string representation (the ID).
   */
  toString(): string {
    return this.id;
  }

  /**
   * Checks equality based on ID.
   */
  equals(other: Base): boolean {
    return this.id === other.id;
  }
}
