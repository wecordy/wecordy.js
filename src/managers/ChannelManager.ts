import { BaseManager } from './BaseManager';
import { Channel, type APIChannel } from '../structures/Channel';
import { APIRoutes } from '../rest/APIRoutes';
import type { Client } from '../client/Client';
import type { ChannelTypeValue } from '../util/Constants';

/**
 * Options for creating a channel.
 */
export interface ChannelCreateOptions {
  name: string;
  type: ChannelTypeValue;
  parent_id?: string | null;
  user_limit?: number;
  slow_mode?: number;
}

/**
 * Options for editing a channel. The channel type can't be changed.
 */
export interface ChannelEditOptions {
  name?: string;
  topic?: string;
  parent_id?: string | null;
  user_limit?: number;
  slow_mode?: number;
}

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
    return (data ?? []).map((ch) => this._add(ch));
  }

  /**
   * Creates a new channel in a server.
   * @param serverId - The server ID
   * @param options - Channel creation options
   */
  async create(serverId: string, options: ChannelCreateOptions): Promise<Channel> {
    const data = await this.client.rest.post<APIChannel>(APIRoutes.createChannel(), {
      server_id: serverId,
      ...options,
    });
    return this._add(data);
  }

  /**
   * Updates a channel and returns the refreshed channel.
   * @param channelId - The ID of the channel to edit
   * @param serverId - The ID of the server the channel belongs to
   * @param options - The new channel settings
   */
  async edit(channelId: string, serverId: string, options: ChannelEditOptions): Promise<Channel> {
    // The backend requires the name on every update
    const name = options.name ?? (await this.fetch(channelId)).name;

    await this.client.rest.put(APIRoutes.updateChannel(), {
      ...options,
      id: channelId,
      server_id: serverId,
      name,
    });

    // The update endpoint doesn't return the channel
    return this.fetch(channelId, true);
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
    this._remove(channelId);
  }

  /**
   * Adds a Channel instance to the cache, or constructs one from raw API data.
   * Raw data for an already cached channel updates the cached instance instead of replacing it.
   */
  _add(channelOrData: Channel | APIChannel): Channel {
    if (channelOrData instanceof Channel) {
      this.cache.set(channelOrData.id, channelOrData);
      return channelOrData;
    }

    const existing = this.cache.get(channelOrData.id);
    if (existing) return existing._patch(channelOrData);

    const channel = new Channel(this.client, channelOrData);
    this.cache.set(channel.id, channel);
    return channel;
  }
}
