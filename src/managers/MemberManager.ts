import { BaseManager } from './BaseManager';
import { Member, type APIMember } from '../structures/Member';
import { APIRoutes } from '../rest/APIRoutes';
import type { Client } from '../client/Client';

/**
 * Manages server member entities.
 * Members are cached by their membership ID, not by user ID.
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
    return (data ?? []).map((m) => this._add(m));
  }

  /**
   * Finds a cached member by server and user ID.
   * @param serverId - The server ID
   * @param userId - The user ID
   */
  resolveByUser(serverId: string, userId: string): Member | undefined {
    return this.cache.find((m) => m.serverId === serverId && m.userId === userId);
  }

  /**
   * Kicks a member from a server for the given duration.
   * @param serverId - The server ID
   * @param userId - The user ID to kick
   * @param durationMinutes - How long the user can't rejoin, in minutes (minimum 1)
   */
  async kick(serverId: string, userId: string, durationMinutes: number): Promise<void> {
    await this.client.rest.post(APIRoutes.serverKick(serverId), {
      user_id: userId,
      duration: durationMinutes,
    });
    this.removeCached(serverId, userId);
  }

  /**
   * Bans a user from a server.
   * @param serverId - The server ID
   * @param userId - The user ID to ban
   */
  async ban(serverId: string, userId: string): Promise<void> {
    await this.client.rest.post(APIRoutes.serverBan(serverId), { user_id: userId });
    this.removeCached(serverId, userId);
  }

  /**
   * Removes the ban of a user.
   * @param serverId - The server ID
   * @param userId - The user ID to unban
   */
  async unban(serverId: string, userId: string): Promise<void> {
    await this.client.rest.delete(APIRoutes.serverUnban(serverId, userId));
  }

  /**
   * Fetches the banned memberships of a server (not cached).
   * @param serverId - The server ID
   */
  async fetchBans(serverId: string): Promise<Member[]> {
    const data = await this.client.rest.get<APIMember[]>(APIRoutes.serverBannedUsers(serverId));
    return (data ?? []).map((m) => new Member(this.client, m));
  }

  /**
   * Adds a Member instance to the cache, or constructs one from raw API data.
   * Raw data for an already cached member updates the cached instance instead of replacing it.
   */
  _add(memberOrData: Member | APIMember): Member {
    if (memberOrData instanceof Member) {
      this.cache.set(memberOrData.id, memberOrData);
      return memberOrData;
    }

    const existing = this.cache.get(memberOrData.id);
    if (existing) return existing._patch(memberOrData);

    const member = new Member(this.client, memberOrData);
    this.cache.set(member.id, member);
    return member;
  }

  /**
   * Removes a cached member by server and user ID.
   */
  private removeCached(serverId: string, userId: string): void {
    const member = this.resolveByUser(serverId, userId);
    if (member) this._remove(member.id);
  }
}
