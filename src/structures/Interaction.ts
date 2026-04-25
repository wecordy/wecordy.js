import { Base } from './Base';
import type { Client } from '../client/Client';
import { InteractionType, InteractionResponseType } from '../util/Constants';
import { APIRoutes } from '../rest/APIRoutes';
import type { User, APIUser } from './User';
import type { Channel, APIChannel } from './Channel';
import type { Server, APIServer } from './Server';
import type { Member, APIMember } from './Member';
import { Application, type APIApplication } from './Application';

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
  type: number;
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
    if (typeof data.channel_id === 'string' || !data.channel_id) {
      this.channelId = data.channel_id as string ?? null;
      this.channel = null;
    } else {
      this.channel = this.client.channels._add(data.channel_id);
      this.channelId = this.channel.id;
    }

    // server_id -> serverId & server
    if (typeof data.server_id === 'string' || !data.server_id) {
      this.serverId = data.server_id as string ?? null;
      this.server = null;
    } else {
      this.server = this.client.servers._add(data.server_id);
      this.serverId = this.server.id;
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
 * Represents a slash command interaction.
 * Provides methods to respond to the command.
 */
export class CommandInteraction extends Interaction {
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
   * Gets a specific option value by name.
   * @param name - The option name
   * @param required - Whether the option is required (throws if missing)
   */
  getOption(name: string, required: true): APIInteractionOption;
  getOption(name: string, required?: false): APIInteractionOption | undefined;
  getOption(name: string, required?: boolean): APIInteractionOption | undefined {
    const option = this.data?.options?.find((o) => o.name === name);
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
    return (option?.value as string) ?? null;
  }

  /**
   * Gets an integer option value.
   * @param name - The option name
   * @param required - Whether the option is required
   */
  getInteger(name: string, required: true): number;
  getInteger(name: string, required?: false): number | null;
  getInteger(name: string, required?: boolean): number | null {
    const option = this.getOption(name, required as true);
    return (option?.value as number) ?? null;
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
    return (option?.value as boolean) ?? null;
  }

  /**
   * Gets all sub-command options, if any.
   */
  getSubCommand(): APIInteractionOption | undefined {
    return this.data?.options?.find((o) => o.type === 1);
  }

  /**
   * Replies to this interaction with a message.
   * @param content - The reply text or options
   */
  async reply(content: string | { content: string; ephemeral?: boolean }): Promise<void> {
    if (this.replied || this.deferred) {
      throw new Error('This interaction has already been replied to or deferred.');
    }

    const payload = typeof content === 'string' ? { content } : content;

    await this.client.rest.post(
      APIRoutes.interactionCallback(this.id, this.interactionToken),
      {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: payload,
      },
    );

    this.replied = true;
  }

  /**
   * Defers the reply, showing a "thinking" state.
   * Use followUp() to send the actual response later.
   */
  async deferReply(): Promise<void> {
    if (this.replied || this.deferred) {
      throw new Error('This interaction has already been replied to or deferred.');
    }

    await this.client.rest.post(
      APIRoutes.interactionCallback(this.id, this.interactionToken),
      {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
      },
    );

    this.deferred = true;
  }

  /**
   * Edits the original reply to this interaction.
   * @param content - The new content
   */
  async editReply(content: string | { content: string }): Promise<void> {
    const payload = typeof content === 'string' ? { content } : content;

    await this.client.rest.patch(
      APIRoutes.interactionOriginalResponse(this.applicationId, this.interactionToken),
      payload,
    );
  }

  /**
   * Sends a follow-up message after deferring.
   * @param content - The follow-up message content
   */
  async followUp(content: string | { content: string }): Promise<void> {
    const payload = typeof content === 'string' ? { content } : content;

    await this.client.rest.post(
      APIRoutes.interactionCallback(this.id, this.interactionToken),
      {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: payload,
      },
    );
  }
}
