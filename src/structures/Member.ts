import { Base } from './Base';
import type { Client } from '../client/Client';
import type { User, APIUser } from './User';
import type { Server, APIServer } from './Server';

export interface APIMember {
  id: string;
  server_id: string | APIServer;
  user_id: string | APIUser;
  position?: number;
  message_notifications?: number;
  suppress_everyone?: boolean;
  suppress_roles?: boolean;
  mobile_push?: boolean;
  is_banned?: boolean;
  banned_at?: string;
  kicked_at?: string;
  kick_expires_at?: string;
  created_at?: string;
  updated_at?: string;
  roles?: string[];
}

export class Member extends Base {
  /** The ID of the server */
  public serverId: string;

  /** The populated Server model, if available */
  public server: Server | null = null;

  /** The ID of the user */
  public userId: string;

  /** The populated User model, if available */
  public user: User | null = null;

  /** Position in the member list */
  public position: number;

  /** Message notification level: 0=all, 1=mentions, 2=none */
  public messageNotifications: number;

  /** Whether @everyone mentions are suppressed */
  public suppressEveryone: boolean;

  /** Whether role mentions are suppressed */
  public suppressRoles: boolean;

  /** Whether mobile push notifications are enabled */
  public mobilePush: boolean;

  /** Whether this member is banned */
  public isBanned: boolean;

  /** When this member was banned, if applicable */
  public bannedAt: Date | null;

  /** When this member was kicked, if applicable */
  public kickedAt: Date | null;

  /** When the kick expires, if applicable */
  public kickExpiresAt: Date | null;

  /** When this member joined the server */
  public joinedAt: Date | null;

  /** The role IDs this member has */
  public roleIds: string[];

  constructor(client: Client, data: APIMember) {
    super(client, data.id);

    // Handle both string and populated object server_id
    if (typeof data.server_id === 'string' || !data.server_id) {
      this.serverId = data.server_id as string;
      this.server = null;
    } else {
      this.server = this.client.servers._add(data.server_id);
      this.serverId = this.server.id;
    }

    // Handle both string and populated object user_id
    if (typeof data.user_id === 'string' || !data.user_id) {
      this.userId = data.user_id as string;
      this.user = null;
    } else {
      this.user = this.client.users._add(data.user_id);
      this.userId = this.user.id;
    }

    this.position = data.position ?? 0;
    this.messageNotifications = data.message_notifications ?? 0;
    this.suppressEveryone = data.suppress_everyone ?? false;
    this.suppressRoles = data.suppress_roles ?? false;
    this.mobilePush = data.mobile_push ?? true;
    this.isBanned = data.is_banned ?? false;
    this.bannedAt = data.banned_at ? new Date(data.banned_at) : null;
    this.kickedAt = data.kicked_at ? new Date(data.kicked_at) : null;
    this.kickExpiresAt = data.kick_expires_at ? new Date(data.kick_expires_at) : null;
    this.joinedAt = data.created_at ? new Date(data.created_at) : null;
    this.roleIds = data.roles ?? [];
  }

  getUsername(): string {
    const user = this.user || this.client.users.cache.get(this.userId);
    if (user) {
      return user.username;
    }
    return this.userId;
  }

  getFullName(): string {
    const user = this.user || this.client.users.cache.get(this.userId);
    if (user) {
      return user.fullName;
    }
    return this.userId;
  }

  /**
   * Updates this member with new data.
   */
  _patch(data: Partial<APIMember>): Member {
    if (data.position !== undefined) this.position = data.position;
    if (data.is_banned !== undefined) this.isBanned = data.is_banned;
    if (data.banned_at !== undefined) this.bannedAt = data.banned_at ? new Date(data.banned_at) : null;
    if (data.roles !== undefined) this.roleIds = data.roles;

    if (data.server_id !== undefined) {
      if (typeof data.server_id === 'string' || !data.server_id) {
        this.serverId = data.server_id as string;
        this.server = null;
      } else {
        this.server = this.client.servers._add(data.server_id);
        this.serverId = this.server.id;
      }
    }

    if (data.user_id !== undefined) {
      if (typeof data.user_id === 'string' || !data.user_id) {
        this.userId = data.user_id as string;
        this.user = null;
      } else {
        this.user = this.client.users._add(data.user_id);
        this.userId = this.user.id;
      }
    }
    return this;
  }

  /**
   * The mention string for this member.
   */
  get mention(): string {
    return `[@ id="${this.userId}" label="${this.getUsername()}"]`;
  }

  /**
   * The mention string for this member.
   */
  toString(): string {
    return this.mention;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      serverId: this.serverId,
      userId: this.userId,
      username: this.getUsername(),
      fullName: this.getFullName(),
      position: this.position,
      isBanned: this.isBanned,
      joinedAt: this.joinedAt?.toISOString() ?? null,
      roleIds: this.roleIds,
    };
  }
}
