/**
 * Utility functions for formatting various types of strings in Wecordy.
 */
export class Formatters {
  /**
   * Formats a user mention.
   * @param userId - The ID of the user to mention.
   * @param label - The label to display for the mention (usually the username).
   * @returns The formatted mention string.
   */
  static userMention(userId: string, label: string): string {
    return this.formatMention(userId, label);
  }

  /**
   * Formats a role mention.
   * @param roleId - The ID of the role to mention.
   * @param label - The label to display for the mention (usually the role name).
   * @returns The formatted mention string.
   */
  static roleMention(roleId: string, label: string): string {
    return this.formatMention(roleId, label);
  }

  /**
   * Formats content as bold.
   * @param content - The content to format.
   * @returns The formatted string.
   */
  static bold(content: string): string {
    return `**${content}**`;
  }

  /**
   * Formats content as italic.
   * @param content - The content to format.
   * @returns The formatted string.
   */
  static italic(content: string): string {
    return `_${content}_`;
  }

  /**
   * Formats content as underscored (underlined).
   * @param content - The content to format.
   * @returns The formatted string.
   */
  static underscore(content: string): string {
    return `__${content}__`;
  }

  /**
   * Formats content as strikethrough.
   * @param content - The content to format.
   * @returns The formatted string.
   */
  static strikethrough(content: string): string {
    return `~~${content}~~`;
  }

  /**
   * Formats content as a quote.
   * @param content - The content to format.
   * @returns The formatted string.
   */
  static quote(content: string): string {
    return `> ${content}`;
  }

  /**
   * Formats content as a block quote.
   * @param content - The content to format.
   * @returns The formatted string.
   */
  static blockQuote(content: string): string {
    return `>>> ${content}`;
  }

  /**
   * Formats content as inline code.
   * @param content - The content to format.
   * @returns The formatted string.
   */
  static inlineCode(content: string): string {
    return `\`${content}\``;
  }

  /**
   * Formats content as a code block.
   * @param content - The content to format.
   * @param language - The optional language for syntax highlighting.
   * @returns The formatted string.
   */
  static codeBlock(content: string, language?: string): string {
    return `\`\`\`${language ?? ""}\n${content}\n\`\`\``;
  }

  /**
   * Formats content as a spoiler.
   * @param content - The content to format.
   * @returns The formatted string.
   */
  static spoiler(content: string): string {
    return `||${content}||`;
  }

  /**
   * Formats a hyperlink.
   * @param text - The text to display.
   * @param url - The URL the link points to.
   * @param title - The optional title for the link.
   * @returns The formatted string.
   */
  static hyperlink(text: string, url: string, title?: string): string {
    return `[${text}](${url}${title ? ` "${title}"` : ""})`;
  }

  /**
   * Internal helper to format a mention in the Wecordy style.
   * @param id - The ID of the entity.
   * @param label - The display label.
   * @returns The formatted mention string.
   */
  private static formatMention(id: string, label: string): string {
    return `[@ id="${id}" label="${label}"]`;
  }
}
