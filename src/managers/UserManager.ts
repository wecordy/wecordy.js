import { BaseManager } from './BaseManager';
import { User, type APIUser } from '../structures/User';
import { APIRoutes } from '../rest/APIRoutes';
import type { Client } from '../client/Client';

/**
 * Manages user entities.
 */
export class UserManager extends BaseManager<User> {
  constructor(client: Client) {
    super(client);
  }

  /**
   * Fetches a user by ID from the API and caches it.
   * @param userId - The user ID
   * @param force - If true, bypasses cache
   */
  async fetch(userId: string, force: boolean = false): Promise<User> {
    if (!force) {
      const cached = this.cache.get(userId);
      if (cached) return cached;
    }

    const data = await this.client.rest.get<APIUser>(APIRoutes.user(userId));
    return this._add(data);
  }

  /**
   * Adds a User instance to the cache, or constructs one from raw API data.
   * Raw data for an already cached user updates the cached instance instead of replacing it.
   */
  _add(userOrData: User | APIUser): User {
    if (userOrData instanceof User) {
      this.cache.set(userOrData.id, userOrData);
      return userOrData;
    }

    const existing = this.cache.get(userOrData.id);
    if (existing) return existing._patch(userOrData);

    const user = new User(this.client, userOrData);
    this.cache.set(user.id, user);
    return user;
  }
}
