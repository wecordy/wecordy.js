import { Base } from './Base';
import type { Client } from '../client/Client';
import type { Collection } from '../util/Collection';
import type { Channel, APIChannel } from './Channel';
import type { Role } from './Role';
import type { Member } from './Member';
import type { User, APIUser } from './User';

export interface APIServer {
  id: string;
  name: string;
  is_public?: boolean;
  user_id?: string | APIUser;
  system_channel_id?: string | APIChannel;
  avatar_url?: string;
  banner_url?: string;
  created_at?: string;
  updated_at?: string;
}

export class Server extends Base {
  /** The name of this server */
  public name: string;

  /** Whether this server is publicly discoverable */
  public isPublic: boolean;

  /** The ID of the server owner (user_id in backend) */
  public userId: string | null;

  /** The populated User model of the owner, if available */
  public user: User | null = null;

  /** The ID of the system channel (new member messages, etc.) */
  public systemChannelId: string | null;

  /** The populated system Channel model, if available */
  public systemChannel: Channel | null = null;

  /** The server's avatar/icon URL */
  public avatarURL: string | null;

  /** The server's banner URL */
  public bannerURL: string | null;

  /** When this server was created */
  public createdAt: Date | null;

  /** Cached channels for this server */
  private _channels: Collection<string, Channel> | null = null;

  /** Cached roles for this server */
  private _roles: Collection<string, Role> | null = null;

  /** Cached members for this server */
  private _members: Collection<string, Member> | null = null;

  constructor(client: Client, data: APIServer) {
    super(client, data.id);
    this.name = data.name;
    this.isPublic = data.is_public ?? false;

    // user_id -> userId & user
    if (typeof data.user_id === 'string' || !data.user_id) {
      this.userId = data.user_id as string ?? null;
      this.user = null;
    } else {
      this.user = this.client.users._add(data.user_id);
      this.userId = this.user.id;
    }

    // system_channel_id -> systemChannelId & systemChannel
    if (typeof data.system_channel_id === 'string' || !data.system_channel_id) {
      this.systemChannelId = data.system_channel_id as string ?? null;
      this.systemChannel = null;
    } else {
      this.systemChannel = this.client.channels._add(data.system_channel_id);
      this.systemChannelId = this.systemChannel.id;
    }

    this.avatarURL = data.avatar_url ?? null;
    this.bannerURL = data.banner_url ?? null;
    this.createdAt = data.created_at ? new Date(data.created_at) : null;
  }

  /**
   * The channel collection filtered for this server from the client cache.
   */
  channels(): Collection<string, Channel> {
    if (this._channels) return this._channels;
    return this.client.channels.cache.filter((c) => c.serverId === this.id);
  }

  /**
   * Sets the local channel cache for this server.
   */
  setChannels(channels: Collection<string, Channel>) {
    this._channels = channels;
  }

  /**
   * The role collection filtered for this server from the client cache.
   */
  roles(): Collection<string, Role> {
    if (this._roles) return this._roles;
    return this.client.roles.cache.filter((r) => r.serverId === this.id);
  }

  /**
   * Sets the local role cache for this server.
   */
  setRoles(roles: Collection<string, Role>) {
    this._roles = roles;
  }

  /**
   * The member collection filtered for this server from the client cache.
   */
  members(): Collection<string, Member> {
    if (this._members) return this._members;
    return this.client.members.cache.filter((m) => m.serverId === this.id);
  }

  /**
   * Sets the local member cache for this server.
   */
  setMembers(members: Collection<string, Member>) {
    this._members = members;
  }

  /**
   * Updates this server with new data.
   */
  _patch(data: Partial<APIServer>): Server {
    if (data.name !== undefined) this.name = data.name;
    if (data.is_public !== undefined) this.isPublic = data.is_public;

    if (data.user_id !== undefined) {
      if (typeof data.user_id === 'string' || !data.user_id) {
        this.userId = data.user_id as string ?? null;
        this.user = null;
      } else {
        this.user = this.client.users._add(data.user_id);
        this.userId = this.user.id;
      }
    }

    if (data.system_channel_id !== undefined) {
      if (typeof data.system_channel_id === 'string' || !data.system_channel_id) {
        this.systemChannelId = data.system_channel_id as string ?? null;
        this.systemChannel = null;
      } else {
        this.systemChannel = this.client.channels._add(data.system_channel_id);
        this.systemChannelId = this.systemChannel.id;
      }
    }

    if (data.avatar_url !== undefined) this.avatarURL = data.avatar_url ?? null;
    if (data.banner_url !== undefined) this.bannerURL = data.banner_url ?? null;
    return this;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      isPublic: this.isPublic,
      userId: this.userId,
      user: this.user?.toJSON() ?? null,
      systemChannelId: this.systemChannelId,
      systemChannel: this.systemChannel?.toJSON() ?? null,
      avatarURL: this.avatarURL,
      bannerURL: this.bannerURL,
      createdAt: this.createdAt?.toISOString() ?? null,
    };
  }

  toString(): string {
    return this.name;
  }
}
