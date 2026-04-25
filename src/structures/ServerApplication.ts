import { Base } from './Base';
import type { Client } from '../client/Client';
import type { Server, APIServer } from './Server';
import type { User, APIUser } from './User';
import { Application, type APIApplication } from './Application';

export interface APIServerBot {
  id: string;
  application_id: string | APIApplication;
  server_id: string | APIServer;
  bot_user_id: string | APIUser;
  permissions: number;
  created_at: string;
  updated_at: string;
}

/**
 * Represents a bot's presence and permissions within a server.
 * (Equivalent to ServerHasBot in backend)
 */
export class ServerApplication extends Base {
  /** The ID of the application this bot belongs to */
  public applicationId: string;

  /** The populated Application model, if available */
  public application: Application | null = null;

  /** The ID of the server the bot is in */
  public serverId: string;

  /** The populated Server model, if available */
  public server: Server | null = null;

  /** The ID of the bot's user account */
  public botUserId: string;

  /** The populated User model of the bot, if available */
  public botUser: User | null = null;

  /** The permissions this bot has in the server */
  public permissions: number;

  /** When the bot was added to the server */
  public joinedAt: Date;

  constructor(client: Client, data: APIServerBot) {
    super(client, data.id);

    // application_id -> applicationId & application
    if (typeof data.application_id === 'string' || !data.application_id) {
      this.applicationId = data.application_id as string;
      this.application = null;
    } else {
      this.application = new Application(this.client, data.application_id);
      this.applicationId = this.application.id;
    }

    // server_id -> serverId & server
    if (typeof data.server_id === 'string' || !data.server_id) {
      this.serverId = data.server_id as string;
      this.server = null;
    } else {
      this.server = this.client.servers._add(data.server_id);
      this.serverId = this.server.id;
    }

    // bot_user_id -> botUserId & botUser
    if (typeof data.bot_user_id === 'string' || !data.bot_user_id) {
      this.botUserId = data.bot_user_id as string;
      this.botUser = null;
    } else {
      this.botUser = this.client.users._add(data.bot_user_id);
      this.botUserId = this.botUser.id;
    }

    this.permissions = data.permissions ?? 0;
    this.joinedAt = new Date(data.created_at);
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      applicationId: this.applicationId,
      serverId: this.serverId,
      botUserId: this.botUserId,
      permissions: this.permissions,
      joinedAt: this.joinedAt.toISOString(),
    };
  }
}
