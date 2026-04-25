/**
 * SDK event names mapped from backend SocketTypes.
 * These are the event names emitted by the Client.
 * Each event corresponds to a specific backend socket event type.
 */
export enum Events {
  /** Emitted when the client becomes ready */
  ClientReady = 'ready',

  // ─── Message Events ─────────────────────────────────────────────
  /** Emitted when a message is created (DM or Channel) */
  MessageCreate = 'messageCreate',
  /** Emitted when a message is deleted */
  MessageDelete = 'messageDelete',
  /** Emitted when a message is edited */
  MessageUpdate = 'messageUpdate',
  /** Emitted when a reaction is added to a message */
  MessageReactionAdd = 'messageReactionAdd',
  /** Emitted when a reaction is removed from a message */
  MessageReactionRemove = 'messageReactionRemove',

  // ─── Channel Events ─────────────────────────────────────────────
  /** Emitted when a channel is created */
  ChannelCreate = 'channelCreate',
  /** Emitted when a channel is updated */
  ChannelUpdate = 'channelUpdate',
  /** Emitted when a channel is deleted */
  ChannelDelete = 'channelDelete',
  /** Emitted when channel positions are updated */
  ChannelPositionsUpdate = 'channelPositionsUpdate',
  /** Emitted when a message is pinned */
  MessagePin = 'messagePin',
  /** Emitted when a message is unpinned */
  MessageUnpin = 'messageUnpin',
  /** Emitted when a channel-specific event occurs (e.g., user join/leave message) */
  ChannelEvent = 'channelEvent',

  // ─── Server (Guild) Events ──────────────────────────────────────
  /** Emitted when the bot joins a server */
  ServerCreate = 'serverCreate',
  /** Emitted when a server is updated */
  ServerUpdate = 'serverUpdate',
  /** Emitted when the bot is removed from a server */
  ServerDelete = 'serverDelete',

  // ─── Server Member Events ──────────────────────────────────────
  /** Emitted when a user joins a server */
  ServerMemberAdd = 'serverMemberAdd',
  /** Emitted when a server member is updated */
  ServerMemberUpdate = 'serverMemberUpdate',
  /** Emitted when a user leaves or is removed from a server */
  ServerMemberRemove = 'serverMemberRemove',

  // ─── Role Events ────────────────────────────────────────────────
  /** Emitted when a role is created */
  RoleCreate = 'roleCreate',
  /** Emitted when a role is updated */
  RoleUpdate = 'roleUpdate',
  /** Emitted when a role is deleted */
  RoleDelete = 'roleDelete',
  /** Emitted when a role is assigned to a member */
  RoleAssigned = 'roleAssigned',
  /** Emitted when a role is removed from a member */
  RoleRemoved = 'roleRemoved',

  // ─── User Events ───────────────────────────────────────────────
  /** Emitted when user data is updated */
  UserUpdate = 'userUpdate',

  // ─── Voice Events ──────────────────────────────────────────────
  /** Emitted when a user joins a voice channel */
  VoiceChannelJoin = 'voiceChannelJoin',
  /** Emitted when a user disconnects from a voice channel */
  VoiceChannelDisconnect = 'voiceChannelDisconnect',
  /** Emitted when a user is moved to a different voice channel */
  VoiceChannelMove = 'voiceChannelMove',

  // ─── Interaction Events ────────────────────────────────────────
  /** Emitted when a slash command interaction is received */
  InteractionCreate = 'interactionCreate',

  // ─── Moderation Events ────────────────────────────────────────
  /** Emitted when a user is banned from a server */
  ServerBanAdd = 'serverBanAdd',
  /** Emitted when a user is unbanned from a server */
  ServerBanRemove = 'serverBanRemove',
  /** Emitted when a user is kicked from a server */
  ServerKick = 'serverKick',

  // ─── Forum Events ─────────────────────────────────────────────
  /** Emitted when a forum post is created */
  ForumPostCreate = 'forumPostCreate',
  /** Emitted when a forum post is updated */
  ForumPostUpdate = 'forumPostUpdate',
  /** Emitted when a forum post is deleted */
  ForumPostDelete = 'forumPostDelete',

  // ─── Permission Events ────────────────────────────────────────
  /** Emitted when channel permissions are updated */
  PermissionUpdate = 'permissionUpdate',

  // ─── Friend Events (DM context) ──────────────────────────────
  /** Emitted when a friend request is received */
  FriendRequestReceived = 'friendRequestReceived',
  /** Emitted when a friend request is accepted */
  FriendRequestAccepted = 'friendRequestAccepted',
  /** Emitted when a friend request is rejected */
  FriendRequestRejected = 'friendRequestRejected',
  /** Emitted when a user is blocked */
  UserBlocked = 'userBlocked',
  /** Emitted when a user is unblocked */
  UserUnblocked = 'userUnblocked',
  /** Emitted when a friend is removed */
  FriendRemoved = 'friendRemoved',

  // ─── Typing Events ───────────────────────────────────────────
  /** Emitted when a user starts typing in a channel */
  TypingStart = 'typingStart',
  /** Emitted when a user stops typing in a channel */
  TypingStop = 'typingStop',

  // ─── Internal / Debug Events ──────────────────────────────────
  /** Emitted for debug information */
  Debug = 'debug',
  /** Emitted when a warning occurs */
  Warn = 'warn',
  /** Emitted when an error occurs */
  Error = 'error',
  /** Emitted when the WebSocket connection state changes */
  ShardReady = 'shardReady',
  /** Emitted when the WebSocket is reconnecting */
  ShardReconnecting = 'shardReconnecting',
  /** Emitted when the WebSocket disconnects */
  ShardDisconnect = 'shardDisconnect',
}

export type EventName = Events;
