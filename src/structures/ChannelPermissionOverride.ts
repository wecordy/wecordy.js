import { Base } from './Base';
import type { Client } from '../client/Client';
import { Permissions } from '../util/Permissions';
import type { Role, APIRole } from './Role';
import type { User, APIUser } from './User';

export interface APIChannelPermissionOverride {
  id: string;
  channel_id: string;
  role_id?: string | APIRole;
  user_id?: string | APIUser;
  permissions: Record<string, number>;
  created_at: string;
  updated_at: string;
}

/**
 * Represents a permission override for a role or user in a specific channel.
 */
export class ChannelPermissionOverride extends Base {
  /** The ID of the channel this override applies to */
  public channelId: string;

  /** The ID of the role this override applies to, if any */
  public roleId: string | null;

  /** The populated Role model, if available */
  public role: Role | null = null;

  /** The ID of the user this override applies to, if any */
  public userId: string | null;

  /** The populated User model, if available */
  public user: User | null = null;

  /** The permissions this override applies */
  public permissions: Permissions;

  constructor(client: Client, data: APIChannelPermissionOverride) {
    super(client, data.id);
    this.channelId = data.channel_id;

    // role_id -> roleId & role
    if (typeof data.role_id === 'string' || !data.role_id) {
      this.roleId = data.role_id as string ?? null;
      this.role = null;
    } else {
      this.role = this.client.roles._add(data.role_id);
      this.roleId = this.role.id;
    }

    // user_id -> userId & user
    if (typeof data.user_id === 'string' || !data.user_id) {
      this.userId = data.user_id as string ?? null;
      this.user = null;
    } else {
      this.user = this.client.users._add(data.user_id);
      this.userId = this.user.id;
    }

    this.permissions = data.permissions
      ? Permissions.fromBackendFormat(data.permissions)
      : new Permissions(Permissions.Default);
  }

  /**
   * Whether this override applies to a role.
   */
  isRole(): boolean {
    return this.roleId !== null;
  }

  /**
   * Whether this override applies to a user.
   */
  isUser(): boolean {
    return this.userId !== null;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      channelId: this.channelId,
      roleId: this.roleId,
      userId: this.userId,
      permissions: this.permissions.serialize(),
    };
  }
}
