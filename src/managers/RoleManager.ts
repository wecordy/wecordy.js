import { BaseManager } from './BaseManager';
import { Role, type APIRole } from '../structures/Role';
import { APIRoutes } from '../rest/APIRoutes';
import type { Client } from '../client/Client';

/**
 * Manages role entities across servers.
 */
export class RoleManager extends BaseManager<Role> {
  constructor(client: Client) {
    super(client);
  }

  /**
   * Fetches all roles for a server.
   * @param serverId - The server ID
   */
  async fetchServerRoles(serverId: string): Promise<Role[]> {
    const data = await this.client.rest.get<APIRole[]>(APIRoutes.serverRoles(serverId));
    return data.map((r) => this._add(r));
  }

  /**
   * Creates a role in a server.
   * @param serverId - The server ID
   * @param options - Role creation options
   */
  async create(serverId: string, options: {
    name: string;
    color?: string;
    permissions?: Record<string, number>;
  }): Promise<Role> {
    const data = await this.client.rest.post<APIRole>(
      APIRoutes.createRole(serverId),
      { server_id: serverId, ...options },
    );
    return this._add(data);
  }

  /**
   * Constructs a Role instance from raw API data and adds it to the cache.
   */
  _add(roleOrData: Role | APIRole): Role {
    const role = roleOrData instanceof Role
      ? roleOrData
      : new Role(this.client, roleOrData);
    this.cache.set(role.id, role);
    return role;
  }
}
