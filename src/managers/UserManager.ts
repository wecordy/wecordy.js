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
   * Constructs a User instance from raw API data and adds it to the cache.
   */
  _add(userOrData: User | APIUser): User {
    const user = userOrData instanceof User
      ? userOrData
      : new User(this.client, userOrData);
    this.cache.set(user.id, user);
    return user;
  }
}
