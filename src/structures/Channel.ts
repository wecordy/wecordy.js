import { Base } from './Base';
import type { Client } from '../client/Client';
import type { ChannelTypeValue } from '../util/Constants';
import type { Server, APIServer } from './Server';
import type { Message, APIMessage } from './Message';
import { ChannelPermissionOverride, type APIChannelPermissionOverride } from './ChannelPermissionOverride';
import { Collection } from '../util/Collection';

export interface APIChannel {
  id: string;
  name: string;
  topic?: string;
  type: ChannelTypeValue;
  server_id: string | APIServer;
  parent_id?: string | APIChannel;
  position?: number;
  user_limit?: number;
  slow_mode?: number;
  last_message_id?: string | APIMessage;
  created_at?: string;
  updated_at?: string;
  permission_overrides?: APIChannelPermissionOverride[];
}

export class Channel extends Base {
  /** The channel name */
  public name: string;

  /** The channel topic/description */
  public topic: string | null;

  /** The channel type (text, voice, category, etc.) */
  public type: ChannelTypeValue;

  /** The ID of the server this channel belongs to */
  public serverId: string;

  /** The populated Server model, if available */
  public server: Server | null = null;

  /** The ID of the parent channel (for channels inside a category) */
  public parentId: string | null;

  /** The populated parent Channel model, if available */
  public parent: Channel | null = null;

  /** The position of this channel in the channel list */
  public position: number;

  /** Maximum number of users in a voice channel (0 = unlimited) */
  public userLimit: number;

  /** Slow mode delay in seconds (0 = disabled) */
  public slowMode: number;

  /** The ID of the last message sent in this channel */
  public lastMessageId: string | null;

  /** The populated Message model of the last message, if available */
  public lastMessage: Message | null = null;

  /** When this channel was created */
  public createdAt: Date | null;

  /** The permission overrides for this channel */
  public permissionOverrides: Collection<string, ChannelPermissionOverride>;

  constructor(client: Client, data: APIChannel) {
    super(client, data.id);
    this.name = data.name;
    this.topic = data.topic ?? null;
    this.type = data.type;

    // server_id -> serverId & server
    if (typeof data.server_id === 'string' || !data.server_id) {
      this.serverId = data.server_id as string;
      this.server = null;
    } else {
      this.server = this.client.servers._add(data.server_id);
      this.serverId = this.server.id;
    }

    // parent_id -> parentId & parent
    if (typeof data.parent_id === 'string' || !data.parent_id) {
      this.parentId = data.parent_id as string ?? null;
      this.parent = null;
    } else {
      this.parent = this.client.channels._add(data.parent_id);
      this.parentId = this.parent.id;
    }

    this.position = data.position ?? 0;
    this.userLimit = data.user_limit ?? 0;
    this.slowMode = data.slow_mode ?? 0;

    // last_message_id -> lastMessageId & lastMessage
    if (typeof data.last_message_id === 'string' || !data.last_message_id) {
      this.lastMessageId = data.last_message_id as string ?? null;
      this.lastMessage = null;
    } else {
      this.lastMessage = this.client.messages._add(data.last_message_id);
      this.lastMessageId = this.lastMessage.id;
    }

    this.createdAt = data.created_at ? new Date(data.created_at) : null;
    this.permissionOverrides = new Collection();
    if (data.permission_overrides) {
      for (const overrideData of data.permission_overrides) {
        this.permissionOverrides.set(overrideData.id, new ChannelPermissionOverride(client, overrideData));
      }
    }
  }

  /**
   * Whether this is a text-based channel (text, announcement, news, rules).
   */
  isTextBased(): boolean {
    return ['text', 'announcement', 'news', 'rules'].includes(this.type);
  }

  /**
   * Whether this is a voice-based channel (voice, stage).
   */
  isVoiceBased(): boolean {
    return ['voice', 'stage'].includes(this.type);
  }

  /**
   * Whether this channel is a category.
   */
  isCategory(): boolean {
    return this.type === 'category';
  }

  /**
   * Sends a message to this channel.
   * @param content - The message content or options
   */
  async send(content: string | { text: string; attachments?: Array<{ url: string; mimetype: string; size: number }> }): Promise<Message> {
    return this.client.messages.send(this.id, content);
  }

  /**
   * Updates this channel with new data.
   */
  _patch(data: Partial<APIChannel>): Channel {
    if (data.name !== undefined) this.name = data.name;
    if (data.topic !== undefined) this.topic = data.topic ?? null;
    if (data.type !== undefined) this.type = data.type;

    if (data.server_id !== undefined) {
      if (typeof data.server_id === 'string' || !data.server_id) {
        this.serverId = data.server_id as string;
        this.server = null;
      } else {
        this.server = this.client.servers._add(data.server_id);
        this.serverId = this.server.id;
      }
    }

    if (data.parent_id !== undefined) {
      if (typeof data.parent_id === 'string' || !data.parent_id) {
        this.parentId = (data.parent_id as string) ?? null;
        this.parent = null;
      } else {
        this.parent = this.client.channels._add(data.parent_id);
        this.parentId = this.parent.id;
      }
    }

    if (data.position !== undefined) this.position = data.position;
    if (data.user_limit !== undefined) this.userLimit = data.user_limit;
    if (data.slow_mode !== undefined) this.slowMode = data.slow_mode;

    if (data.last_message_id !== undefined) {
      if (typeof data.last_message_id === 'string' || !data.last_message_id) {
        this.lastMessageId = (data.last_message_id as string) ?? null;
        this.lastMessage = null;
      } else {
        this.lastMessage = this.client.messages._add(data.last_message_id);
        this.lastMessageId = this.lastMessage.id;
      }
    }

    if (data.permission_overrides !== undefined) {
      this.permissionOverrides.clear();
      for (const overrideData of data.permission_overrides) {
        this.permissionOverrides.set(overrideData.id, new ChannelPermissionOverride(this.client, overrideData));
      }
    }
    return this;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      topic: this.topic,
      type: this.type,
      serverId: this.serverId,
      parentId: this.parentId,
      position: this.position,
      userLimit: this.userLimit,
      slowMode: this.slowMode,
      lastMessageId: this.lastMessageId,
      createdAt: this.createdAt?.toISOString() ?? null,
      permissionOverrides: this.permissionOverrides.map(o => o.toJSON()),
    };
  }
}
