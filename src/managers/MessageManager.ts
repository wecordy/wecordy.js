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
  attachments?: APIMessageAttachment[];
  temp_id?: string;
}

/**
 * Manages messages (send, edit, delete, react).
 */
export class MessageManager extends BaseManager<Message> {
  constructor(client: Client) {
    super(client);
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
    const body: MessageCreateOptions =
      typeof content === 'string'
        ? { text: content, temp_id: this.generateTempId() }
        : { ...content, temp_id: content.temp_id ?? this.generateTempId() };

    const data = await this.client.rest.put<APIMessage>(
      APIRoutes.sendChannelMessage(),
      { channel_id: channelId, ...body },
    );
    return this._add(data);
  }

  /**
   * Edits a message's content.
   * @param messageId - The message ID to edit
   * @param newContent - The new text content
   */
  async edit(messageId: string, newContent: string): Promise<Message> {
    const data = await this.client.rest.patch<APIMessage>(
      APIRoutes.editMessage(),
      { message_id: messageId, text: newContent },
    );
    const existing = this.cache.get(messageId);
    if (existing) {
      existing._patch(data);
      return existing;
    }
    return this._add(data);
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
    return data.map((msg) => this._add(msg));
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
    const body: MessageCreateOptions =
      typeof content === 'string'
        ? { text: content, temp_id: this.generateTempId() }
        : { ...content, temp_id: content.temp_id ?? this.generateTempId() };

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
      APIRoutes.directMessages() + '/reaction',
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
    return data.map((msg) => this._add(msg));
  }

  /**
   * Constructs a Message instance from raw API data and adds it to the cache.
   */
  _add(messageOrData: Message | APIMessage): Message {
    const message = messageOrData instanceof Message
      ? messageOrData
      : new Message(this.client, messageOrData);
    this.cache.set(message.id, message);
    return message;
  }

  /**
   * Generates a temporary ID for message tracking (before server assigns real ID).
   */
  private generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
