import { BaseManager } from './BaseManager';
import { Role, type APIRole } from '../structures/Role';
import { APIRoutes } from '../rest/APIRoutes';
import { Permissions } from '../util/Permissions';
import { BitField, type BitFieldResolvable } from '../util/BitField';
import type { Client } from '../client/Client';

/**
 * Role permissions as accepted by the API.
 * Either a backend permission object (`{ SEND_MESSAGES: 1, KICK_MEMBERS: -1 }`, 1 = allow,
 * 0 = neutral, -1 = deny) or anything resolvable to a Permissions bitfield (only allows).
 */
export type RolePermissionsResolvable = Record<string, number> | BitFieldResolvable;

/**
 * Options for creating or editing a role.
 */
export interface RoleData {
  name?: string;
  /** Hex color, e.g. `#5865F2` */
  color?: string;
  permissions?: RolePermissionsResolvable;
}

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
    return (data ?? []).map((r) => this._add(r));
  }

  /**
   * Fetches the roles of a server member.
   * @param serverId - The server ID
   * @param userId - The user ID
   */
  async fetchMemberRoles(serverId: string, userId: string): Promise<Role[]> {
    const data = await this.client.rest.get<APIRole[]>(APIRoutes.memberRoles(serverId, userId));
    return (data ?? []).map((r) => this._add(r));
  }

  /**
   * Creates a role in a server.
   * @param serverId - The server ID
   * @param options - Role creation options
   */
  async create(serverId: string, options: RoleData & { name: string }): Promise<Role> {
    const data = await this.client.rest.post<APIRole>(
      APIRoutes.createRole(serverId),
      this.resolveData(options),
    );
    return this._add(data);
  }

  /**
   * Edits a role.
   * @param serverId - The server ID
   * @param roleId - The role ID
   * @param options - The fields to update
   */
  async edit(serverId: string, roleId: string, options: RoleData): Promise<Role> {
    const data = await this.client.rest.put<APIRole>(
      APIRoutes.updateRole(serverId, roleId),
      this.resolveData(options),
    );
    const existing = this.cache.get(roleId);
    if (existing && data) return existing._patch(data);
    return this._add(data);
  }

  /**
   * Deletes a role.
   * @param serverId - The server ID
   * @param roleId - The role ID
   */
  async delete(serverId: string, roleId: string): Promise<void> {
    await this.client.rest.delete(APIRoutes.deleteRole(serverId, roleId));
    this._remove(roleId);
  }

  /**
   * Assigns a role to a server member.
   * @param serverId - The server ID
   * @param roleId - The role ID
   * @param userId - The user ID of the member
   */
  async assign(serverId: string, roleId: string, userId: string): Promise<void> {
    await this.client.rest.post(APIRoutes.memberRole(serverId, roleId, userId));
  }

  /**
   * Removes a role from a server member.
   * @param serverId - The server ID
   * @param roleId - The role ID
   * @param userId - The user ID of the member
   */
  async unassign(serverId: string, roleId: string, userId: string): Promise<void> {
    await this.client.rest.delete(APIRoutes.memberRole(serverId, roleId, userId));
  }

  /**
   * Adds a Role instance to the cache, or constructs one from raw API data.
   * Raw data for an already cached role updates the cached instance instead of replacing it.
   */
  _add(roleOrData: Role | APIRole): Role {
    if (roleOrData instanceof Role) {
      this.cache.set(roleOrData.id, roleOrData);
      return roleOrData;
    }

    const existing = this.cache.get(roleOrData.id);
    if (existing) return existing._patch(roleOrData);

    const role = new Role(this.client, roleOrData);
    this.cache.set(role.id, role);
    return role;
  }

  /**
   * Converts role options to the request body expected by the API.
   */
  private resolveData(options: RoleData): Record<string, unknown> {
    const { permissions, ...rest } = options;
    if (permissions === undefined) return rest;

    const isBackendFormat =
      typeof permissions === 'object' &&
      permissions !== null &&
      !Array.isArray(permissions) &&
      !(permissions instanceof BitField) &&
      Object.values(permissions).every((v) => typeof v === 'number');

    return {
      ...rest,
      permissions: isBackendFormat
        ? permissions
        : Permissions.toBackendFormat(permissions as BitFieldResolvable),
    };
  }
}
