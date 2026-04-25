/**
 * Gateway opcodes used in the WebSocket protocol between bot and backend.
 * Mirrors the backend's socket message structure.
 */
export const GatewayOpcodes = {
  /** Server dispatches an event */
  Dispatch: 0,
  /** Client sends a heartbeat */
  Heartbeat: 1,
  /** Client sends identify payload (first msg after connect) */
  Identify: 2,
  /** Client sends a resume payload (after reconnect) */
  Resume: 6,
  /** Server requests client to reconnect */
  Reconnect: 7,
  /** Server acknowledges the heartbeat */
  HeartbeatAck: 11,
  /** Server sends initial hello with heartbeat interval */
  Hello: 10,
} as const;

/**
 * WebSocket connection states.
 */
export const WebSocketStatus = {
  Ready: 0,
  Connecting: 1,
  Reconnecting: 2,
  Idle: 3,
  Disconnected: 4,
} as const;

export type WebSocketStatusType = (typeof WebSocketStatus)[keyof typeof WebSocketStatus];

/**
 * Application command types matching the backend enum.
 */
export const ApplicationCommandType = {
  /** Slash commands — a text-based command that shows up when typing `/` */
  ChatInput: 1,
  /** Context menu command on a user */
  User: 2,
  /** Context menu command on a message */
  Message: 3,
} as const;

export type ApplicationCommandTypeValue = (typeof ApplicationCommandType)[keyof typeof ApplicationCommandType];

/**
 * Application command option types.
 */
export const ApplicationCommandOptionType = {
  SubCommand: 1,
  SubCommandGroup: 2,
  String: 3,
  Integer: 4,
  Boolean: 5,
  User: 6,
  Channel: 7,
  Role: 8,
  Mentionable: 9,
  Number: 10,
  Attachment: 11,
} as const;

export type ApplicationCommandOptionTypeValue =
  (typeof ApplicationCommandOptionType)[keyof typeof ApplicationCommandOptionType];

/**
 * Interaction types.
 */
export const InteractionType = {
  Ping: 1,
  ApplicationCommand: 2,
  MessageComponent: 3,
  ApplicationCommandAutocomplete: 4,
} as const;

export type InteractionTypeValue = (typeof InteractionType)[keyof typeof InteractionType];

/**
 * Interaction callback types — used when responding to an interaction.
 */
export const InteractionResponseType = {
  /** ACK a ping */
  Pong: 1,
  /** Respond with a message, showing the user's input */
  ChannelMessageWithSource: 4,
  /** ACK and edit later — shows a "thinking" state */
  DeferredChannelMessageWithSource: 5,
  /** ACK without sending a message — for components */
  DeferredUpdateMessage: 6,
  /** Edit the message the component was attached to */
  UpdateMessage: 7,
} as const;

export type InteractionResponseTypeValue =
  (typeof InteractionResponseType)[keyof typeof InteractionResponseType];

/**
 * Channel types matching the backend ChannelType enum.
 */
export const ChannelTypes = {
  Text: 'text',
  Voice: 'voice',
  Category: 'category',
  Announcement: 'announcement',
  Stage: 'stage',
  Forum: 'forum',
  News: 'news',
  Rules: 'rules',
} as const;

export type ChannelTypeValue = (typeof ChannelTypes)[keyof typeof ChannelTypes];

/**
 * User status types matching the backend userStatus enum.
 */
export const UserStatusTypes = {
  Available: 'available',
  Busy: 'busy',
  Afk: 'afk',
  Offline: 'offline',
} as const;

export type UserStatusTypeValue = (typeof UserStatusTypes)[keyof typeof UserStatusTypes];

/**
 * Backend socket event types — the raw event names sent over the wire.
 * These are mapped to SDK-friendly event names in the gateway handlers.
 */
export const GatewayEvents = {
  ME: 'ME',
  NEW_MESSAGE: 'NEW_MESSAGE',
  NEW_CHANNEL_MESSAGE: 'NEW_CHANNEL_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',
  DELETE_CHANNEL_MESSAGE: 'DELETE_CHANNEL_MESSAGE',
  EDIT_MESSAGE: 'EDIT_MESSAGE',
  MESSAGE_REACTION_ADD: 'MESSAGE_REACTION_ADD',
  MESSAGE_REACTION_REMOVE: 'MESSAGE_REACTION_REMOVE',
  CHANNEL_MESSAGE_REACTION_ADD: 'CHANNEL_MESSAGE_REACTION_ADD',
  CHANNEL_MESSAGE_REACTION_REMOVE: 'CHANNEL_MESSAGE_REACTION_REMOVE',
  NEW_CHANNEL: 'NEW_CHANNEL',
  UPDATE_CHANNEL: 'UPDATE_CHANNEL',
  UPDATE_CHANNEL_POSITIONS: 'UPDATE_CHANNEL_POSITIONS',
  DELETE_CHANNEL: 'DELETE_CHANNEL',
  NEW_CHANNEL_EVENT: 'NEW_CHANNEL_EVENT',
  NEW_USER: 'NEW_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  NEW_SERVER_USER: 'NEW_SERVER_USER',
  UPDATE_SERVER_USER: 'UPDATE_SERVER_USER',
  DELETE_SERVER_USER: 'DELETE_SERVER_USER',
  NEW_SERVER: 'NEW_SERVER',
  UPDATE_SERVER: 'UPDATE_SERVER',
  DELETE_SERVER: 'DELETE_SERVER',
  USER_JOIN_CHANNEL: 'USER_JOIN_CHANNEL',
  USER_DISCONNECT_CHANNEL: 'USER_DISCONNECT_CHANNEL',
  NEW_USER_INVITE: 'NEW_USER_INVITE',
  USER_INVITE_ACCEPTED: 'USER_INVITE_ACCEPTED',
  USER_BLOCKED: 'USER_BLOCKED',
  USER_INVITE_REJECTED: 'USER_INVITE_REJECTED',
  USER_UNBLOCKED: 'USER_UNBLOCKED',
  USER_REMOVE_FRIEND: 'USER_REMOVE_FRIEND',
  WRITING_MESSAGE_USER: 'WRITING_MESSAGE_USER',
  WRITING_MESSAGE_CHANNEL: 'WRITING_MESSAGE_CHANNEL',
  STOP_WRITING_MESSAGE_USER: 'STOP_WRITING_MESSAGE_USER',
  STOP_WRITING_MESSAGE_CHANNEL: 'STOP_WRITING_MESSAGE_CHANNEL',
  MARK_MESSAGES_AS_READ: 'MARK_MESSAGES_AS_READ',
  UNREAD_MESSAGE: 'UNREAD_MESSAGE',
  NEW_ROLE: 'NEW_ROLE',
  UPDATE_ROLE: 'UPDATE_ROLE',
  DELETE_ROLE: 'DELETE_ROLE',
  ROLE_ASSIGNED: 'ROLE_ASSIGNED',
  ROLE_REMOVED: 'ROLE_REMOVED',
  PIN_MESSAGE: 'PIN_MESSAGE',
  UNPIN_MESSAGE: 'UNPIN_MESSAGE',
  PERMISSION_UPDATE: 'PERMISSION_UPDATE',
  USER_BANNED: 'USER_BANNED',
  USER_UNBANNED: 'USER_UNBANNED',
  ME_BANNED_FROM_SERVER: 'ME_BANNED_FROM_SERVER',
  USER_KICKED: 'USER_KICKED',
  ME_KICKED_FROM_SERVER: 'ME_KICKED_FROM_SERVER',
  USER_MOVED_CHANNEL: 'USER_MOVED_CHANNEL',
  NEW_FORUM_POST: 'NEW_FORUM_POST',
  UPDATE_FORUM_POST: 'UPDATE_FORUM_POST',
  DELETE_FORUM_POST: 'DELETE_FORUM_POST',
  FORUM_POST_REACTION_ADD: 'FORUM_POST_REACTION_ADD',
  FORUM_POST_REACTION_REMOVE: 'FORUM_POST_REACTION_REMOVE',
  INTERACTION_CREATE: 'INTERACTION_CREATE',
  APPLICATION_COMMAND_CREATE: 'APPLICATION_COMMAND_CREATE',
  APPLICATION_COMMAND_UPDATE: 'APPLICATION_COMMAND_UPDATE',
  APPLICATION_COMMAND_DELETE: 'APPLICATION_COMMAND_DELETE',
} as const;

export type GatewayEventName = (typeof GatewayEvents)[keyof typeof GatewayEvents];

/**
 * Bitwise or string-based gateway intents.
 * Standardized constants to avoid magic strings in client initialization.
 */
export const GatewayIntentBits = {
  Servers: 'Servers',
  ServerMembers: 'ServerMembers',
  ServerBans: 'ServerBans',
  ServerEmojisAndStickers: 'ServerEmojisAndStickers',
  ServerIntegrations: 'ServerIntegrations',
  ServerWebhooks: 'ServerWebhooks',
  ServerInvites: 'ServerInvites',
  ServerVoiceStates: 'ServerVoiceStates',
  ServerPresences: 'ServerPresences',
  ServerMessages: 'ServerMessages',
  ServerMessageReactions: 'ServerMessageReactions',
  ServerMessageTyping: 'ServerMessageTyping',
  DirectMessages: 'DirectMessages',
  DirectMessageReactions: 'DirectMessageReactions',
  DirectMessageTyping: 'DirectMessageTyping',
  MessageContent: 'MessageContent',
} as const;

/**
 * Default API version and base configuration.
 */
export const APIConstants = {
  API_VERSION: 'v1',
  DEFAULT_API_BASE: 'https://gateway.wecordy.com/api',
  DEFAULT_WS_BASE: 'wss://gateway.wecordy.com',
  DEFAULT_HEARTBEAT_INTERVAL: 30000,
  MAX_RECONNECT_ATTEMPTS: 5,
  INITIAL_RECONNECT_DELAY: 1000,
  MAX_RECONNECT_DELAY: 30000,
} as const;
