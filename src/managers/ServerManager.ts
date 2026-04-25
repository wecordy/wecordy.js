import { BaseManager } from './BaseManager';
import { Server, type APIServer } from '../structures/Server';
import { APIRoutes } from '../rest/APIRoutes';
import type { Client } from '../client/Client';

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
    const server = new Server(this.client, data);
    this._add(server);
    return server;
  }

  /**
   * Constructs a Server instance from raw API data and adds it to the cache.
   * Used internally by gateway event handlers.
   */
  _add(serverOrData: Server | APIServer): Server {
    const server = serverOrData instanceof Server
      ? serverOrData
      : new Server(this.client, serverOrData);
    this.cache.set(server.id, server);
    return server;
  }
}
