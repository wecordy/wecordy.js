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
    return `\`\`\`${language ?? ''}\n${content}\n\`\`\``;
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
    return `[${text}](${url}${title ? ` "${title}"` : ''})`;
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

  /**
   * Cleans mentions and slash commands from raw content.
   * @param content - The raw content string
   * @returns The cleaned content string
   */
  static cleanContent(content: string): string {
    if (!content) return '';

    const mentionRegex = /\[@\s*id="([^"]+)"\s+label="([^"]+)"(?:\s+type="([^"]+)")?\s*\]/g;
    const commandRegex =
      /\[\s*\/\s*id="([^"]+)"\s+label="([^"]+)"\s+applicationId="([^"]+)"(?:\s+optionValues="([^"]+)")?\s*\]/g;

    let result = content.replace(mentionRegex, '@$2');

    result = result.replace(commandRegex, (match, id, label, appId, optionValues) => {
      let optionsStr = '';
      if (optionValues) {
        try {
          const decoded = optionValues.replace(/&quot;/g, '"').replace(/'/g, '"');
          const options = JSON.parse(decoded);
          optionsStr = Object.entries(options)
            .filter(([_, v]) => v)
            .map(([k, v]) => ` ${k}: ${v}`)
            .join('');
        } catch (e) {
          // Fallback for invalid JSON
        }
      }
      return `/${label}${optionsStr}`;
    });

    return this.stripMarkdown(result);
  }

  /**
   * Strips all Markdown formatting from content, returning plain text.
   */
  static stripMarkdown(content: string): string {
    if (!content) return '';

    let result = content;

    // Code blocks ```lang\n...\n``` -> content only
    result = result.replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```(?:\w*\n?)?/g, '').trim();
    });

    // Inline code `...` -> content only
    result = result.replace(/`([^`]+)`/g, '$1');

    // Images ![alt](url) -> alt text
    result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

    // Hyperlinks [text](url) -> text only
    result = result.replace(/\[([^\]]*)\]\([^)]+\)/g, '$1');

    // Bold + italic ***text*** or ___text___
    result = result.replace(/\*{3}(.+?)\*{3}/g, '$1');
    result = result.replace(/_{3}(.+?)_{3}/g, '$1');

    // Bold **text** or __text__
    result = result.replace(/\*{2}(.+?)\*{2}/g, '$1');
    result = result.replace(/_{2}(.+?)_{2}/g, '$1');

    // Italic *text* or _text_
    result = result.replace(/\*(.+?)\*/g, '$1');
    result = result.replace(/_(.+?)_/g, '$1');

    // Strikethrough ~~text~~
    result = result.replace(/~~(.+?)~~/g, '$1');

    // Spoiler ||text||
    result = result.replace(/\|\|(.+?)\|\|/g, '$1');

    // Block quotes >>> text -> text
    result = result.replace(/^>{3}\s?/gm, '');

    // Quotes > text -> text
    result = result.replace(/^>\s?/gm, '');

    return result.trim();
  }

  /**
   * Extracts all URLs from content, including those hidden in Markdown links.
   */
  static extractUrls(content: string): string[] {
    if (!content) return [];

    const urls: string[] = [];

    // Extract from Markdown links [text](url)
    const mdLinkRegex = /\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = mdLinkRegex.exec(content)) !== null) {
      urls.push(match[1]);
    }

    // Extract plain URLs (not already captured)
    const plainUrlRegex = /(?<!\]\()https?:\/\/[^\s)]+/g;
    while ((match = plainUrlRegex.exec(content)) !== null) {
      if (!urls.includes(match[0])) {
        urls.push(match[0]);
      }
    }

    return urls;
  }
}
