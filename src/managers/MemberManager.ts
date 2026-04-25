import { BaseManager } from './BaseManager';
import { Member, type APIMember } from '../structures/Member';
import { APIRoutes } from '../rest/APIRoutes';
import type { Client } from '../client/Client';

/**
 * Manages server member entities.
 */
export class MemberManager extends BaseManager<Member> {
  constructor(client: Client) {
    super(client);
  }

  /**
   * Fetches a member by their IDs.
   * @param serverId - The server ID
   * @param userId - The user ID
   */
  async fetch(serverId: string, userId: string): Promise<Member> {
    const data = await this.client.rest.get<APIMember>(
      APIRoutes.serverMember(serverId, userId),
    );
    return this._add(data);
  }

  /**
   * Fetches all members of a server.
   * @param serverId - The server ID
   */
  async fetchServerMembers(serverId: string): Promise<Member[]> {
    const data = await this.client.rest.get<APIMember[]>(
      APIRoutes.serverMembers(serverId),
    );
    return data.map((m) => this._add(m));
  }

  /**
   * Constructs a Member instance from raw API data and adds it to the cache.
   */
  _add(memberOrData: Member | APIMember): Member {
    const member = memberOrData instanceof Member
      ? memberOrData
      : new Member(this.client, memberOrData);
    this.cache.set(member.id, member);
    return member;
  }
}
