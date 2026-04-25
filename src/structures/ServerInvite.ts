import { Base } from './Base';
import type { Client } from '../client/Client';
import type { Server, APIServer } from './Server';

export interface APIServerInvite {
  id: string;
  server_id: string | APIServer;
  url: string;
  expire?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Represents an invite to a server.
 */
export class ServerInvite extends Base {
  /** The ID of the server this invite is for */
  public serverId: string;

  /** The populated Server model, if available */
  public server: Server | null = null;

  /** The unique code/URL of the invite */
  public code: string;

  /** When this invite expires, if ever */
  public expiresAt: Date | null;

  /** When this invite was created */
  public createdAt: Date;

  constructor(client: Client, data: APIServerInvite) {
    super(client, data.id);
    
    // server_id -> serverId & server
    if (typeof data.server_id === 'string' || !data.server_id) {
      this.serverId = data.server_id as string;
      this.server = null;
    } else {
      this.server = this.client.servers._add(data.server_id);
      this.serverId = this.server.id;
    }

    this.code = data.url; // Backend stores the full URL or just the code? Model says 'url'
    this.expiresAt = data.expire ? new Date(data.expire) : null;
    this.createdAt = new Date(data.created_at);
  }

  /**
   * The full invite URL.
   */
  url(): string {
    // Assuming the backend 'url' field is just the code, but let's be safe.
    // If it's already a URL, return it. If not, construct it.
    if (this.code.startsWith('http')) return this.code;
    return `https://wecordy.com/invite/${this.code}`;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      serverId: this.serverId,
      code: this.code,
      url: this.url,
      expiresAt: this.expiresAt?.toISOString() ?? null,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
