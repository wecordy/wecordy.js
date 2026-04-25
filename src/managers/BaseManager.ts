import type { Client } from '../client/Client';
import { Collection } from '../util/Collection';

/**
 * Abstract base manager that all entity managers extend.
 * Provides a shared cache and common resolve utilities.
 *
 * @typeParam T - The structure type this manager holds
 */
export abstract class BaseManager<T extends { id: string }> {
  /** Reference to the Client */
  public readonly client: Client;

  /** The in-memory cache of entities */
  public readonly cache: Collection<string, T>;

  constructor(client: Client) {
    this.client = client;
    this.cache = new Collection<string, T>();
  }

  /**
   * Resolves an entity from the cache by ID or instance.
   * @param idOrInstance - An entity ID string or entity instance
   */
  resolve(idOrInstance: string | T): T | undefined {
    if (typeof idOrInstance === 'string') {
      return this.cache.get(idOrInstance);
    }
    return this.cache.get(idOrInstance.id);
  }

  /**
   * Resolves to an ID string from an ID or instance.
   * @param idOrInstance - An entity ID string or entity instance
   */
  resolveId(idOrInstance: string | T): string {
    if (typeof idOrInstance === 'string') return idOrInstance;
    return idOrInstance.id;
  }

  /**
   * Adds an entity to the cache.
   * @param entity - The entity to cache
   */
  _add(entity: T): T {
    this.cache.set(entity.id, entity);
    return entity;
  }

  /**
   * Removes an entity from the cache.
   * @param id - The entity ID to remove
   */
  _remove(id: string): boolean {
    return this.cache.delete(id);
  }
}
