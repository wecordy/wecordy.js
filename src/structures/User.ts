import { Base } from './Base';
import type { Client } from '../client/Client';
import type { UserStatusTypeValue } from '../util/Constants';

export interface APIUser {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  username: string;
  email?: string;
  status?: UserStatusTypeValue;
  is_active?: boolean;
  is_bot?: boolean;
  is_nitro?: boolean;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export class User extends Base {
  /** The user's first name */
  public firstName: string;

  /** The user's last name */
  public lastName: string;

  /** The user's full display name */
  public fullName: string;

  /** The user's unique username */
  public username: string;

  /** The user's current status */
  public status: UserStatusTypeValue;

  /** Whether this user is a bot */
  public bot: boolean;

  /** Whether this user has Nitro */
  public nitro: boolean;

  /** The user's avatar URL, if set */
  public avatarURL: string | null;

  /** The user's banner URL, if set */
  public bannerURL: string | null;

  /** The user's bio/about me text */
  public bio: string | null;

  /** When this user account was created */
  public createdAt: Date | null;

  constructor(client: Client, data: APIUser) {
    super(client, data.id);
    this.firstName = data.first_name ?? '';
    this.lastName = data.last_name ?? '';
    this.fullName = data.full_name ?? '';
    this.username = data.username;
    this.status = data.status ?? 'offline';
    this.bot = data.is_bot ?? false;
    this.nitro = data.is_nitro ?? false;
    this.avatarURL = data.avatar_url ?? null;
    this.bannerURL = data.banner_url ?? null;
    this.bio = data.bio ?? null;
    this.createdAt = data.created_at ? new Date(data.created_at) : null;
  }

  /**
   * Updates this user with new data (used internally by cache updates).
   * Returns the old user clone for comparison.
   */
  _patch(data: Partial<APIUser>): User {
    if (data.first_name !== undefined) this.firstName = data.first_name;
    if (data.last_name !== undefined) this.lastName = data.last_name;
    if (data.full_name !== undefined) this.fullName = data.full_name;
    if (data.username !== undefined) this.username = data.username;
    if (data.status !== undefined) this.status = data.status;
    if (data.avatar_url !== undefined) this.avatarURL = data.avatar_url ?? null;
    if (data.banner_url !== undefined) this.bannerURL = data.banner_url ?? null;
    if (data.bio !== undefined) this.bio = data.bio ?? null;
    return this;
  }


  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      username: this.username,
      status: this.status,
      bot: this.bot,
      avatarURL: this.avatarURL,
      bannerURL: this.bannerURL,
      bio: this.bio,
      createdAt: this.createdAt?.toISOString() ?? null,
    };
  }
}
