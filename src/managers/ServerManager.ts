import { BaseManager } from './BaseManager';
import { Server, type APIServer } from '../structures/Server';
import type { APIMember } from '../structures/Member';
import { ServerInvite, type APIServerInvite } from '../structures/ServerInvite';
import { AuditLog, type APIAuditLog } from '../structures/AuditLog';
import { APIRoutes } from '../rest/APIRoutes';
import type { Client } from '../client/Client';

/**
 * Options for fetching audit logs.
 */
export interface AuditLogFetchOptions {
  before?: string;
  after?: string;
  limit?: number;
  /** Filter by action type */
  actionType?: string;
}

/**
 * Manages servers the bot is a member of.
 * Provides fetch, cache, and lookup operations.
 */
export class ServerManager extends BaseManager<Server> {
  constructor(client: Client) {
    super(client);
  }

  /**
   * Fetches a server by ID from the API and caches it.
   * @param serverId - The server ID
   * @param force - If true, bypasses cache and fetches from API
   */
  async fetch(serverId: string, force: boolean = false): Promise<Server> {
    if (!force) {
      const cached = this.cache.get(serverId);
      if (cached) return cached;
    }

    const data = await this.client.rest.get<APIServer>(APIRoutes.server(serverId));
    return this._add(data);
  }

  /**
   * Fetches all servers the bot is a member of and caches them.
   */
  async fetchAll(): Promise<Server[]> {
    const memberships = await this.client.rest.get<APIMember[]>(APIRoutes.userServers());
    const servers: Server[] = [];
    for (const membership of memberships ?? []) {
      if (membership.server_id && typeof membership.server_id === 'object') {
        servers.push(this._add(membership.server_id));
      }
    }
    return servers;
  }

  /**
   * Creates an invite for a server.
   * @param serverId - The server ID
   */
  async createInvite(serverId: string): Promise<ServerInvite> {
    const data = await this.client.rest.post<APIServerInvite>(APIRoutes.serverInvites(serverId), {});
    return new ServerInvite(this.client, data);
  }

  /**
   * Fetches the invites of a server.
   * @param serverId - The server ID
   */
  async fetchInvites(serverId: string): Promise<ServerInvite[]> {
    const data = await this.client.rest.get<APIServerInvite[]>(APIRoutes.serverInvites(serverId));
    return (data ?? []).map((invite) => new ServerInvite(this.client, invite));
  }

  /**
   * Deletes an invite of a server.
   * @param serverId - The server ID
   * @param inviteId - The invite ID
   */
  async deleteInvite(serverId: string, inviteId: string): Promise<void> {
    await this.client.rest.delete(APIRoutes.serverInvite(serverId, inviteId));
  }

  /**
   * Fetches the audit logs of a server.
   * @param serverId - The server ID
   * @param options - Pagination and filter options
   */
  async fetchAuditLogs(serverId: string, options: AuditLogFetchOptions = {}): Promise<AuditLog[]> {
    const data = await this.client.rest.post<APIAuditLog[]>(APIRoutes.auditLog(serverId), {
      server_id: serverId,
      pagination: {
        before: options.before,
        after: options.after,
        limit: options.limit ?? 50,
      },
      action_type: options.actionType,
    });
    return (data ?? []).map((log) => new AuditLog(this.client, log));
  }

  /**
   * Adds a Server instance to the cache, or constructs one from raw API data.
   * Raw data for an already cached server updates the cached instance instead of replacing it.
   */
  _add(serverOrData: Server | APIServer): Server {
    if (serverOrData instanceof Server) {
      this.cache.set(serverOrData.id, serverOrData);
      return serverOrData;
    }

    const existing = this.cache.get(serverOrData.id);
    if (existing) return existing._patch(serverOrData);

    const server = new Server(this.client, serverOrData);
    this.cache.set(server.id, server);
    return server;
  }
}
