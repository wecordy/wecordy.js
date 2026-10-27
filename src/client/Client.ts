import { EventEmitter } from 'eventemitter3';
import { RESTClient, type RESTOptions } from '../rest/RESTClient';
import { APIRoutes } from '../rest/APIRoutes';
import { WebSocketManager } from '../gateway/WebSocketManager';
import { ServerManager } from '../managers/ServerManager';
import { ChannelManager } from '../managers/ChannelManager';
import { MessageManager } from '../managers/MessageManager';
import { UserManager } from '../managers/UserManager';
import { RoleManager } from '../managers/RoleManager';
import { MemberManager } from '../managers/MemberManager';
import { ApplicationCommandManager } from '../managers/ApplicationCommandManager';
import { User, type APIUser } from '../structures/User';
import { Message } from '../structures/Message';
import { Channel } from '../structures/Channel';
import { Server } from '../structures/Server';
import { Member } from '../structures/Member';
import { Role } from '../structures/Role';
import { Interaction, CommandInteraction } from '../structures/Interaction';
import { Events } from '../util/Events';
import { TokenError, ValidationError, WebSocketError } from '../errors';
import { Collection } from '../util/Collection';
import { GatewayIntentBits, type GatewayIntentName } from '../util/Constants';
import type { VoiceConnection } from '../voice/VoiceConnection';
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
  MemberRemovePayload,
  ServerRemovePayload,
  RoleAssignedPayload,
  RoleRemovedPayload,
} from '../types/GatewayPayloads';

/**
 * Configuration options for the Client.
 */
export interface ClientOptions {
  /**
   * Intents sent to the gateway. `Servers` is required to receive server scoped events
   * such as channel messages. Unknown intent names are rejected by the gateway.
   */
  intents?: Array<GatewayIntentName | string>;

  /** REST API options */
  rest?: RESTOptions;

  /** WebSocket gateway URL (default: wss://gateway.wecordy.com) */
  wsURL?: string;

  /**
   * @deprecated Socket.IO handles heartbeats internally; this option has no effect.
   */
  heartbeatInterval?: number;

  /** Maximum number of messages kept in the message cache (default: 500) */
  messageCacheMaxSize?: number;

  /** Whether to fetch the servers the bot is in during login (default: true) */
  fetchServersOnLogin?: boolean;
}

/**
 * Application data (minimal structure for client.application).
 */
export interface ClientApplication {
  /** The application ID */
  id: string;

  /** The application command manager */
  commands: ApplicationCommandManager;
}

/**
 * Event map for the Client.
 * Maps event names to their respective callback arguments.
 */
export interface ClientEvents {
  [Events.ClientReady]: [client: Client];

  [Events.MessageCreate]: [message: Message];
  [Events.MessageDelete]: [message: Message];
  [Events.MessageUpdate]: [oldMessage: Message | null, newMessage: Message];
  [Events.MessageReactionAdd]: [data: MessageReactionPayload];
  [Events.MessageReactionRemove]: [data: MessageReactionPayload];

  [Events.ChannelCreate]: [channel: Channel];
  [Events.ChannelUpdate]: [oldChannel: Channel | null, newChannel: Channel];
  [Events.ChannelDelete]: [channel: Channel];
  [Events.ChannelPositionsUpdate]: [data: ChannelPositionPayload[]];
  [Events.ChannelEvent]: [data: any];
  [Events.MessagePin]: [message: Message];
  /** The cached message, or the raw payload if the message isn't cached */
  [Events.MessageUnpin]: [message: Message | MessageUnpinPayload];

  [Events.ServerCreate]: [server: Server];
  [Events.ServerUpdate]: [oldServer: Server | null, newServer: Server];
  /** The cached server, or only its ID if the server isn't cached */
  [Events.ServerDelete]: [server: Server | ServerRemovePayload];

  [Events.ServerMemberAdd]: [member: Member];
  [Events.ServerMemberUpdate]: [oldMember: Member | null, newMember: Member];
  /** The cached member, or only the user ID if the member can't be resolved */
  [Events.ServerMemberRemove]: [member: Member | MemberRemovePayload];

  [Events.RoleCreate]: [role: Role];
  [Events.RoleUpdate]: [oldRole: Role | null, newRole: Role];
  /** The cached role, or only its ID if the role isn't cached */
  [Events.RoleDelete]: [role: Role | { id: string }];
  [Events.RoleAssigned]: [data: RoleAssignedPayload];
  [Events.RoleRemoved]: [data: RoleRemovedPayload];

  [Events.InteractionCreate]: [interaction: Interaction | CommandInteraction];
  [Events.ApplicationCommandsUpdate]: [data: any];
  [Events.UserUpdate]: [oldUser: User | null, newUser: User];

  [Events.VoiceChannelJoin]: [data: VoiceStatePayload];
  [Events.VoiceChannelDisconnect]: [data: VoiceStatePayload];
  [Events.VoiceChannelMove]: [data: VoiceStatePayload];
  [Events.VoiceStateUpdate]: [data: any];

  [Events.ServerBanAdd]: [data: BanPayload];
  [Events.ServerBanRemove]: [data: BanPayload];
  [Events.ServerKick]: [data: KickPayload];

  [Events.ForumPostCreate]: [data: any];
  [Events.ForumPostUpdate]: [data: any];
  [Events.ForumPostDelete]: [data: any];

  [Events.PermissionUpdate]: [data: PermissionUpdatePayload];

  [Events.FriendRequestReceived]: [data: FriendshipPayload];
  [Events.FriendRequestAccepted]: [data: FriendshipPayload];
  [Events.FriendRequestRejected]: [data: FriendshipPayload];
  [Events.UserBlocked]: [data: FriendshipPayload];
  [Events.UserUnblocked]: [data: FriendshipPayload];
  [Events.FriendRemoved]: [data: FriendshipPayload];

  [Events.TypingStart]: [data: TypingPayload];
  [Events.TypingStop]: [data: TypingPayload];

  [Events.Debug]: [message: string];
  [Events.Warn]: [message: string];
  [Events.Error]: [error: Error | WebSocketError];
  [Events.ShardReady]: [data: unknown];
  [Events.ShardReconnecting]: [data: { attempt: number }];
  [Events.ShardDisconnect]: [data: { code: number; reason: string }];
}

export class Client extends EventEmitter<ClientEvents> {
  /** Client configuration options */
  public readonly options: ClientOptions;

  /** The REST API client */
  public readonly rest: RESTClient;

  /** The WebSocket gateway manager */
  public readonly ws: WebSocketManager;

  // ─── Entity Managers ─────────────────────────────────────────
  /** Manages cached servers */
  public readonly servers: ServerManager;

  /** Manages cached channels */
  public readonly channels: ChannelManager;

  /** Manages message operations */
  public readonly messages: MessageManager;

  /** Manages cached users */
  public readonly users: UserManager;

  /** Manages cached roles */
  public readonly roles: RoleManager;

  /** Manages cached server members */
  public readonly members: MemberManager;

  // ─── State ───────────────────────────────────────────────────
  /** The currently logged-in bot user (set after login) */
  public user: User | null = null;

  /** The application data (set after login) */
  public application: ClientApplication | null = null;

  /** Whether the client is ready */
  public isReady: boolean = false;

  /** Active voice connections, keyed by channel ID */
  public readonly voiceConnections: Collection<string, VoiceConnection> = new Collection();

  /** The bot token (stored privately) */
  private token: string | null = null;

  /** Timestamp when the client became ready */
  public readyAt: Date | null = null;

  constructor(options: ClientOptions = {}) {
    super();
    this.options = options;

    // Fail early on intents the gateway would reject
    const validIntents = Object.values(GatewayIntentBits) as string[];
    const invalidIntents = (options.intents ?? []).filter((intent) => !validIntents.includes(intent));
    if (invalidIntents.length > 0) {
      throw new ValidationError(
        'intents',
        `Unknown intent(s): ${invalidIntents.join(', ')}. Valid intents: ${validIntents.join(', ')}.`,
      );
    }

    // Initialize REST client
    this.rest = new RESTClient(options.rest);

    // Initialize WebSocket manager
    this.ws = new WebSocketManager(this);

    // Initialize entity managers
    this.servers = new ServerManager(this);
    this.channels = new ChannelManager(this);
    this.messages = new MessageManager(this);
    this.users = new UserManager(this);
    this.roles = new RoleManager(this);
    this.members = new MemberManager(this);
  }

  /**
   * Logs the bot in by authenticating with the given token.
   *
   * This method:
   * 1. Sets the token on the REST client
   * 2. Fetches the bot's own user info to validate the token
   * 3. Fetches the servers the bot is in
   * 4. Connects to the WebSocket gateway
   * 5. Emits `ready` (also when the gateway is unreachable; the bot then works with the REST API only)
   *
   * @param token - The bot token (from Application settings)
   */
  async login(token: string): Promise<void> {
    if (!token || typeof token !== 'string') {
      throw new TokenError('A valid bot token must be provided.');
    }
    if (this.isReady) {
      throw new WebSocketError('The client is already logged in. Call destroy() before logging in again.');
    }

    this.token = token;
    this.rest.setToken(token);

    this.emit(Events.Debug, '[Client] Validating token...');

    // Step 1: Fetch bot user info to validate the token
    try {
      const userData = await this.rest.get<APIUser>(APIRoutes.currentUser());
      this.user = new User(this, userData);
      this.users._add(this.user);

      this.emit(Events.Debug, `[Client] Authenticated as ${this.user.username} (${this.user.id})`);

      // Fetch the actual application for the bot
      const appData = await this.rest.get<{ id?: string; _id?: string }>(APIRoutes.currentApplication());
      const applicationId = appData?.id ?? appData?._id;
      if (!applicationId) {
        throw new Error('The API did not return the application of this bot.');
      }

      // Set up application with command manager using the real application ID
      this.application = {
        id: applicationId,
        commands: new ApplicationCommandManager(this, applicationId),
      };
    } catch (error) {
      this.token = null;
      throw new TokenError(`Failed to validate token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Step 2: Fill the server cache
    if (this.options.fetchServersOnLogin !== false) {
      try {
        const servers = await this.servers.fetchAll();
        this.emit(Events.Debug, `[Client] Cached ${servers.length} server(s)`);
      } catch (error) {
        this.emit(
          Events.Warn,
          `[Client] Failed to fetch servers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    // Step 3: Connect to WebSocket gateway
    if (!this.options.intents?.includes(GatewayIntentBits.Servers)) {
      this.emit(
        Events.Warn,
        '[Client] The "Servers" intent is not set. The bot will not receive server events such as channel messages.',
      );
    }

    this.emit(Events.Debug, '[Client] Connecting to WebSocket gateway...');
    try {
      await this.ws.connect(token);
    } catch (error) {
      this.emit(
        Events.Warn,
        `[Client] WebSocket connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. The bot will still work with REST API only.`,
      );
    }

    // Step 4: Ready (emitted once per login, reconnects emit ShardReady instead)
    this.isReady = true;
    this.readyAt = new Date();
    this.emit(Events.ClientReady, this);
  }

  /**
   * Gracefully destroys the client, closing all connections and clearing caches.
   */
  destroy(): void {
    this.emit(Events.Debug, '[Client] Destroying client...');

    // Disconnect WebSocket
    this.ws.disconnect();

    // Disconnect all voice connections
    for (const connection of this.voiceConnections.values()) {
      connection.disconnect().catch(() => {});
    }
    this.voiceConnections.clear();

    // Clear all caches
    this.servers.cache.clear();
    this.channels.cache.clear();
    this.messages.cache.clear();
    this.users.cache.clear();
    this.roles.cache.clear();
    this.members.cache.clear();

    // Reset state
    this.user = null;
    this.application = null;
    this.isReady = false;
    this.readyAt = null;
    this.token = null;

    // Remove all listeners
    this.removeAllListeners();
  }

  /**
   * How long the client has been ready, in milliseconds.
   * Returns null if the client isn't ready.
   */
  get uptime(): number | null {
    if (!this.readyAt) return null;
    return Date.now() - this.readyAt.getTime();
  }
}
