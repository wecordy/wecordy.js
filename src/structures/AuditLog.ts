import { Base } from './Base';
import type { Client } from '../client/Client';
import type { User, APIUser } from './User';
import type { Role, APIRole } from './Role';
import type { Server, APIServer } from './Server';
import type { Channel, APIChannel } from './Channel';

/**
 * Raw audit log change data.
 */
export interface APIAuditLogChange {
  key: string;
  old_value?: unknown;
  new_value?: unknown;
}

export interface APIAuditLog {
  id: string;
  server_id: string | APIServer;
  user_id: string | APIUser;
  action_type: string;
  channel_id?: string | APIChannel;
  role_id?: string | APIRole;
  target_user_id?: string | APIUser;
  changes?: APIAuditLogChange[];
  reason?: string;
  created_at: string;
}

/**
 * Represents an entry in a server's audit log.
 */
export class AuditLog extends Base {
  /** The ID of the server this log belongs to */
  public serverId: string;

  /** The populated Server model, if available */
  public server: Server | null = null;

  /** The ID of the user who performed the action */
  public userId: string;

  /** The populated User model of the performer, if available */
  public user: User | null = null;

  /** The type of action performed */
  public actionType: string;

  /** The ID of the channel affected, if any */
  public channelId: string | null;

  /** The populated Channel model, if available */
  public channel: Channel | null = null;

  /** The ID of the role affected, if any */
  public roleId: string | null;

  /** The populated Role model, if available */
  public role: Role | null = null;

  /** The ID of the user affected, if any */
  public targetUserId: string | null;

  /** The populated User model of the target, if available */
  public targetUser: User | null = null;

  /** List of changes performed in this action */
  public changes: APIAuditLogChange[];

  /** The reason for the action, if provided */
  public reason: string | null;

  /** When this log was created */
  public createdAt: Date;

  constructor(client: Client, data: APIAuditLog) {
    super(client, data.id);
    
    // server_id -> serverId & server
    if (typeof data.server_id === 'string' || !data.server_id) {
      this.serverId = data.server_id as string;
      this.server = null;
    } else {
      this.server = this.client.servers._add(data.server_id);
      this.serverId = this.server.id;
    }

    // user_id -> userId & user
    if (typeof data.user_id === 'string' || !data.user_id) {
      this.userId = data.user_id as string;
      this.user = null;
    } else {
      this.user = this.client.users._add(data.user_id);
      this.userId = this.user.id;
    }

    this.actionType = data.action_type;

    // channel_id -> channelId & channel
    if (typeof data.channel_id === 'string' || !data.channel_id) {
      this.channelId = data.channel_id as string ?? null;
      this.channel = null;
    } else {
      this.channel = this.client.channels._add(data.channel_id);
      this.channelId = this.channel.id;
    }

    // role_id -> roleId & role
    if (typeof data.role_id === 'string' || !data.role_id) {
      this.roleId = data.role_id as string ?? null;
      this.role = null;
    } else {
      this.role = this.client.roles._add(data.role_id);
      this.roleId = this.role.id;
    }

    // target_user_id -> targetUserId & targetUser
    if (typeof data.target_user_id === 'string' || !data.target_user_id) {
      this.targetUserId = data.target_user_id as string ?? null;
      this.targetUser = null;
    } else {
      this.targetUser = this.client.users._add(data.target_user_id);
      this.targetUserId = this.targetUser.id;
    }

    this.changes = data.changes ?? [];
    this.reason = data.reason ?? null;
    this.createdAt = new Date(data.created_at);
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      serverId: this.serverId,
      userId: this.userId,
      user: this.user?.toJSON() ?? null,
      actionType: this.actionType,
      channelId: this.channelId,
      roleId: this.roleId,
      targetUserId: this.targetUserId,
      targetUser: this.targetUser?.toJSON() ?? null,
      changes: this.changes,
      reason: this.reason,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
