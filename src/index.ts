// ─── Client ────────────────────────────────────────────────────
export { Client, type ClientOptions, type ClientApplication } from './client';

// ─── Structures ────────────────────────────────────────────────
export { Base } from './structures/Base';
export { User, type APIUser } from './structures/User';
export { Server, type APIServer } from './structures/Server';
export { Channel, type APIChannel } from './structures/Channel';
export { Message, type APIMessage, type APIMessageAttachment } from './structures/Message';
export { Role, type APIRole } from './structures/Role';
export { Member, type APIMember } from './structures/Member';
export {
  Interaction,
  CommandInteraction,
  type APIInteraction,
  type APIInteractionData,
  type APIInteractionOption,
} from './structures/Interaction';

// ─── Managers ──────────────────────────────────────────────────
export { BaseManager } from './managers/BaseManager';
export { ServerManager } from './managers/ServerManager';
export { ChannelManager } from './managers/ChannelManager';
export { MessageManager, type MessageCreateOptions } from './managers/MessageManager';
export { UserManager } from './managers/UserManager';
export { RoleManager } from './managers/RoleManager';
export { MemberManager } from './managers/MemberManager';
export { ApplicationCommandManager, type APIApplicationCommand } from './managers/ApplicationCommandManager';

// ─── Builders ──────────────────────────────────────────────────
export { SlashCommandBuilder, CommandOptionBuilder, SubCommandBuilder } from './builders/SlashCommandBuilder';
export { EmbedBuilder, type EmbedData } from './builders/EmbedBuilder';

// ─── Gateway ───────────────────────────────────────────────────
export { WebSocketManager } from './gateway/WebSocketManager';

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
} from './util/Constants';

// ─── Errors ────────────────────────────────────────────────────
export { WecordyError, RESTError, WebSocketError, TokenError, ValidationError } from './errors';
