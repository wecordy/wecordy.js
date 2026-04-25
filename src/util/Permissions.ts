import { BitField, BitFieldResolvable } from './BitField';

export const PermissionFlagsBits = {
  // Server Permissions
  Administrator: 1n << 0n,
  ManageServer: 1n << 1n,
  ManageRoles: 1n << 2n,
  ManageChannels: 1n << 3n,
  ManageWebhooks: 1n << 4n,
  KickMembers: 1n << 5n,
  BanMembers: 1n << 6n,
  CreateInvite: 1n << 7n,
  DeleteInvite: 1n << 8n,
  ListInvite: 1n << 9n,

  // Channel Permissions
  ViewChannel: 1n << 10n,
  SendMessages: 1n << 11n,
  ManageMessages: 1n << 12n,
  PinMessages: 1n << 13n,
  AddReactions: 1n << 14n,
  EmbedLinks: 1n << 15n,
  AttachFiles: 1n << 16n,
  OpenForumPosts: 1n << 17n,
  ManageForumPosts: 1n << 18n,
  PinForumPosts: 1n << 19n,

  // Voice Permissions
  Connect: 1n << 20n,
  Speak: 1n << 21n,
  MuteMembers: 1n << 22n,
  DeafenMembers: 1n << 23n,
  MoveMembers: 1n << 24n,
  KickFromVoice: 1n << 25n,

  // Admin Permissions
  ViewAuditLog: 1n << 26n,
} as const;

/**
 * Mapping from backend string-based permission names to their bit values.
 * Used internally to convert between backend format and SDK bitfield format.
 */
export const PermissionStringToBit: Record<string, bigint> = {
  ADMINISTRATOR: PermissionFlagsBits.Administrator,
  MANAGE_SERVER: PermissionFlagsBits.ManageServer,
  MANAGE_ROLES: PermissionFlagsBits.ManageRoles,
  MANAGE_CHANNELS: PermissionFlagsBits.ManageChannels,
  MANAGE_WEBHOOKS: PermissionFlagsBits.ManageWebhooks,
  KICK_MEMBERS: PermissionFlagsBits.KickMembers,
  BAN_MEMBERS: PermissionFlagsBits.BanMembers,
  CREATE_INVITE: PermissionFlagsBits.CreateInvite,
  DELETE_INVITE: PermissionFlagsBits.DeleteInvite,
  LIST_INVITE: PermissionFlagsBits.ListInvite,
  VIEW_CHANNEL: PermissionFlagsBits.ViewChannel,
  SEND_MESSAGES: PermissionFlagsBits.SendMessages,
  MANAGE_MESSAGES: PermissionFlagsBits.ManageMessages,
  PIN_MESSAGES: PermissionFlagsBits.PinMessages,
  ADD_REACTIONS: PermissionFlagsBits.AddReactions,
  EMBED_LINKS: PermissionFlagsBits.EmbedLinks,
  ATTACH_FILES: PermissionFlagsBits.AttachFiles,
  OPEN_FORUM_POSTS: PermissionFlagsBits.OpenForumPosts,
  MANAGE_FORUM_POSTS: PermissionFlagsBits.ManageForumPosts,
  PIN_FORUM_POSTS: PermissionFlagsBits.PinForumPosts,
  CONNECT: PermissionFlagsBits.Connect,
  SPEAK: PermissionFlagsBits.Speak,
  MUTE_MEMBERS: PermissionFlagsBits.MuteMembers,
  DEAFEN_MEMBERS: PermissionFlagsBits.DeafenMembers,
  MOVE_MEMBERS: PermissionFlagsBits.MoveMembers,
  KICK_FROM_VOICE: PermissionFlagsBits.KickFromVoice,
  VIEW_AUDIT_LOG: PermissionFlagsBits.ViewAuditLog,
};

export class Permissions extends BitField {
  static override Flags = PermissionFlagsBits as unknown as Record<string, bigint>;

  /** All permissions combined */
  static All = Object.values(PermissionFlagsBits).reduce((acc, val) => acc | val, 0n);

  /** Default permissions for @everyone role */
  static Default =
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.AddReactions |
    PermissionFlagsBits.Connect |
    PermissionFlagsBits.Speak |
    PermissionFlagsBits.CreateInvite |
    PermissionFlagsBits.ListInvite;

  constructor(bits?: BitFieldResolvable) {
    super(bits);
  }

  /**
   * Checks if this permission set includes Administrator.
   * Administrator implicitly grants all permissions.
   */
  isAdministrator(): boolean {
    return this.has(PermissionFlagsBits.Administrator);
  }

  static fromBackendFormat(backendPermissions: Record<string, number>): Permissions {
    let bits = 0n;
    for (const [key, state] of Object.entries(backendPermissions)) {
      if (state === 1 && PermissionStringToBit[key] !== undefined) {
        bits |= PermissionStringToBit[key];
      }
    }
    return new Permissions(bits);
  }
}
