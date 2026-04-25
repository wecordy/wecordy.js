import { ApplicationCommandType, ApplicationCommandOptionType } from '../util/Constants';
import { ValidationError } from '../errors';

/**
 * Command option definition used by SlashCommandBuilder.
 */
interface CommandOption {
  name: string;
  description: string;
  type: number;
  required?: boolean;
  choices?: Array<{ name: string; value: string | number }>;
  options?: CommandOption[];
  min_value?: number;
  max_value?: number;
  min_length?: number;
  max_length?: number;
}

/** Regex for valid command names: lowercase letters, numbers, hyphens, underscores */
const COMMAND_NAME_REGEX = /^[a-z0-9_-]{1,32}$/;

/**
 * Builder for creating slash command definitions.
 * Provides a fluent API for constructing command payloads
 * that can be registered with the Wecordy API.
 *
 * @example
 * ```typescript
 * const command = new SlashCommandBuilder()
 *   .setName('ban')
 *   .setDescription('Ban a user from the server')
 *   .addUserOption(option =>
 *     option.setName('user').setDescription('The user to ban').setRequired(true)
 *   )
 *   .addStringOption(option =>
 *     option.setName('reason').setDescription('The reason for the ban')
 *   );
 * ```
 */
export class SlashCommandBuilder {
  /** The command name */
  private name: string = '';

  /** The command description */
  private description: string = '';

  /** The command type (default: CHAT_INPUT) */
  private type: number = ApplicationCommandType.ChatInput;

  /** The command options (parameters) */
  private options: CommandOption[] = [];

  /** Default member permissions required to use this command */
  private defaultMemberPermissions: string | null = null;

  /**
   * Sets the name of this command.
   * Must be 1-32 characters, lowercase, no spaces. Only a-z, 0-9, - and _ allowed.
   * @param name - The command name
   */
  setName(name: string): this {
    if (!COMMAND_NAME_REGEX.test(name)) {
      throw new ValidationError(
        'name',
        `Command name must match ${COMMAND_NAME_REGEX}. Received: "${name}"`,
      );
    }
    this.name = name;
    return this;
  }

  /**
   * Sets the description of this command.
   * Must be 1-100 characters.
   * @param description - The command description
   */
  setDescription(description: string): this {
    if (!description || description.length > 100) {
      throw new ValidationError(
        'description',
        'Description must be between 1 and 100 characters.',
      );
    }
    this.description = description;
    return this;
  }

  /**
   * Sets the default permissions required to use this command.
   * @param permissions - Permission string (bigint serialized)
   */
  setDefaultMemberPermissions(permissions: string): this {
    this.defaultMemberPermissions = permissions;
    return this;
  }

  /**
   * Adds a string option to this command.
   * @param fn - Builder function that configures the option
   */
  addStringOption(fn: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    const option = fn(new CommandOptionBuilder(ApplicationCommandOptionType.String));
    this.addOption(option.build());
    return this;
  }

  /**
   * Adds an integer option to this command.
   * @param fn - Builder function
   */
  addIntegerOption(fn: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    const option = fn(new CommandOptionBuilder(ApplicationCommandOptionType.Integer));
    this.addOption(option.build());
    return this;
  }

  /**
   * Adds a boolean option to this command.
   * @param fn - Builder function
   */
  addBooleanOption(fn: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    const option = fn(new CommandOptionBuilder(ApplicationCommandOptionType.Boolean));
    this.addOption(option.build());
    return this;
  }

  /**
   * Adds a user option to this command.
   * @param fn - Builder function
   */
  addUserOption(fn: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    const option = fn(new CommandOptionBuilder(ApplicationCommandOptionType.User));
    this.addOption(option.build());
    return this;
  }

  /**
   * Adds a channel option to this command.
   * @param fn - Builder function
   */
  addChannelOption(fn: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    const option = fn(new CommandOptionBuilder(ApplicationCommandOptionType.Channel));
    this.addOption(option.build());
    return this;
  }

  /**
   * Adds a role option to this command.
   * @param fn - Builder function
   */
  addRoleOption(fn: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    const option = fn(new CommandOptionBuilder(ApplicationCommandOptionType.Role));
    this.addOption(option.build());
    return this;
  }

  /**
   * Adds a number (decimal) option to this command.
   * @param fn - Builder function
   */
  addNumberOption(fn: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    const option = fn(new CommandOptionBuilder(ApplicationCommandOptionType.Number));
    this.addOption(option.build());
    return this;
  }

  /**
   * Adds a sub-command to this command.
   * @param fn - Builder function that configures the sub-command
   */
  addSubCommand(fn: (subCommand: SubCommandBuilder) => SubCommandBuilder): this {
    const sub = fn(new SubCommandBuilder());
    this.addOption(sub.build());
    return this;
  }

  /**
   * Adds a raw option to the options array.
   */
  private addOption(option: CommandOption): void {
    if (this.options.length >= 25) {
      throw new ValidationError('options', 'A command can have at most 25 options.');
    }
    this.options.push(option);
  }

  /**
   * Validates and serializes the command to a JSON-compatible object.
   */
  toJSON(): Record<string, unknown> {
    if (!this.name) throw new ValidationError('name', 'Command name is required.');
    if (!this.description) throw new ValidationError('description', 'Command description is required.');

    const json: Record<string, unknown> = {
      name: this.name,
      description: this.description,
      type: this.type,
    };

    if (this.options.length > 0) {
      json.options = this.options;
    }

    if (this.defaultMemberPermissions !== null) {
      json.default_member_permissions = this.defaultMemberPermissions;
    }

    return json;
  }
}

/**
 * Builder for individual command options.
 */
export class CommandOptionBuilder {
  private optionType: number;
  private optionName: string = '';
  private optionDescription: string = '';
  private optionRequired: boolean = false;
  private optionChoices: Array<{ name: string; value: string | number }> = [];
  private optionMinValue?: number;
  private optionMaxValue?: number;
  private optionMinLength?: number;
  private optionMaxLength?: number;

  constructor(type: number) {
    this.optionType = type;
  }

  setName(name: string): this {
    if (!COMMAND_NAME_REGEX.test(name)) {
      throw new ValidationError('option.name', `Option name must match ${COMMAND_NAME_REGEX}. Received: "${name}"`);
    }
    this.optionName = name;
    return this;
  }

  setDescription(description: string): this {
    if (!description || description.length > 100) {
      throw new ValidationError('option.description', 'Option description must be between 1 and 100 characters.');
    }
    this.optionDescription = description;
    return this;
  }

  setRequired(required: boolean): this {
    this.optionRequired = required;
    return this;
  }

  addChoices(...choices: Array<{ name: string; value: string | number }>): this {
    if (this.optionChoices.length + choices.length > 25) {
      throw new ValidationError('option.choices', 'An option can have at most 25 choices.');
    }
    this.optionChoices.push(...choices);
    return this;
  }

  setMinValue(min: number): this {
    this.optionMinValue = min;
    return this;
  }

  setMaxValue(max: number): this {
    this.optionMaxValue = max;
    return this;
  }

  setMinLength(min: number): this {
    this.optionMinLength = min;
    return this;
  }

  setMaxLength(max: number): this {
    this.optionMaxLength = max;
    return this;
  }

  build(): CommandOption {
    if (!this.optionName) throw new ValidationError('option.name', 'Option name is required.');
    if (!this.optionDescription) throw new ValidationError('option.description', 'Option description is required.');

    const option: CommandOption = {
      name: this.optionName,
      description: this.optionDescription,
      type: this.optionType,
      required: this.optionRequired,
    };

    if (this.optionChoices.length > 0) option.choices = this.optionChoices;
    if (this.optionMinValue !== undefined) option.min_value = this.optionMinValue;
    if (this.optionMaxValue !== undefined) option.max_value = this.optionMaxValue;
    if (this.optionMinLength !== undefined) option.min_length = this.optionMinLength;
    if (this.optionMaxLength !== undefined) option.max_length = this.optionMaxLength;

    return option;
  }
}

/**
 * Builder for sub-commands within a slash command.
 */
export class SubCommandBuilder {
  private subName: string = '';
  private subDescription: string = '';
  private subOptions: CommandOption[] = [];

  setName(name: string): this {
    if (!COMMAND_NAME_REGEX.test(name)) {
      throw new ValidationError('subCommand.name', `Sub-command name must match ${COMMAND_NAME_REGEX}.`);
    }
    this.subName = name;
    return this;
  }

  setDescription(description: string): this {
    if (!description || description.length > 100) {
      throw new ValidationError('subCommand.description', 'Sub-command description must be 1-100 characters.');
    }
    this.subDescription = description;
    return this;
  }

  addStringOption(fn: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    const option = fn(new CommandOptionBuilder(ApplicationCommandOptionType.String));
    this.subOptions.push(option.build());
    return this;
  }

  addIntegerOption(fn: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    const option = fn(new CommandOptionBuilder(ApplicationCommandOptionType.Integer));
    this.subOptions.push(option.build());
    return this;
  }

  addBooleanOption(fn: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    const option = fn(new CommandOptionBuilder(ApplicationCommandOptionType.Boolean));
    this.subOptions.push(option.build());
    return this;
  }

  addUserOption(fn: (option: CommandOptionBuilder) => CommandOptionBuilder): this {
    const option = fn(new CommandOptionBuilder(ApplicationCommandOptionType.User));
    this.subOptions.push(option.build());
    return this;
  }

  build(): CommandOption {
    if (!this.subName) throw new ValidationError('subCommand.name', 'Sub-command name is required.');
    if (!this.subDescription) throw new ValidationError('subCommand.description', 'Sub-command description is required.');

    return {
      name: this.subName,
      description: this.subDescription,
      type: ApplicationCommandOptionType.SubCommand,
      options: this.subOptions.length > 0 ? this.subOptions : undefined,
    };
  }
}
