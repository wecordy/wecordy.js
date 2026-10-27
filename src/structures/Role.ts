import { Base } from './Base';
import type { Client } from '../client/Client';
import { Permissions } from '../util/Permissions';
import { Formatters } from '../util/Formatters';
import type { Server, APIServer } from './Server';
import type { RoleData } from '../managers/RoleManager';

export interface APIRole {
  id: string;
  name: string;
  color?: string;
  position?: number;
  permissions?: Record<string, number>;
  server_id: string | APIServer;
  is_default?: boolean;
  bot_id?: string;
  is_managed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class Role extends Base {
  /** The name of this role */
  public name: string;

  /** The hex color of this role (e.g. #99AAB5) */
  public color: string;

  /** The position of this role in the hierarchy */
  public position: number;

  /** The permissions this role grants */
  public permissions: Permissions;

  /** The ID of the server this role belongs to */
  public serverId: string;

  /** The populated Server model, if available */
  public server: Server | null = null;

  /** Whether this is the default @everyone role */
  public isDefault: boolean;

  /** The ID of the bot that manages this role (if managed) */
  public botId: string | null;

  /** Whether this role is managed by a bot integration */
  public isManaged: boolean;

  /** When this role was created */
  public createdAt: Date | null;

  constructor(client: Client, data: APIRole) {
    super(client, data.id);
    this.name = data.name;
    this.color = data.color ?? '#99AAB5';
    this.position = data.position ?? 0;

    // server_id -> serverId & server
    if (typeof data.server_id === 'string' || !data.server_id) {
      this.serverId = data.server_id as string;
      this.server = null;
    } else {
      this.server = this.client.servers._add(data.server_id);
      this.serverId = this.server.id;
    }
    this.isDefault = data.is_default ?? false;
    this.botId = data.bot_id ?? null;
    this.isManaged = data.is_managed ?? false;
    this.createdAt = data.created_at ? new Date(data.created_at) : null;

    // Convert backend permission format to bitfield
    this.permissions = data.permissions
      ? Permissions.fromBackendFormat(data.permissions)
      : new Permissions(Permissions.Default);
  }

  /**
   * Updates this role with new data.
   */
  _patch(data: Partial<APIRole>): Role {
    if (data.name !== undefined) this.name = data.name;
    if (data.color !== undefined) this.color = data.color ?? '#99AAB5';
    if (data.position !== undefined) this.position = data.position;

    if (data.server_id !== undefined) {
      if (typeof data.server_id === 'string' || !data.server_id) {
        this.serverId = data.server_id as string;
        this.server = null;
      } else {
        this.server = this.client.servers._add(data.server_id);
        this.serverId = this.server.id;
      }
    }

    if (data.permissions !== undefined) {
      this.permissions = Permissions.fromBackendFormat(data.permissions ?? {});
    }
    if (data.is_default !== undefined) this.isDefault = data.is_default;
    if (data.is_managed !== undefined) this.isManaged = data.is_managed;
    if (data.bot_id !== undefined) this.botId = data.bot_id ?? null;
    return this;
  }

  /**
   * Edits this role.
   * @param options - The fields to update
   */
  async edit(options: RoleData): Promise<Role> {
    return this.client.roles.edit(this.serverId, this.id, options);
  }

  /**
   * Deletes this role.
   */
  async delete(): Promise<void> {
    await this.client.roles.delete(this.serverId, this.id);
  }

  /**
   * The mention string for this role.
   */
  get mention(): string {
    return Formatters.roleMention(this.id, this.name);
  }

  /**
   * The mention string for this role.
   */
  toString(): string {
    return this.mention;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      position: this.position,
      permissions: this.permissions.serialize(),
      serverId: this.serverId,
      isDefault: this.isDefault,
      isManaged: this.isManaged,
      botId: this.botId,
      createdAt: this.createdAt?.toISOString() ?? null,
    };
  }
}
