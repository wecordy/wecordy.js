import { Base } from './Base';
import type { Client } from '../client/Client';
import type { User, APIUser } from './User';

export interface APIApplication {
  id: string;
  name: string;
  description: string;
  summary: string;
  avatar_url: string;
  owner_id: string | APIUser;
  bot_user_id: string | APIUser;
  client_id: string;
  is_public: boolean;
  redirect_uris: string[];
  tos_url: string;
  privacy_policy_url: string;
  interactions_endpoint_url: string;
  created_at: string;
  updated_at: string;
}

/**
 * Represents a Wecordy application (bot).
 */
export class Application extends Base {
  /** The name of the application */
  public name: string;

  /** The description of the application */
  public description: string;

  /** A summary of the application */
  public summary: string;

  /** The avatar URL of the application */
  public avatarURL: string | null;

  /** The ID of the owner of this application */
  public ownerId: string;

  /** The populated User model of the owner, if available */
  public owner: User | null = null;

  /** The ID of the bot user associated with this application */
  public botUserId: string;

  /** The populated User model of the bot, if available */
  public botUser: User | null = null;

  /** The client ID of the application */
  public clientId: string;

  /** Whether the bot is public (can be added by anyone) */
  public isPublic: boolean;

  /** The URL where interactions are sent */
  public interactionsEndpointURL: string | null;

  constructor(client: Client, data: APIApplication) {
    super(client, data.id);
    this.name = data.name;
    this.description = data.description;
    this.summary = data.summary;
    this.avatarURL = data.avatar_url || null;

    // owner_id -> ownerId & owner
    if (typeof data.owner_id === 'string' || !data.owner_id) {
      this.ownerId = data.owner_id as string;
      this.owner = null;
    } else {
      this.owner = this.client.users._add(data.owner_id);
      this.ownerId = this.owner.id;
    }

    // bot_user_id -> botUserId & botUser
    if (typeof data.bot_user_id === 'string' || !data.bot_user_id) {
      this.botUserId = data.bot_user_id as string;
      this.botUser = null;
    } else {
      this.botUser = this.client.users._add(data.bot_user_id);
      this.botUserId = this.botUser.id;
    }

    this.clientId = data.client_id;
    this.isPublic = data.is_public ?? false;
    this.interactionsEndpointURL = data.interactions_endpoint_url || null;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      summary: this.summary,
      avatarURL: this.avatarURL,
      ownerId: this.ownerId,
      owner: this.owner?.toJSON() ?? null,
      botUserId: this.botUserId,
      botUser: this.botUser?.toJSON() ?? null,
      clientId: this.clientId,
      isPublic: this.isPublic,
      interactionsEndpointURL: this.interactionsEndpointURL,
    };
  }
}
