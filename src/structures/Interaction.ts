import { Base } from './Base';
import type { Client } from '../client/Client';
import { InteractionType, ApplicationCommandOptionType } from '../util/Constants';
import type { User, APIUser } from './User';
import type { Channel, APIChannel } from './Channel';
import type { Server, APIServer } from './Server';
import type { Member, APIMember } from './Member';
import type { Message } from './Message';
import { Application, type APIApplication } from './Application';
import type { MessageCreateOptions } from '../managers/MessageManager';

/**
 * Raw interaction data as dispatched by the backend INTERACTION_CREATE event.
 */
export interface APIInteraction {
  id: string;
  type: number;
  token: string;
  application_id: string | APIApplication;
  channel_id?: string | APIChannel;
  server_id?: string | APIServer;
  user?: APIUser;
  member?: APIMember;
  data?: APIInteractionData;
  version?: number;
}

/**
 * Data payload for an application command interaction.
 */
export interface APIInteractionData {
  id: string;
  name: string;
  type?: number;
  options?: APIInteractionOption[];
}

/**
 * Resolved option data within an interaction.
 */
export interface APIInteractionOption {
  name: string;
  /** May be omitted by some clients */
  type?: number;
  value?: string | number | boolean;
  options?: APIInteractionOption[];
}

/**
 * Represents an incoming interaction (e.g., slash command invocation).
 * Provides methods to respond to the interaction.
 */
export class Interaction extends Base {
  /** The type of this interaction */
  public type: number;

  /** The interaction token (used for responding) */
  public interactionToken: string;

  /** The ID of the application this interaction is for */
  public applicationId: string;

  /** The populated Application model, if available */
  public application: Application | null = null;

  /** The ID of the user who triggered this interaction */
  public userId: string | null = null;

  /** The populated User model who triggered this interaction */
  public user: User | null = null;

  /** The populated Member model if this interaction happened in a server */
  public member: Member | null = null;

  /** The ID of the channel this interaction was triggered in */
  public channelId: string | null;

  /** The populated Channel model, if available */
  public channel: Channel | null = null;

  /** The ID of the server this interaction was triggered in */
  public serverId: string | null;

  /** The populated Server model, if available */
  public server: Server | null = null;

  /** Whether this interaction has already been replied to or deferred */
  public replied: boolean = false;

  /** Whether this interaction has been deferred */
  public deferred: boolean = false;

  /** The raw interaction data (command name, options, etc.) */
  public data: APIInteractionData | null;

  constructor(client: Client, data: APIInteraction) {
    super(client, data.id);
    this.type = data.type;
    this.interactionToken = data.token;

    // application_id -> applicationId & application
    if (typeof data.application_id === 'string' || !data.application_id) {
      this.applicationId = data.application_id as string;
      this.application = null;
    } else {
      this.application = new Application(this.client, data.application_id);
      this.applicationId = this.application.id;
    }

    // channel_id -> channelId & channel
    if (typeof data.channel_id === 'string') {
      this.channelId = data.channel_id;
      this.channel = this.client.channels.cache.get(this.channelId) ?? null;
    } else if (data.channel_id) {
      this.channel = this.client.channels._add(data.channel_id);
      this.channelId = this.channel.id;
    } else {
      this.channelId = null;
      this.channel = null;
    }

    // server_id -> serverId & server
    if (typeof data.server_id === 'string') {
      this.serverId = data.server_id;
      this.server = this.client.servers.cache.get(this.serverId) ?? null;
    } else if (data.server_id) {
      this.server = this.client.servers._add(data.server_id);
      this.serverId = this.server.id;
    } else {
      this.serverId = null;
      this.server = null;
    }

    // user
    if (data.user) {
      this.user = this.client.users._add(data.user);
      this.userId = this.user.id;
    }

    // member
    if (data.member) {
      this.member = this.client.members._add(data.member);
      if (this.member.user) {
        this.user = this.member.user;
        this.userId = this.user.id;
      } else if (this.member.userId) {
        this.userId = this.member.userId;
      }
    } else if (this.serverId && this.userId) {
      this.member = this.client.members.resolveByUser(this.serverId, this.userId) ?? null;
    }

    this.data = data.data ?? null;
  }

  /**
   * Whether this interaction is an application command (slash command).
   */
  isCommand(): this is CommandInteraction {
    return this.type === InteractionType.ApplicationCommand;
  }

  /**
   * Whether this interaction is an autocomplete request.
   */
  isAutocomplete(): boolean {
    return this.type === InteractionType.ApplicationCommandAutocomplete;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      applicationId: this.applicationId,
      userId: this.userId,
      user: this.user?.toJSON() ?? null,
      member: this.member?.toJSON() ?? null,
      channelId: this.channelId,
      channel: this.channel?.toJSON() ?? null,
      serverId: this.serverId,
      server: this.server?.toJSON() ?? null,
      data: this.data,
    };
  }
}

/**
 * Content accepted when replying to an interaction.
 * Wecordy doesn't support ephemeral responses yet; `ephemeral` is ignored and replies are sent
 * as regular channel messages.
 */
export type InteractionReplyOptions =
  | string
  | { content: string; ephemeral?: boolean; attachments?: MessageCreateOptions['attachments'] };

/**
 * Represents a slash command interaction.
 * Provides methods to respond to the command.
 *
 * The Wecordy API has no interaction callback endpoint yet, so replies are sent as regular
 * messages to the channel the command was used in.
 */
export class CommandInteraction extends Interaction {
  /** The message sent by {@link reply} (or by {@link editReply} after a deferral) */
  public replyMessage: Message | null = null;

  /**
   * The name of the command that was invoked.
   */
  commandName(): string {
    return this.data?.name ?? '';
  }

  /**
   * The ID of the command that was invoked.
   */
  commandId(): string {
    return this.data?.id ?? '';
  }

  /**
   * The options of the invoked (sub-)command. When a sub-command (group) was used,
   * this returns the options of that sub-command.
   */
  get options(): APIInteractionOption[] {
    return this.getSubCommand()?.options ?? this.data?.options ?? [];
  }

  /**
   * Gets a specific option by name. Options of the invoked sub-command are searched.
   * @param name - The option name
   * @param required - Whether the option is required (throws if missing)
   */
  getOption(name: string, required: true): APIInteractionOption;
  getOption(name: string, required?: false): APIInteractionOption | undefined;
  getOption(name: string, required?: boolean): APIInteractionOption | undefined {
    const option = this.options.find((o) => o.name === name);
    if (!option && required) {
      throw new Error(`Required option "${name}" was not provided.`);
    }
    return option;
  }

  /**
   * Gets a string option value.
   * @param name - The option name
   * @param required - Whether the option is required
   */
  getString(name: string, required: true): string;
  getString(name: string, required?: false): string | null;
  getString(name: string, required?: boolean): string | null {
    const option = this.getOption(name, required as true);
    return option?.value !== undefined && option.value !== null ? String(option.value) : null;
  }

  /**
   * Gets an integer option value.
   * @param name - The option name
   * @param required - Whether the option is required
   */
  getInteger(name: string, required: true): number;
  getInteger(name: string, required?: false): number | null;
  getInteger(name: string, required?: boolean): number | null {
    const value = this.getNumber(name, required as true);
    return value === null ? null : Math.trunc(value);
  }

  /**
   * Gets a number (decimal) option value.
   * @param name - The option name
   * @param required - Whether the option is required
   */
  getNumber(name: string, required: true): number;
  getNumber(name: string, required?: false): number | null;
  getNumber(name: string, required?: boolean): number | null {
    const option = this.getOption(name, required as true);
    if (option?.value === undefined || option.value === null || option.value === '') return null;
    const value = Number(option.value);
    return Number.isNaN(value) ? null : value;
  }

  /**
   * Gets a boolean option value.
   * @param name - The option name
   * @param required - Whether the option is required
   */
  getBoolean(name: string, required: true): boolean;
  getBoolean(name: string, required?: false): boolean | null;
  getBoolean(name: string, required?: boolean): boolean | null {
    const option = this.getOption(name, required as true);
    if (option?.value === undefined || option.value === null) return null;
    if (typeof option.value === 'string') return option.value === 'true';
    return Boolean(option.value);
  }

  /**
   * Gets the user ID of a user option.
   * @param name - The option name
   * @param required - Whether the option is required
   */
  getUserId(name: string, required: true): string;
  getUserId(name: string, required?: false): string | null;
  getUserId(name: string, required?: boolean): string | null {
    return this.getString(name, required as true);
  }

  /**
   * Gets the channel ID of a channel option.
   * @param name - The option name
   * @param required - Whether the option is required
   */
  getChannelId(name: string, required: true): string;
  getChannelId(name: string, required?: false): string | null;
  getChannelId(name: string, required?: boolean): string | null {
    return this.getString(name, required as true);
  }

  /**
   * Gets the role ID of a role option.
   * @param name - The option name
   * @param required - Whether the option is required
   */
  getRoleId(name: string, required: true): string;
  getRoleId(name: string, required?: false): string | null;
  getRoleId(name: string, required?: boolean): string | null {
    return this.getString(name, required as true);
  }

  /**
   * Gets the invoked sub-command option, if any (descends into sub-command groups).
   */
  getSubCommand(): APIInteractionOption | undefined {
    let options = this.data?.options ?? [];
    let found: APIInteractionOption | undefined;
    for (let depth = 0; depth < 2; depth++) {
      const sub = options.find(isSubCommandOption);
      if (!sub) break;
      found = sub;
      options = sub.options ?? [];
    }
    return found;
  }

  /**
   * Replies to this interaction with a message.
   * @param content - The reply text or options
   * @returns The sent message
   */
  async reply(content: InteractionReplyOptions): Promise<Message> {
    if (this.replied || this.deferred) {
      throw new Error('This interaction has already been replied to or deferred.');
    }

    const message = await this.sendMessage(content);
    this.replyMessage = message;
    this.replied = true;
    return message;
  }

  /**
   * Defers the reply. Use {@link editReply} or {@link followUp} to send the actual response later.
   * Wecordy doesn't show a "thinking" state yet; this only updates the local interaction state.
   */
  async deferReply(): Promise<void> {
    if (this.replied || this.deferred) {
      throw new Error('This interaction has already been replied to or deferred.');
    }

    this.deferred = true;
  }

  /**
   * Edits the reply to this interaction. After {@link deferReply} without a reply,
   * the first call sends the reply.
   * @param content - The new content
   * @returns The edited (or sent) message
   */
  async editReply(content: InteractionReplyOptions): Promise<Message> {
    if (!this.replied && !this.deferred) {
      throw new Error('This interaction has not been replied to or deferred yet.');
    }

    if (!this.replyMessage) {
      const message = await this.sendMessage(content);
      this.replyMessage = message;
      this.replied = true;
      return message;
    }

    return this.replyMessage.edit(typeof content === 'string' ? content : content.content);
  }

  /**
   * Deletes the reply to this interaction.
   */
  async deleteReply(): Promise<void> {
    if (!this.replyMessage) {
      throw new Error('This interaction has no reply to delete.');
    }
    await this.replyMessage.delete();
    this.replyMessage = null;
  }

  /**
   * Sends a follow-up message.
   * @param content - The follow-up message content
   * @returns The sent message
   */
  async followUp(content: InteractionReplyOptions): Promise<Message> {
    return this.sendMessage(content);
  }

  /**
   * Sends a message to the channel the interaction was used in.
   */
  private async sendMessage(content: InteractionReplyOptions): Promise<Message> {
    if (!this.channelId) {
      throw new Error('Cannot respond to an interaction without a channel.');
    }

    const options: MessageCreateOptions =
      typeof content === 'string'
        ? { text: content }
        : { text: content.content, attachments: content.attachments };

    return this.client.messages.send(this.channelId, options);
  }
}

/**
 * Whether an interaction option is a sub-command or sub-command group.
 * Clients may omit the option type; then nested options without a value indicate a sub-command.
 */
function isSubCommandOption(option: APIInteractionOption): boolean {
  if (
    option.type === ApplicationCommandOptionType.SubCommand ||
    option.type === ApplicationCommandOptionType.SubCommandGroup
  ) {
    return true;
  }
  return option.type === undefined && option.value === undefined && Array.isArray(option.options);
}
