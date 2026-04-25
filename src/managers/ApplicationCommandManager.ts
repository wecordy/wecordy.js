import { APIRoutes } from '../rest/APIRoutes';
import type { Client } from '../client/Client';
import { SlashCommandBuilder } from '../builders/SlashCommandBuilder';

/**
 * Raw application command data as returned by the backend.
 */
export interface APIApplicationCommand {
  id: string;
  application_id: string;
  server_id?: string;
  name: string;
  description: string;
  type?: number;
  options?: unknown[];
  default_member_permissions?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Manages application commands (slash commands) registration.
 * This does NOT use BaseManager because commands are not cached as structures —
 * they are configuration data registered with the API.
 */
export class ApplicationCommandManager {
  /** Reference to the Client */
  public readonly client: Client;

  /** The application ID */
  public readonly applicationId: string;

  constructor(client: Client, applicationId: string) {
    this.client = client;
    this.applicationId = applicationId;
  }

  /**
   * Fetches all global commands for this application.
   */
  async fetch(): Promise<APIApplicationCommand[]> {
    return this.client.rest.get<APIApplicationCommand[]>(
      APIRoutes.applicationCommands(this.applicationId),
    );
  }

  /**
   * Registers a single global command (upsert — creates or updates).
   * @param command - A SlashCommandBuilder or raw command data
   */
  async create(command: SlashCommandBuilder | Record<string, unknown>): Promise<APIApplicationCommand> {
    const data = command instanceof SlashCommandBuilder ? command.toJSON() : command;
    return this.client.rest.post<APIApplicationCommand>(
      APIRoutes.applicationCommands(this.applicationId),
      data,
    );
  }

  /**
   * Bulk overwrites all global commands.
   * All existing commands not in this array will be deleted.
   *
   * This is the most common pattern:
   * ```typescript
   * client.application.commands.set([pingCommand, helpCommand]);
   * ```
   *
   * @param commands - Array of SlashCommandBuilder or raw command data
   */
  async set(
    commands: Array<SlashCommandBuilder | Record<string, unknown>>,
  ): Promise<APIApplicationCommand[]> {
    const data = commands.map((cmd) => (cmd instanceof SlashCommandBuilder ? cmd.toJSON() : cmd));
    return this.client.rest.put<APIApplicationCommand[]>(
      APIRoutes.applicationCommands(this.applicationId),
      { commands: data },
    );
  }

  /**
   * Deletes a single global command.
   * @param commandId - The command ID to delete
   */
  async delete(commandId: string): Promise<void> {
    await this.client.rest.delete(
      APIRoutes.applicationCommand(this.applicationId, commandId),
    );
  }

  /**
   * Edits (partial update) a single global command.
   * @param commandId - The command ID to edit
   * @param data - The fields to update
   */
  async edit(commandId: string, data: Partial<Record<string, unknown>>): Promise<APIApplicationCommand> {
    return this.client.rest.patch<APIApplicationCommand>(
      APIRoutes.applicationCommand(this.applicationId, commandId),
      data,
    );
  }

  // ─── Server-Specific Commands ─────────────────────────────────

  /**
   * Fetches all commands for a specific server.
   * @param serverId - The server ID
   */
  async fetchServer(serverId: string): Promise<APIApplicationCommand[]> {
    return this.client.rest.get<APIApplicationCommand[]>(
      APIRoutes.applicationServerCommands(this.applicationId, serverId),
    );
  }

  /**
   * Registers a single command for a specific server.
   * @param serverId - The server ID
   * @param command - The command data
   */
  async createServer(
    serverId: string,
    command: SlashCommandBuilder | Record<string, unknown>,
  ): Promise<APIApplicationCommand> {
    const data = command instanceof SlashCommandBuilder ? command.toJSON() : command;
    return this.client.rest.post<APIApplicationCommand>(
      APIRoutes.applicationServerCommands(this.applicationId, serverId),
      data,
    );
  }

  /**
   * Bulk overwrites all commands for a specific server.
   * @param serverId - The server ID
   * @param commands - The commands to set
   */
  async setServer(
    serverId: string,
    commands: Array<SlashCommandBuilder | Record<string, unknown>>,
  ): Promise<APIApplicationCommand[]> {
    const data = commands.map((cmd) => (cmd instanceof SlashCommandBuilder ? cmd.toJSON() : cmd));
    return this.client.rest.put<APIApplicationCommand[]>(
      APIRoutes.applicationServerCommands(this.applicationId, serverId),
      { commands: data },
    );
  }

  /**
   * Deletes a single server-specific command.
   * @param serverId - The server ID
   * @param commandId - The command ID
   */
  async deleteServer(serverId: string, commandId: string): Promise<void> {
    await this.client.rest.delete(
      APIRoutes.applicationServerCommand(this.applicationId, serverId, commandId),
    );
  }
}
