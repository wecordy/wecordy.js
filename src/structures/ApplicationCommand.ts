import { Base } from './Base';
import type { Client } from '../client/Client';
import { Application, type APIApplication } from './Application';
import { Server, type APIServer } from './Server';

/**
 * Raw command option data.
 */
export interface APICommandOption {
  name: string;
  description: string;
  type: number;
  required?: boolean;
  choices?: Array<{ name: string; value: string | number }>;
  options?: APICommandOption[];
  min_value?: number;
  max_value?: number;
  min_length?: number;
  max_length?: number;
}

export interface APIApplicationCommand {
  id: string;
  application_id: string | APIApplication;
  server_id?: string | APIServer;
  name: string;
  description: string;
  type: number;
  options: APICommandOption[];
  default_member_permissions?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Represents an application command (slash command).
 */
export class ApplicationCommand extends Base {
  /** The ID of the application this command belongs to */
  public applicationId: string;

  /** The populated Application model, if available */
  public application: Application | null = null;

  /** The ID of the server this command is restricted to, if any */
  public serverId: string | null;

  /** The populated Server model, if available */
  public server: Server | null = null;

  /** The name of this command */
  public name: string;

  /** The description of this command */
  public description: string;

  /** The type of this command (1 = CHAT_INPUT, 2 = USER, 3 = MESSAGE) */
  public type: number;

  /** The options for this command */
  public options: APICommandOption[];

  /** Default bitwise permissions for this command */
  public defaultMemberPermissions: string | null;

  /** When this command was created */
  public createdAt: Date;

  constructor(client: Client, data: APIApplicationCommand) {
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
      this.serverId = data.server_id as string ?? null;
      this.server = null;
    } else {
      this.server = this.client.servers._add(data.server_id);
      this.serverId = this.server.id;
    }

    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.options = data.options ?? [];
    this.defaultMemberPermissions = data.default_member_permissions ?? null;
    this.createdAt = new Date(data.created_at);
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      applicationId: this.applicationId,
      serverId: this.serverId,
      name: this.name,
      description: this.description,
      type: this.type,
      options: this.options,
      defaultMemberPermissions: this.defaultMemberPermissions,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
