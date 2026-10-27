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
  MessageUnpinPayload,
  RoleAssignedPayload,
  RoleRemovedPayload,
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
   * Resolves once the gateway confirms the authentication.
   * @param token - The bot token for authentication
   */
  async connect(token: string): Promise<void> {
    // Drop a previous connection, if any
    this.closeSocket();

    this.token = token;
    this.status = WebSocketStatus.Connecting;

    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const settle = (error?: Error): void => {
        if (settled) return;
        settled = true;
        clearTimeout(authTimeout);
        if (error) {
          this.closeSocket();
          this.status = WebSocketStatus.Disconnected;
          reject(error);
        } else {
          resolve();
        }
      };

      // The gateway sends nothing when it never receives (or ignores) the authentication
      const authTimeout = setTimeout(() => {
        settle(new WebSocketError('Timed out waiting for the gateway to confirm the authentication.'));
      }, APIConstants.AUTH_TIMEOUT);

      try {
        const socket = io(this.gatewayURL, {
          transports: ['websocket'],
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: APIConstants.MAX_RECONNECT_ATTEMPTS,
          reconnectionDelay: APIConstants.INITIAL_RECONNECT_DELAY,
          reconnectionDelayMax: APIConstants.MAX_RECONNECT_DELAY,
        });
        this.socket = socket;

        socket.on('connect', () => {
          this.client.emit(Events.Debug, `[WS] Connected to ${this.gatewayURL}, sending authentication...`);
          // The gateway requires an authentication emit after every (re)connection
          socket.emit('authentication', {
            token: `Bot ${this.token}`,
            intents: this.client.options.intents ?? [],
          });
        });

        socket.on('authentication', (data: unknown) => {
          // The gateway responds with a plain string (e.g. "message Taked") upon successful auth
          this.client.emit(Events.Debug, `[WS] Authenticated successfully: ${JSON.stringify(data)}`);
          this.status = WebSocketStatus.Ready;
          this.client.emit(Events.ShardReady, data);
          settle();
        });

        socket.on('message', (payload: GatewayPayload) => {
          this.handleMessage(payload);
        });

        socket.on('disconnect', (reason: string) => {
          // The gateway disconnects without any event when the authentication is rejected
          if (!settled && reason === 'io server disconnect') {
            settle(
              new WebSocketError(
                'The gateway rejected the authentication. Check the bot token and the intents.',
                1008,
                reason,
              ),
            );
            return;
          }
          this.handleClose(reason, socket.active);
        });

        socket.on('connect_error', (error: Error) => {
          if (!settled) {
            settle(new WebSocketError(`Failed to connect: ${error.message}`));
            return;
          }
          this.client.emit(Events.Debug, `[WS] Connection error: ${error.message}`);
        });

        socket.io.on('reconnect_attempt', (attempt: number) => {
          this.status = WebSocketStatus.Reconnecting;
          this.client.emit(Events.ShardReconnecting, { attempt });
        });

        socket.io.on('reconnect_failed', () => {
          this.status = WebSocketStatus.Disconnected;
          this.client.emit(
            Events.Error,
            new WebSocketError(`Failed to reconnect to the gateway after ${APIConstants.MAX_RECONNECT_ATTEMPTS} attempts.`),
          );
        });
      } catch (error) {
        settle(
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
    const wasConnected = this.socket !== null;
    this.closeSocket();
    this.status = WebSocketStatus.Disconnected;

    if (wasConnected) {
      this.client.emit(Events.ShardDisconnect, { code: 1000, reason: 'Client disconnect' });
    }
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
   * Removes all listeners and closes the underlying socket without emitting events.
   */
  private closeSocket(): void {
    if (!this.socket) return;
    this.socket.io.removeAllListeners();
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
  }

  /**
   * Parses the Wecordy "message" event envelope: `{ type, data, key? }`.
   */
  private handleMessage(payload: GatewayPayload): void {
    if (!payload || typeof payload !== 'object' || !payload.type) {
      this.client.emit(Events.Debug, `[WS] Received message without event type`);
      return;
    }

    try {
      this.dispatchEvent(payload.type, payload.data);
    } catch (error) {
      this.client.emit(
        Events.Error,
        new WebSocketError(
          `Failed to handle gateway event ${payload.type}: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  }

  /**
   * Dispatches a gateway event to the appropriate cache and client handler.
   */
  private dispatchEvent(type: string, data: unknown): void {
    // Gateway data comes as untyped JSON — we use `unknown` intermediate casts.
    const rawData = (data ?? {}) as Record<string, unknown>;
    const asType = <T>(): T => data as T;

    switch (type) {
      // ─── Gateway internal / unused ───────────────────────────
      case GatewayEvents.ME:
      case GatewayEvents.JOIN:
      case GatewayEvents.CLOSE:
      case GatewayEvents.LOG_RELAY_DONE: {
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
        this.client.emit(Events.ChannelDelete, cached ?? new Channel(this.client, asType<APIChannel>()));
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
        // Payload: { channel_id, message }
        const payload = asType<{ channel_id?: string; message?: APIMessage }>();
        if (!payload.message) break;
        const message = this.client.messages._add({
          channel_id: payload.channel_id,
          ...payload.message,
          is_pinned: true,
        });
        this.client.emit(Events.MessagePin, message);
        break;
      }

      case GatewayEvents.UNPIN_MESSAGE: {
        // Payload: { channel_id, message_id }
        const payload = asType<MessageUnpinPayload>();
        const cached = this.client.messages.cache.get(payload.message_id);
        cached?._patch({ is_pinned: false });
        this.client.emit(Events.MessageUnpin, cached ?? payload);
        break;
      }

      // ─── Server Events ────────────────────────────────────────
      case GatewayEvents.NEW_SERVER: {
        // The backend sends the bot's membership with the populated server
        const membership = asType<APIMember>();
        const serverData =
          membership.server_id && typeof membership.server_id === 'object'
            ? membership.server_id
            : asType<APIServer>();
        const server = new Server(this.client, serverData);
        this.client.servers._add(server);
        if (membership.server_id && typeof membership.server_id === 'object') {
          this.client.members._add(new Member(this.client, membership));
        }
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
        // Either the server document or only its ID (when the bot leaves the server)
        const serverId = typeof data === 'string' ? data : (rawData.id as string);
        this.removeServer(serverId);
        break;
      }

      case GatewayEvents.ME_KICKED_FROM_SERVER:
      case GatewayEvents.ME_BANNED_FROM_SERVER: {
        this.removeServer(rawData.server_id as string);
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
        // Payload: { user_id } — the backend doesn't send the server ID
        const userId = rawData.user_id as string;
        const candidates = this.client.members.cache.filter((m) => m.userId === userId);
        const cached = candidates.size === 1 ? candidates.first() : undefined;
        if (cached) this.client.members._remove(cached.id);
        this.client.emit(Events.ServerMemberRemove, cached ?? { user_id: userId });
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
        // Payload: { id }
        const roleId = rawData.id as string;
        const cached = this.client.roles.cache.get(roleId);
        this.client.roles._remove(roleId);
        for (const member of this.client.members.cache.values()) {
          member.roleIds = member.roleIds.filter((id) => id !== roleId);
        }
        this.client.emit(Events.RoleDelete, cached ?? { id: roleId });
        break;
      }

      case GatewayEvents.ROLE_ASSIGNED: {
        const payload = asType<RoleAssignedPayload>();
        const userId = typeof payload.user_id === 'string' ? payload.user_id : payload.user_id?.id;
        const roleId = typeof payload.role_id === 'string' ? payload.role_id : payload.role_id?.id;
        const member = userId ? this.client.members.resolveByUser(payload.server_id, userId) : undefined;
        if (member && roleId && !member.roleIds.includes(roleId)) member.roleIds.push(roleId);
        this.client.emit(Events.RoleAssigned, payload);
        break;
      }

      case GatewayEvents.ROLE_REMOVED: {
        const payload = asType<RoleRemovedPayload>();
        const member = this.client.members.resolveByUser(payload.server_id, payload.user_id);
        if (member) member.roleIds = member.roleIds.filter((id) => id !== payload.role_id);
        this.client.emit(Events.RoleRemoved, payload);
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

      case GatewayEvents.APPLICATION_COMMANDS_UPDATE: {
        this.client.emit(Events.ApplicationCommandsUpdate, asType<any>());
        break;
      }

      // ─── User Events ──────────────────────────────────────────
      case GatewayEvents.UPDATE_USER: {
        const userId = rawData.id as string;
        const oldUser = this.client.users.cache.get(userId);
        const newUser = new User(this.client, asType<APIUser>());
        this.client.users._add(newUser);
        if (this.client.user?.id === newUser.id) this.client.user = newUser;
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

      case GatewayEvents.VOICE_STATE_UPDATE: {
        this.client.emit(Events.VoiceStateUpdate, asType<any>());
        break;
      }

      // ─── Moderation Events ────────────────────────────────────
      case GatewayEvents.USER_BANNED: {
        const payload = asType<BanPayload>();
        this.removeCachedMember(payload.server_id, payload.user?.id);
        this.client.emit(Events.ServerBanAdd, payload);
        break;
      }

      case GatewayEvents.USER_UNBANNED: {
        this.client.emit(Events.ServerBanRemove, asType<BanPayload>());
        break;
      }

      case GatewayEvents.USER_KICKED: {
        const payload = asType<KickPayload>();
        this.removeCachedMember(payload.server_id, payload.user_id);
        this.client.emit(Events.ServerKick, payload);
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
   * Removes a server and everything that belongs to it from the caches and emits ServerDelete.
   */
  private removeServer(serverId: string | undefined): void {
    if (!serverId) return;
    const cached = this.client.servers.cache.get(serverId);
    this.client.servers._remove(serverId);

    for (const channel of this.client.channels.cache.values()) {
      if (channel.serverId === serverId) this.client.channels._remove(channel.id);
    }
    for (const role of this.client.roles.cache.values()) {
      if (role.serverId === serverId) this.client.roles._remove(role.id);
    }
    for (const member of this.client.members.cache.values()) {
      if (member.serverId === serverId) this.client.members._remove(member.id);
    }

    this.client.emit(Events.ServerDelete, cached ?? { id: serverId });
  }

  /**
   * Removes a cached member by server and user ID.
   */
  private removeCachedMember(serverId: string | undefined, userId: string | undefined): void {
    if (!serverId || !userId) return;
    const member = this.client.members.resolveByUser(serverId, userId);
    if (member) this.client.members._remove(member.id);
  }

  /**
   * Triggered when the socket disconnects (by the server or the network).
   */
  private handleClose(reason: string, willReconnect: boolean): void {
    this.status = willReconnect ? WebSocketStatus.Reconnecting : WebSocketStatus.Disconnected;
    this.client.emit(Events.Debug, `[WS] Connection closed: ${reason}${willReconnect ? ', reconnecting...' : ''}`);
    this.client.emit(Events.ShardDisconnect, { code: 1000, reason });

    if (!willReconnect) {
      this.client.emit(Events.Warn, `[WS] Disconnected from the gateway (${reason}) and will not reconnect.`);
    }
  }
}

/**
 * Envelope of the gateway "message" event.
 */
interface GatewayPayload {
  type?: string;
  data?: unknown;
  /** Only set for replayed events */
  key?: string;
}
