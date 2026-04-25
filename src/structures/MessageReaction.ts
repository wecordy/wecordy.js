import { Base } from './Base';
import type { Client } from '../client/Client';
import type { User, APIUser } from './User';

export interface APIMessageReaction {
  id: string;
  message_id: string;
  user_id: string | APIUser;
  emoji: string;
  created_at: string;
}

/**
 * Represents a reaction on a message.
 */
export class MessageReaction extends Base {
  /** The ID of the message this reaction is on */
  public messageId: string;

  /** The ID of the user who reacted */
  public userId: string;

  /** The populated User model of the reactor, if available */
  public user: User | null = null;

  /** The emoji used for the reaction */
  public emoji: string;

  /** When this reaction was created */
  public createdAt: Date;

  constructor(client: Client, data: APIMessageReaction) {
    super(client, data.id);
    this.messageId = data.message_id;

    // user_id -> userId & user
    if (typeof data.user_id === 'string' || !data.user_id) {
      this.userId = data.user_id as string;
      this.user = null;
    } else {
      this.user = this.client.users._add(data.user_id);
      this.userId = this.user.id;
    }

    this.emoji = data.emoji;
    this.createdAt = new Date(data.created_at);
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      messageId: this.messageId,
      userId: this.userId,
      emoji: this.emoji,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
