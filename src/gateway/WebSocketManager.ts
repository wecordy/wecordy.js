import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'eventemitter3';
import type { Client } from '../client/Client';
import { APIConstants, WebSocketStatus, GatewayEvents } from '../util/Constants';
import { Events } from '../util/Events';
import { WebSocketError } from '../errors';
import { Message, type APIMessage } from '../structures/Message';
import { Server, type APIServer } from '../structures/Server';
import { Channel, type APIChannel } from '../structures/Channel';
import { Role, type APIRole } from '../structures/Role';
import { Member, type APIMember } from '../structures/Member';
import { User, type APIUser } from '../structures/User';
import { CommandInteraction, Interaction, type APIInteraction } from '../structures/Interaction';
import { InteractionType } from '../util/Constants';
import type {
  MessageReactionPayload,
  VoiceStatePayload,
  TypingPayload,
  BanPayload,
  KickPayload,
  FriendshipPayload,
  ChannelPositionPayload,
  PermissionUpdatePayload,
} from '../types/GatewayPayloads';

/**
 * Manages the Socket.IO connection to the Wecordy Gateway.
 *
 * Handles:
 * - Connection lifecycle (connect, reconnect, disconnect) via Socket.IO
 * - Custom Authentication handshake
 * - Event dispatching to the Client
 */
export class WebSocketManager extends EventEmitter {
  /** Reference to the Client */
  public readonly client: Client;

  /** The underlying Socket.IO connection */
  private socket: Socket | null = null;

  /** Current connection status */
  public status: number = WebSocketStatus.Disconnected;

  /** The bot token */
  private token: string | null = null;

  /** The gateway URL to connect to */
  private gatewayURL: string;

  constructor(client: Client) {
    super();
    this.client = client;
    this.gatewayURL = client.options.wsURL ?? APIConstants.DEFAULT_WS_BASE;
  }

  /**
   * Connects to the Socket.IO gateway and performs manual authentication.
   * @param token - The bot token for authentication
   */
  async connect(token: string): Promise<void> {
    this.token = token;
    this.status = WebSocketStatus.Connecting;

    return new Promise<void>((resolve, reject) => {
      try {
        this.socket = io(this.gatewayURL, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: APIConstants.MAX_RECONNECT_ATTEMPTS,
        });

        this.socket.on('connect', () => {
          this.client.emit(Events.Debug, `[WS] Connected to ${this.gatewayURL}, sending manual authentication...`);
          // Wecordy socket-app requires manual authentication emit after connection
          this.socket?.emit('authentication', {
            token: `Bot ${token}`,
            intents: this.client.options.intents || [],
          });
        });

        this.socket.on('authentication', (data: unknown) => {
          // Socket Server responds with "message Taked" upon successful auth
          this.client.emit(Events.Debug, `[WS] Authenticated successfully: ${JSON.stringify(data)}`);
          this.status = WebSocketStatus.Ready;
          resolve();

          this.client.emit(Events.ClientReady, this.client);
        });

        this.socket.on('message', (payload: GatewayPayload) => {
          this.handleMessage(payload);
        });

        this.socket.on('disconnect', (reason: string) => {
          this.handleClose(1000, reason);
        });

        this.socket.on('connect_error', (error: Error) => {
          this.client.emit(Events.Error, new WebSocketError(error.message));
          if (this.status === WebSocketStatus.Connecting) {
            reject(new WebSocketError(`Failed to connect: ${error.message}`));
          }
        });
      } catch (error) {
        reject(
          error instanceof Error
            ? new WebSocketError(error.message)
            : new WebSocketError('Unknown Socket.IO connection error'),
        );
      }
    });
  }

  /**
   * Disconnects from the gateway gracefully.
   */
  disconnect(): void {
    this.status = WebSocketStatus.Disconnected;

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.client.emit(Events.ShardDisconnect, { code: 1000, reason: 'Client disconnect' });
  }

  /**
   * Emits a raw event over the Socket.IO connection.
   * @param event - Event name
   * @param data - Payload data
   */
  send(event: string, data: unknown): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Parses the Wecordy "message" event envelope.
   */
  private handleMessage(payload: GatewayPayload): void {
    const eventType = payload.type ?? payload.data?.type;
    const eventData = payload.type ? payload.data : (payload.data?.data ?? payload.data ?? payload);

    if (!eventType) {
      this.client.emit(Events.Debug, `[WS] Received message without event type`);
      return;
    }

    this.dispatchEvent(eventType as string, eventData);
  }

  /**
   * Dispatches a gateway event to the appropriate cache and client handler.
   */
  private dispatchEvent(type: string, data: unknown): void {
    // Gateway data comes as untyped JSON — we use `unknown` intermediate casts.
    const rawData = data as Record<string, unknown>;
    const asType = <T>(): T => data as T;

    switch (type) {
      // ─── Ready / Identity ─────────────────────────────────────
      case GatewayEvents.ME: {
        // Fallback or explicit trigger depending on backend behavior
        break;
      }

      // ─── Message Events ───────────────────────────────────────
      case GatewayEvents.NEW_MESSAGE:
      case GatewayEvents.NEW_CHANNEL_MESSAGE: {
        const message = new Message(this.client, asType<APIMessage>());
        this.client.messages._add(message);
        this.client.emit(Events.MessageCreate, message);
        break;
      }

      case GatewayEvents.DELETE_MESSAGE:
      case GatewayEvents.DELETE_CHANNEL_MESSAGE: {
        const messageId = rawData.id as string;
        const cached = this.client.messages.cache.get(messageId);
        const message = cached ?? new Message(this.client, asType<APIMessage>());
        this.client.messages._remove(messageId);
        this.client.emit(Events.MessageDelete, message);
        break;
      }

      case GatewayEvents.EDIT_MESSAGE: {
        const messageId = rawData.id as string;
        const oldMessage = this.client.messages.cache.get(messageId);
        const newMessage = new Message(this.client, asType<APIMessage>());
        this.client.messages._add(newMessage);
        this.client.emit(Events.MessageUpdate, oldMessage ?? null, newMessage);
        break;
      }

      // ─── Channel Events ───────────────────────────────────────
      case GatewayEvents.NEW_CHANNEL: {
        const channel = new Channel(this.client, asType<APIChannel>());
        this.client.channels._add(channel);
        this.client.emit(Events.ChannelCreate, channel);
        break;
      }

      case GatewayEvents.UPDATE_CHANNEL: {
        const channelId = rawData.id as string;
        const oldChannel = this.client.channels.cache.get(channelId);
        const newChannel = new Channel(this.client, asType<APIChannel>());
        this.client.channels._add(newChannel);
        this.client.emit(Events.ChannelUpdate, oldChannel ?? null, newChannel);
        break;
      }

      case GatewayEvents.DELETE_CHANNEL: {
        const channelId = rawData.id as string;
        const cached = this.client.channels.cache.get(channelId);
        this.client.channels._remove(channelId);
        this.client.emit(Events.ChannelDelete, cached ?? rawData);
        break;
      }

      case GatewayEvents.UPDATE_CHANNEL_POSITIONS: {
        this.client.emit(Events.ChannelPositionsUpdate, asType<ChannelPositionPayload[]>());
        break;
      }

      case GatewayEvents.NEW_CHANNEL_EVENT: {
        this.client.emit(Events.ChannelEvent, asType<any>());
        break;
      }

      case GatewayEvents.PIN_MESSAGE: {
        const message = new Message(this.client, asType<APIMessage>());
        this.client.emit(Events.MessagePin, message);
        break;
      }

      case GatewayEvents.UNPIN_MESSAGE: {
        const message = new Message(this.client, asType<APIMessage>());
        this.client.emit(Events.MessageUnpin, message);
        break;
      }

      // ─── Server Events ────────────────────────────────────────
      case GatewayEvents.NEW_SERVER: {
        const server = new Server(this.client, asType<APIServer>());
        this.client.servers._add(server);
        this.client.emit(Events.ServerCreate, server);
        break;
      }

      case GatewayEvents.UPDATE_SERVER: {
        const serverId = rawData.id as string;
        const oldServer = this.client.servers.cache.get(serverId);
        const newServer = new Server(this.client, asType<APIServer>());
        this.client.servers._add(newServer);
        this.client.emit(Events.ServerUpdate, oldServer ?? null, newServer);
        break;
      }

      case GatewayEvents.DELETE_SERVER: {
        const serverId = rawData.id as string;
        const cached = this.client.servers.cache.get(serverId);
        this.client.servers._remove(serverId);
        this.client.emit(Events.ServerDelete, cached ?? rawData);
        break;
      }

      // ─── Member Events ────────────────────────────────────────
      case GatewayEvents.NEW_SERVER_USER: {
        const member = new Member(this.client, asType<APIMember>());
        this.client.members._add(member);
        this.client.emit(Events.ServerMemberAdd, member);
        break;
      }

      case GatewayEvents.DELETE_SERVER_USER: {
        const memberId = rawData.id as string;
        const cached = this.client.members.cache.get(memberId);
        this.client.members._remove(memberId);
        this.client.emit(Events.ServerMemberRemove, cached ?? rawData);
        break;
      }

      case GatewayEvents.UPDATE_SERVER_USER: {
        const memberId = rawData.id as string;
        const oldMember = this.client.members.cache.get(memberId);
        const newMember = new Member(this.client, asType<APIMember>());
        this.client.members._add(newMember);
        this.client.emit(Events.ServerMemberUpdate, oldMember ?? null, newMember);
        break;
      }

      // ─── Role Events ──────────────────────────────────────────
      case GatewayEvents.NEW_ROLE: {
        const role = new Role(this.client, asType<APIRole>());
        this.client.roles._add(role);
        this.client.emit(Events.RoleCreate, role);
        break;
      }

      case GatewayEvents.UPDATE_ROLE: {
        const roleId = rawData.id as string;
        const oldRole = this.client.roles.cache.get(roleId);
        const newRole = new Role(this.client, asType<APIRole>());
        this.client.roles._add(newRole);
        this.client.emit(Events.RoleUpdate, oldRole ?? null, newRole);
        break;
      }

      case GatewayEvents.DELETE_ROLE: {
        const roleId = rawData.id as string;
        const cached = this.client.roles.cache.get(roleId);
        this.client.roles._remove(roleId);
        this.client.emit(Events.RoleDelete, cached ?? rawData);
        break;
      }

      case GatewayEvents.ROLE_ASSIGNED: {
        this.client.emit(Events.RoleAssigned, rawData);
        break;
      }

      case GatewayEvents.ROLE_REMOVED: {
        this.client.emit(Events.RoleRemoved, asType<{ server_id: string; user_id: string; role_id: string }>());
        break;
      }

      // ─── Interaction Events ───────────────────────────────────
      case GatewayEvents.INTERACTION_CREATE: {
        const interactionData = asType<APIInteraction>();
        let interaction: Interaction;

        if (interactionData.type === InteractionType.ApplicationCommand) {
          interaction = new CommandInteraction(this.client, interactionData);
        } else {
          interaction = new Interaction(this.client, interactionData);
        }

        this.client.emit(Events.InteractionCreate, interaction);
        break;
      }

      // ─── User Events ──────────────────────────────────────────
      case GatewayEvents.UPDATE_USER: {
        const userId = rawData.id as string;
        const oldUser = this.client.users.cache.get(userId);
        const newUser = new User(this.client, asType<APIUser>());
        this.client.users._add(newUser);
        this.client.emit(Events.UserUpdate, oldUser ?? null, newUser);
        break;
      }

      // ─── Voice Events ─────────────────────────────────────────
      case GatewayEvents.USER_JOIN_CHANNEL: {
        this.client.emit(Events.VoiceChannelJoin, asType<VoiceStatePayload>());
        break;
      }

      case GatewayEvents.USER_DISCONNECT_CHANNEL: {
        this.client.emit(Events.VoiceChannelDisconnect, asType<VoiceStatePayload>());
        break;
      }

      case GatewayEvents.USER_MOVED_CHANNEL: {
        this.client.emit(Events.VoiceChannelMove, asType<VoiceStatePayload>());
        break;
      }

      // ─── Moderation Events ────────────────────────────────────
      case GatewayEvents.USER_BANNED: {
        this.client.emit(Events.ServerBanAdd, asType<BanPayload>());
        break;
      }

      case GatewayEvents.USER_UNBANNED: {
        this.client.emit(Events.ServerBanRemove, asType<BanPayload>());
        break;
      }

      case GatewayEvents.USER_KICKED: {
        this.client.emit(Events.ServerKick, asType<KickPayload>());
        break;
      }

      case GatewayEvents.PERMISSION_UPDATE: {
        this.client.emit(Events.PermissionUpdate, asType<PermissionUpdatePayload>());
        break;
      }

      // ─── Typing Events ────────────────────────────────────────
      case GatewayEvents.WRITING_MESSAGE_CHANNEL:
      case GatewayEvents.WRITING_MESSAGE_USER: {
        this.client.emit(Events.TypingStart, asType<TypingPayload>());
        break;
      }

      case GatewayEvents.STOP_WRITING_MESSAGE_CHANNEL:
      case GatewayEvents.STOP_WRITING_MESSAGE_USER: {
        this.client.emit(Events.TypingStop, asType<TypingPayload>());
        break;
      }

      // ─── Forum Events ─────────────────────────────────────────
      case GatewayEvents.NEW_FORUM_POST: {
        this.client.emit(Events.ForumPostCreate, rawData);
        break;
      }

      case GatewayEvents.UPDATE_FORUM_POST: {
        this.client.emit(Events.ForumPostUpdate, rawData);
        break;
      }

      case GatewayEvents.DELETE_FORUM_POST: {
        this.client.emit(Events.ForumPostDelete, rawData);
        break;
      }

      // ─── Reaction Events ──────────────────────────────────────
      case GatewayEvents.MESSAGE_REACTION_ADD:
      case GatewayEvents.CHANNEL_MESSAGE_REACTION_ADD: {
        this.client.emit(Events.MessageReactionAdd, asType<MessageReactionPayload>());
        break;
      }

      case GatewayEvents.MESSAGE_REACTION_REMOVE:
      case GatewayEvents.CHANNEL_MESSAGE_REACTION_REMOVE: {
        this.client.emit(Events.MessageReactionRemove, asType<MessageReactionPayload>());
        break;
      }

      // ─── Friend Events ────────────────────────────────────────
      case GatewayEvents.NEW_USER_INVITE: {
        this.client.emit(Events.FriendRequestReceived, asType<FriendshipPayload>());
        break;
      }

      case GatewayEvents.USER_INVITE_ACCEPTED: {
        this.client.emit(Events.FriendRequestAccepted, asType<FriendshipPayload>());
        break;
      }

      case GatewayEvents.USER_BLOCKED: {
        this.client.emit(Events.UserBlocked, asType<FriendshipPayload>());
        break;
      }

      case GatewayEvents.USER_UNBLOCKED: {
        this.client.emit(Events.UserUnblocked, asType<FriendshipPayload>());
        break;
      }

      case GatewayEvents.USER_INVITE_REJECTED: {
        this.client.emit(Events.FriendRequestRejected, asType<FriendshipPayload>());
        break;
      }

      case GatewayEvents.USER_REMOVE_FRIEND: {
        this.client.emit(Events.FriendRemoved, asType<FriendshipPayload>());
        break;
      }

      default: {
        this.client.emit(Events.Debug, `[WS] Unhandled Wecordy event type: ${type}`);
        break;
      }
    }
  }

  /**
   * Triggered upon a generic disconnect or manual close payload from server.
   */
  private handleClose(code: number, reason: string): void {
    this.client.emit(Events.Debug, `[WS] Connection closed by server/logic: ${code} — ${reason}`);
    this.client.emit(Events.ShardDisconnect, { code, reason });
  }
}

/**
 * Generic gateway payload structure for socket-app.
 */
interface GatewayPayload {
  type?: string;
  data?: {
    type?: string;
    data?: unknown;
    key?: string;
  };
}
