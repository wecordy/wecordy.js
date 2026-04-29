import { Base } from './Base';
import type { Client } from '../client/Client';
import type { User, APIUser } from './User';
import type { Channel, APIChannel } from './Channel';
import type { Server, APIServer } from './Server';
import { MessageReaction, type APIMessageReaction } from './MessageReaction';
import { Collection } from '../util/Collection';
import { Formatters } from '../util/Formatters';

export interface APIMessageAttachment {
  url: string;
  mimetype: string;
  size: number;
}

export interface APIMessage {
  id: string;
  user_id: string | APIUser;
  webhook_id?: string;
  to_user_id?: string | APIUser;
  channel_id?: string | APIChannel;
  forum_post_id?: string;
  text: string;
  reply_to_message_id?: string | APIMessage;
  is_pinned?: boolean;
  attachments?: APIMessageAttachment[];
  created_at?: string;
  updated_at?: string;
  edited_at?: string;
  reactions?: APIMessageReaction[];
  // Populated fields
  server_id?: string | APIServer;
  temp_id?: string;
}

export class Message extends Base {
  /** The ID of the user who sent this message */
  public userId: string;

  /** The populated User model of the author, if available */
  public user: User | null = null;

  /** The ID of the webhook that sent this message, if applicable */
  public webhookId: string | null = null;

  /** The ID of the DM recipient, if this is a DM */
  public toUserId: string | null = null;

  /** The populated User model of the DM recipient, if available */
  public toUser: User | null = null;

  /** The ID of the channel this message was sent in */
  public channelId: string | null = null;

  /** The populated Channel model, if available */
  public channel: Channel | null = null;

  /** The ID of the forum post this message belongs to, if applicable */
  public forumPostId: string | null = null;

  /** The message text content */
  public content: string;

  /** The ID of the message this is a reply to, if applicable */
  public replyToMessageId: string | null = null;

  /** The populated Message model this message is replying to, if available */
  public replyToMessage: Message | null = null;

  /** Whether this message is pinned */
  public pinned: boolean;

  /** Array of file attachments */
  public attachments: APIMessageAttachment[];

  /** When this message was created */
  public createdAt: Date | null;

  /** When this message was last edited, if applicable */
  public editedAt: Date | null;

  /** The ID of the server this message was sent in (injected by socket events) */
  public serverId: string | null = null;

  /** The populated Server model, if available */
  public server: Server | null = null;

  /** The reactions on this message */
  public reactions: Collection<string, MessageReaction>;

  constructor(client: Client, data: APIMessage) {
    super(client, data.id);

    // user_id -> userId & user
    if (typeof data.user_id === 'string' || !data.user_id) {
      this.userId = data.user_id as string;
      this.user = null;
    } else {
      this.user = this.client.users._add(data.user_id);
      this.userId = this.user.id;
    }

    this.webhookId = data.webhook_id ?? null;

    // to_user_id -> toUserId & toUser
    if (typeof data.to_user_id === 'string' || !data.to_user_id) {
      this.toUserId = data.to_user_id as string ?? null;
      this.toUser = null;
    } else {
      this.toUser = this.client.users._add(data.to_user_id);
      this.toUserId = this.toUser.id;
    }

    // channel_id -> channelId & channel
    if (typeof data.channel_id === 'string' || !data.channel_id) {
      this.channelId = data.channel_id as string ?? null;
      this.channel = null;
    } else {
      this.channel = this.client.channels._add(data.channel_id);
      this.channelId = this.channel.id;
    }

    this.forumPostId = data.forum_post_id ?? null;
    this.content = Formatters.cleanContent(data.text);

    // reply_to_message_id -> replyToMessageId & replyToMessage
    if (typeof data.reply_to_message_id === 'string' || !data.reply_to_message_id) {
      this.replyToMessageId = data.reply_to_message_id as string ?? null;
      this.replyToMessage = null;
    } else {
      this.replyToMessage = this.client.messages._add(data.reply_to_message_id);
      this.replyToMessageId = this.replyToMessage.id;
    }

    this.pinned = data.is_pinned ?? false;
    this.attachments = data.attachments ?? [];
    this.createdAt = data.created_at ? new Date(data.created_at) : null;
    this.editedAt = data.edited_at ? new Date(data.edited_at) : null;

    // server_id -> serverId & server
    if (typeof data.server_id === 'string' || !data.server_id) {
      this.serverId = data.server_id as string ?? null;
      this.server = null;
    } else {
      this.server = this.client.servers._add(data.server_id);
      this.serverId = this.server.id;
    }

    this.reactions = new Collection();
    if (data.reactions) {
      for (const reactionData of data.reactions) {
        this.reactions.set(reactionData.id, new MessageReaction(client, reactionData));
      }
    }

    // Polyfill channelId for DMs: if no channelId, but this is a DM, use the other user's ID
    if (!this.channelId && this.isDM()) {
      this.channelId = this.isOwnMessage() ? this.toUserId : this.userId;
    }
  }

  /**
   * Whether this message was sent by the currently logged-in bot.
   */
  isOwnMessage(): boolean {
    return this.userId === this.client.user?.id;
  }

  /**
   * Whether this message is a direct message.
   */
  isDM(): boolean {
    return (!!this.toUserId || !this.serverId) && !this.forumPostId;
  }

  /**
   * Replies to this message in the same channel.
   * @param content - The reply text
   */
  async reply(content: string): Promise<Message> {
    const options = {
      text: content,
      reply_to_message_id: this.id,
    };

    if (this.isDM()) {
      const targetId = this.isOwnMessage() ? this.toUserId : this.userId;
      if (!targetId) throw new Error('Cannot reply to a DM without a recipient ID.');
      return this.client.messages._sendDM(targetId, options);
    }

    if (!this.channelId) {
      throw new Error('Cannot reply to a message without a channel.');
    }
    return this.client.messages.send(this.channelId, options);
  }

  /**
   * Edits this message's content.
   * @param newContent - The new text content
   */
  async edit(newContent: string): Promise<Message> {
    return this.client.messages.edit(this.id, newContent);
  }

  /**
   * Deletes this message.
   */
  async delete(): Promise<void> {
    if (this.isDM()) {
      return this.client.messages._deleteDM(this.id);
    }

    if (!this.channelId) {
      throw new Error('Cannot delete a message without a channel.');
    }
    return this.client.messages.delete(this.channelId, this.id);
  }

  /**
   * Adds a reaction to this message.
   * @param emoji - The emoji to react with
   */
  async react(emoji: string): Promise<void> {
    if (this.isDM()) {
      return this.client.messages._reactDM(this.id, emoji);
    }

    if (!this.channelId) {
      throw new Error('Cannot react to a message without a channel.');
    }
    return this.client.messages.react(this.channelId, this.id, emoji);
  }

  /**
   * Updates this message with new data.
   */
  _patch(data: Partial<APIMessage>): Message {
    if (data.text !== undefined) this.content = Formatters.cleanContent(data.text);

    if (data.user_id !== undefined) {
      if (typeof data.user_id === 'string' || !data.user_id) {
        this.userId = data.user_id as string ?? null;
        this.user = null;
      } else {
        this.user = this.client.users._add(data.user_id);
        this.userId = this.user.id;
      }
    }

    if (data.to_user_id !== undefined) {
      if (typeof data.to_user_id === 'string' || !data.to_user_id) {
        this.toUserId = data.to_user_id as string ?? null;
        this.toUser = null;
      } else {
        this.toUser = this.client.users._add(data.to_user_id);
        this.toUserId = this.toUser.id;
      }
    }

    if (data.channel_id !== undefined) {
      if (typeof data.channel_id === 'string' || !data.channel_id) {
        this.channelId = data.channel_id as string ?? null;
        this.channel = null;
      } else {
        this.channel = this.client.channels._add(data.channel_id);
        this.channelId = this.channel.id;
      }
    }

    if (data.reply_to_message_id !== undefined) {
      if (typeof data.reply_to_message_id === 'string' || !data.reply_to_message_id) {
        this.replyToMessageId = data.reply_to_message_id as string ?? null;
        this.replyToMessage = null;
      } else {
        this.replyToMessage = this.client.messages._add(data.reply_to_message_id);
        this.replyToMessageId = this.replyToMessage.id;
      }
    }

    if (data.server_id !== undefined) {
      if (typeof data.server_id === 'string' || !data.server_id) {
        this.serverId = data.server_id as string ?? null;
        this.server = null;
      } else {
        this.server = this.client.servers._add(data.server_id);
        this.serverId = this.server.id;
      }
    }

    if (data.is_pinned !== undefined) this.pinned = data.is_pinned;
    if (data.attachments !== undefined) this.attachments = data.attachments;
    if (data.edited_at !== undefined) this.editedAt = data.edited_at ? new Date(data.edited_at) : null;
    if (data.reactions !== undefined) {
      this.reactions.clear();
      for (const reactionData of data.reactions) {
        this.reactions.set(reactionData.id, new MessageReaction(this.client, reactionData));
      }
    }
    return this;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      userId: this.userId,
      toUserId: this.toUserId,
      channelId: this.channelId,
      serverId: this.serverId,
      content: this.content,
      pinned: this.pinned,
      attachments: this.attachments,
      replyToMessageId: this.replyToMessageId,
      createdAt: this.createdAt?.toISOString() ?? null,
      editedAt: this.editedAt?.toISOString() ?? null,
      reactions: this.reactions.map(r => r.toJSON()),
    };
  }
}
