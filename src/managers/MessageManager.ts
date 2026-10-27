import { BaseManager } from './BaseManager';
import { Message, type APIMessage, type APIMessageAttachment } from '../structures/Message';
import { APIRoutes } from '../rest/APIRoutes';
import type { Client } from '../client/Client';

/**
 * Options for sending a message.
 */
export interface MessageCreateOptions {
  text: string;
  reply_to_message_id?: string;
  /** Only for channel messages: sends the message as a reply in a forum post */
  forum_post_id?: string;
  /** Attachments must be uploaded to the Wecordy CDN (cdn.wecordy.com) beforehand */
  attachments?: APIMessageAttachment[];
  temp_id?: string;
}

/** Default maximum number of messages kept in the cache */
const DEFAULT_MESSAGE_CACHE_SIZE = 500;

/**
 * Manages messages (send, edit, delete, react).
 */
export class MessageManager extends BaseManager<Message> {
  /** Maximum number of messages kept in the cache (oldest are evicted first) */
  public readonly maxCacheSize: number;

  constructor(client: Client) {
    super(client);
    this.maxCacheSize = client.options.messageCacheMaxSize ?? DEFAULT_MESSAGE_CACHE_SIZE;
  }

  /**
   * Sends a message to a channel.
   * @param channelId - The channel ID
   * @param content - The message content (string or options object)
   */
  async send(
    channelId: string,
    content: string | MessageCreateOptions,
  ): Promise<Message> {
    const data = await this.client.rest.put<APIMessage>(
      APIRoutes.sendChannelMessage(),
      { channel_id: channelId, ...this.resolveBody(content) },
    );
    return this._add(data);
  }

  /**
   * Edits a message's content.
   * The backend doesn't return the edited message; the cached message (if any) is updated and returned.
   * @param messageId - The message ID to edit
   * @param newContent - The new text content
   */
  async edit(messageId: string, newContent: string): Promise<Message | null> {
    await this.client.rest.patch(
      APIRoutes.editMessage(),
      { message_id: messageId, text: newContent },
    );
    const existing = this.cache.get(messageId);
    if (!existing) return null;
    return existing._patch({ text: newContent, edited_at: new Date().toISOString() });
  }

  /**
   * Deletes a message from a channel.
   * @param channelId - The channel ID
   * @param messageId - The message ID
   */
  async delete(channelId: string, messageId: string): Promise<void> {
    await this.client.rest.delete(
      APIRoutes.deleteChannelMessage(),
      { data: { channel_id: channelId, message_id: messageId } }
    );
    this._remove(messageId);
  }

  /**
   * Reacts to a message with an emoji.
   * Reacting again with the same emoji removes the reaction.
   * @param channelId - The channel ID
   * @param messageId - The message ID
   * @param emoji - The emoji string
   */
  async react(channelId: string, messageId: string, emoji: string): Promise<void> {
    await this.client.rest.put(
      APIRoutes.channelMessageReaction(),
      { channel_id: channelId, message_id: messageId, emoji },
    );
  }

  /**
   * Pins a message in a channel.
   * @param channelId - The channel ID
   * @param messageId - The message ID
   */
  async pin(channelId: string, messageId: string): Promise<void> {
    await this.client.rest.post(APIRoutes.pinMessage(), { channel_id: channelId, message_id: messageId });
    this.cache.get(messageId)?._patch({ is_pinned: true });
  }

  /**
   * Unpins a message in a channel.
   * @param channelId - The channel ID
   * @param messageId - The message ID
   */
  async unpin(channelId: string, messageId: string): Promise<void> {
    await this.client.rest.post(APIRoutes.unpinMessage(), { channel_id: channelId, message_id: messageId });
    this.cache.get(messageId)?._patch({ is_pinned: false });
  }

  /**
   * Fetches the pinned messages of a channel.
   * @param channelId - The channel ID
   */
  async fetchPinned(channelId: string): Promise<Message[]> {
    const data = await this.client.rest.post<APIMessage[]>(APIRoutes.pinnedMessages(), { channel_id: channelId });
    return (data ?? []).map((msg) => this._add({ channel_id: channelId, ...msg }));
  }

  /**
   * Shows the typing indicator in a channel.
   * @param channelId - The channel ID
   */
  async startTyping(channelId: string): Promise<void> {
    await this.client.rest.post(APIRoutes.channelTyping(), { channel_id: channelId });
  }

  /**
   * Hides the typing indicator in a channel.
   * @param channelId - The channel ID
   */
  async stopTyping(channelId: string): Promise<void> {
    await this.client.rest.delete(APIRoutes.channelTyping(), { data: { channel_id: channelId } });
  }

  /**
   * Fetches messages from a channel.
   * @param channelId - The channel ID
   * @param options - Pagination options
   */
  async fetchChannelMessages(
    channelId: string,
    options?: { before?: string; after?: string; limit?: number },
  ): Promise<Message[]> {
    const data = await this.client.rest.post<APIMessage[]>(
      APIRoutes.channelMessages(),
      {
        channel_id: channelId,
        pagination: {
          before: options?.before,
          after: options?.after,
          limit: options?.limit ?? 50
        }
      }
    );
    return (data ?? []).map((msg) => this._add(msg));
  }

  /**
   * Sends a direct message to a user.
   * @param userId - The recipient user ID
   * @param content - The message content
   * @internal
   */
  async _sendDM(
    userId: string,
    content: string | MessageCreateOptions,
  ): Promise<Message> {
    // forum_post_id is not accepted for DMs
    const { forum_post_id: _forumPostId, ...body } = this.resolveBody(content);
    const data = await this.client.rest.put<APIMessage>(
      APIRoutes.sendDirectMessage(),
      { user_id: userId, ...body },
    );
    return this._add(data);
  }

  /**
   * Deletes a direct message.
   * @param messageId - The message ID
   * @internal
   */
  async _deleteDM(messageId: string): Promise<void> {
    await this.client.rest.delete(
      APIRoutes.directMessages(),
      { data: { message_id: messageId } }
    );
    this._remove(messageId);
  }

  /**
   * Reacts to a DM with an emoji.
   * @param messageId - The message ID
   * @param emoji - The emoji string
   * @internal
   */
  async _reactDM(messageId: string, emoji: string): Promise<void> {
    await this.client.rest.put(
      APIRoutes.directMessageReaction(),
      { message_id: messageId, emoji },
    );
  }

  /**
   * Fetches DM messages with a user.
   * @param userId - The user ID
   * @param options - Pagination options
   */
  async fetchDirectMessages(
    userId: string,
    options?: { before?: string; after?: string; limit?: number },
  ): Promise<Message[]> {
    const data = await this.client.rest.post<APIMessage[]>(
      APIRoutes.directMessages(),
      {
        user_id: userId,
        pagination: {
          before: options?.before,
          after: options?.after,
          limit: options?.limit ?? 50
        }
      }
    );
    return (data ?? []).map((msg) => this._add(msg));
  }

  /**
   * Adds a Message instance to the cache, or constructs one from raw API data.
   * Raw data for an already cached message updates the cached instance.
   * The oldest cached messages are evicted once the cache exceeds `maxCacheSize`.
   */
  _add(messageOrData: Message | APIMessage): Message {
    const existing = messageOrData instanceof Message ? undefined : this.cache.get(messageOrData.id);
    const message = messageOrData instanceof Message
      ? messageOrData
      : existing?._patch(messageOrData) ?? new Message(this.client, messageOrData);
    if (!message.id) return message;

    // Re-insert so that recently seen messages are evicted last
    this.cache.delete(message.id);
    this.cache.set(message.id, message);
    while (this.cache.size > this.maxCacheSize) {
      const oldestKey = this.cache.firstKey();
      if (oldestKey === undefined) break;
      this.cache.delete(oldestKey);
    }
    return message;
  }

  /**
   * Builds the request body for a new message.
   */
  private resolveBody(content: string | MessageCreateOptions): MessageCreateOptions {
    return typeof content === 'string'
      ? { text: content, temp_id: this.generateTempId() }
      : { ...content, temp_id: content.temp_id ?? this.generateTempId() };
  }

  /**
   * Generates a temporary ID for message tracking (before server assigns real ID).
   */
  private generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
