import { BaseManager } from './BaseManager';
import { Channel, type APIChannel } from '../structures/Channel';
import { APIRoutes } from '../rest/APIRoutes';
import type { Client } from '../client/Client';

/**
 * Manages channels across all servers.
 * Provides fetch, cache, and lookup operations.
 */
export class ChannelManager extends BaseManager<Channel> {
  constructor(client: Client) {
    super(client);
  }

  /**
   * Fetches a channel by ID from the API and caches it.
   * @param channelId - The channel ID
   * @param force - If true, bypasses cache
   */
  async fetch(channelId: string, force: boolean = false): Promise<Channel> {
    if (!force) {
      const cached = this.cache.get(channelId);
      if (cached) return cached;
    }

    const data = await this.client.rest.get<APIChannel>(APIRoutes.channel(channelId));
    return this._add(data);
  }

  /**
   * Fetches all channels for a given server.
   * @param serverId - The server ID
   */
  async fetchServerChannels(serverId: string): Promise<Channel[]> {
    const data = await this.client.rest.get<APIChannel[]>(APIRoutes.serverChannels(serverId));
    return data.map((ch) => this._add(ch));
  }

  /**
   * Creates a new channel in a server.
   * @param serverId - The server ID
   * @param options - Channel creation options
   */
  async create(serverId: string, options: {
    name: string;
    type?: string;
    topic?: string;
    parent_id?: string;
    user_limit?: number;
    slow_mode?: number;
  }): Promise<Channel> {
    const data = await this.client.rest.post<APIChannel>(APIRoutes.createChannel(), {
      server_id: serverId,
      ...options,
    });
    return this._add(data);
  }

  /**
   * Updates a channel.
   * @param channelId - The ID of the channel to edit
   * @param serverId - The ID of the server the channel belongs to
   * @param options - The new channel settings
   */
  async edit(channelId: string, serverId: string, options: {
    name?: string;
    topic?: string;
    type?: string;
    parent_id?: string;
    user_limit?: number;
    slow_mode?: number;
  }): Promise<Channel> {
    const data = await this.client.rest.put<APIChannel>(APIRoutes.updateChannel(), {
      id: channelId,
      server_id: serverId,
      ...options,
    });
    return this._add(data);
  }

  /**
   * Deletes a channel.
   * @param channelId - The ID of the channel to delete
   * @param serverId - The ID of the server the channel belongs to
   */
  async delete(channelId: string, serverId: string): Promise<void> {
    await this.client.rest.delete(APIRoutes.deleteChannel(), {
      data: {
        id: channelId,
        server_id: serverId,
      },
    });
    this.cache.delete(channelId);
  }

  /**
   * Constructs a Channel instance from raw API data and adds it to the cache.
   */
  _add(channelOrData: Channel | APIChannel): Channel {
    const channel = channelOrData instanceof Channel
      ? channelOrData
      : new Channel(this.client, channelOrData);
    this.cache.set(channel.id, channel);
    return channel;
  }
}
