import { APIRoutes } from '../rest/APIRoutes';
import type { Client } from '../client/Client';
import { SlashCommandBuilder } from '../builders/SlashCommandBuilder';
import { WecordyError } from '../errors';

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
    const data = await this.client.rest.get<APIApplicationCommand[]>(
      APIRoutes.applicationCommands(this.applicationId),
    );
    return data ?? [];
  }

  /**
   * Fetches a single global command.
   * @param commandId - The command ID
   */
  async fetchOne(commandId: string): Promise<APIApplicationCommand> {
    return this.client.rest.get<APIApplicationCommand>(
      APIRoutes.applicationCommand(this.applicationId, commandId),
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
    const result = await this.client.rest.put<APIApplicationCommand[]>(
      APIRoutes.applicationCommands(this.applicationId),
      { commands: data },
    );
    return result ?? [];
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
  async edit(
    commandId: string,
    data: SlashCommandBuilder | Partial<Record<string, unknown>>,
  ): Promise<APIApplicationCommand> {
    // The command type can't be changed after creation
    const { type: _type, ...body } = data instanceof SlashCommandBuilder ? data.toJSON() : data;
    return this.client.rest.patch<APIApplicationCommand>(
      APIRoutes.applicationCommand(this.applicationId, commandId),
      body,
    );
  }

  // ─── Server-Specific Commands ─────────────────────────────────
  // The Wecordy API only supports global commands for now. These methods are kept
  // for backwards compatibility and fail with a descriptive error.

  /**
   * Fetches all commands for a specific server.
   * @deprecated Server specific commands are not supported by the Wecordy API yet. Use {@link fetch}.
   */
  async fetchServer(_serverId: string): Promise<APIApplicationCommand[]> {
    throw this.serverCommandsUnsupported();
  }

  /**
   * Registers a single command for a specific server.
   * @deprecated Server specific commands are not supported by the Wecordy API yet. Use {@link create}.
   */
  async createServer(
    _serverId: string,
    _command: SlashCommandBuilder | Record<string, unknown>,
  ): Promise<APIApplicationCommand> {
    throw this.serverCommandsUnsupported();
  }

  /**
   * Bulk overwrites all commands for a specific server.
   * @deprecated Server specific commands are not supported by the Wecordy API yet. Use {@link set}.
   */
  async setServer(
    _serverId: string,
    _commands: Array<SlashCommandBuilder | Record<string, unknown>>,
  ): Promise<APIApplicationCommand[]> {
    throw this.serverCommandsUnsupported();
  }

  /**
   * Deletes a single server-specific command.
   * @deprecated Server specific commands are not supported by the Wecordy API yet. Use {@link delete}.
   */
  async deleteServer(_serverId: string, _commandId: string): Promise<void> {
    throw this.serverCommandsUnsupported();
  }

  private serverCommandsUnsupported(): WecordyError {
    return new WecordyError(
      'UNSUPPORTED',
      'Server specific commands are not supported by the Wecordy API yet. Register global commands instead.',
    );
  }
}
