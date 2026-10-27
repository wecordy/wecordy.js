// ─── Client ────────────────────────────────────────────────────
export { Client, type ClientOptions, type ClientApplication, type ClientEvents } from './client/Client';

// ─── Structures ────────────────────────────────────────────────
export { Base } from './structures/Base';
export { User, type APIUser } from './structures/User';
export { Server, type APIServer } from './structures/Server';
export { Channel, type APIChannel } from './structures/Channel';
export { Message, type APIMessage, type APIMessageAttachment } from './structures/Message';
export { Role, type APIRole } from './structures/Role';
export { Member, type APIMember, type APIMemberProfile } from './structures/Member';
export {
  Interaction,
  CommandInteraction,
  type APIInteraction,
  type APIInteractionData,
  type APIInteractionOption,
  type InteractionReplyOptions,
} from './structures/Interaction';
export { ApplicationCommand, type APICommandOption } from './structures/ApplicationCommand';
export { Application, type APIApplication } from './structures/Application';
export { MessageReaction, type APIMessageReaction } from './structures/MessageReaction';
export { ServerInvite, type APIServerInvite } from './structures/ServerInvite';
export { ChannelPermissionOverride, type APIChannelPermissionOverride } from './structures/ChannelPermissionOverride';
export { AuditLog, type APIAuditLog, type APIAuditLogChange } from './structures/AuditLog';
export { ServerApplication, type APIServerBot } from './structures/ServerApplication';
export { VoiceConnection, type VoiceConnectionOptions } from './voice/VoiceConnection';
export { AudioPlayer, type AudioPlayerEvents } from './voice/AudioPlayer';

// ─── Managers ──────────────────────────────────────────────────
export { BaseManager } from './managers/BaseManager';
export { ServerManager, type AuditLogFetchOptions } from './managers/ServerManager';
export { ChannelManager, type ChannelCreateOptions, type ChannelEditOptions } from './managers/ChannelManager';
export { MessageManager, type MessageCreateOptions } from './managers/MessageManager';
export { UserManager } from './managers/UserManager';
export { RoleManager, type RoleData, type RolePermissionsResolvable } from './managers/RoleManager';
export { MemberManager } from './managers/MemberManager';
export { ApplicationCommandManager, type APIApplicationCommand } from './managers/ApplicationCommandManager';

// ─── Builders ──────────────────────────────────────────────────
export {
  SlashCommandBuilder,
  CommandOptionBuilder,
  SubCommandBuilder,
  SubCommandGroupBuilder,
} from './builders/SlashCommandBuilder';
export { EmbedBuilder, type EmbedData } from './builders/EmbedBuilder';

// ─── Gateway ───────────────────────────────────────────────────
export { WebSocketManager } from './gateway/WebSocketManager';
export type {
  MessageReactionPayload,
  VoiceStatePayload,
  TypingPayload,
  BanPayload,
  KickPayload,
  FriendshipPayload,
  CallPayload,
  CallAnswerPayload,
  StreamTrackPayload,
  ChannelPositionPayload,
  PermissionUpdatePayload,
  MessageUnpinPayload,
  MemberRemovePayload,
  ServerRemovePayload,
  RoleAssignedPayload,
  RoleRemovedPayload,
} from './types/GatewayPayloads';

// ─── REST ──────────────────────────────────────────────────────
export { RESTClient, type RESTOptions } from './rest/RESTClient';
export { APIRoutes } from './rest/APIRoutes';

// ─── Utils ─────────────────────────────────────────────────────
export { Collection } from './util/Collection';
export { BitField, type BitFieldResolvable } from './util/BitField';
export { Events, type EventName } from './util/Events';
export { Formatters } from './util/Formatters';
export { Permissions, PermissionFlagsBits, PermissionStringToBit } from './util/Permissions';
export {
  GatewayOpcodes,
  WebSocketStatus,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  InteractionType,
  InteractionResponseType,
  ChannelTypes,
  UserStatusTypes,
  GatewayEvents,
  GatewayIntentBits,
  APIConstants,
  type WebSocketStatusType,
  type ApplicationCommandTypeValue,
  type ApplicationCommandOptionTypeValue,
  type InteractionTypeValue,
  type InteractionResponseTypeValue,
  type ChannelTypeValue,
  type UserStatusTypeValue,
  type GatewayEventName,
  type GatewayIntentName,
} from './util/Constants';

// ─── Errors ────────────────────────────────────────────────────
export { WecordyError, RESTError, WebSocketError, TokenError, ValidationError } from './errors';
