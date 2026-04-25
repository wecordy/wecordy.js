/**
 * Builder for creating rich message embeds.
 *
 * @example
 * ```typescript
 * const embed = new EmbedBuilder()
 *   .setTitle('Welcome!')
 *   .setDescription('Welcome to the server.')
 *   .setColor('#5865F2')
 *   .addField('Rules', 'Be nice to everyone.', false)
 *   .setFooter('Wecordy Bot');
 *
 * channel.send({ text: '', embeds: [embed.toJSON()] });
 * ```
 */
export class EmbedBuilder {
  private data: EmbedData = {};

  /**
   * Sets the title of the embed.
   * @param title - Embed title (max 256 characters)
   */
  setTitle(title: string): this {
    this.data.title = title.slice(0, 256);
    return this;
  }

  /**
   * Sets the description of the embed.
   * @param description - Embed description (max 4096 characters)
   */
  setDescription(description: string): this {
    this.data.description = description.slice(0, 4096);
    return this;
  }

  /**
   * Sets the URL of the embed title.
   * @param url - A URL to link the title to
   */
  setURL(url: string): this {
    this.data.url = url;
    return this;
  }

  /**
   * Sets the color of the embed sidebar.
   * @param color - Hex color string (e.g., '#5865F2') or number
   */
  setColor(color: string | number): this {
    if (typeof color === 'string') {
      this.data.color = parseInt(color.replace('#', ''), 16);
    } else {
      this.data.color = color;
    }
    return this;
  }

  /**
   * Sets the timestamp of the embed.
   * @param timestamp - Date or ISO string (default: now)
   */
  setTimestamp(timestamp?: Date | string): this {
    if (timestamp instanceof Date) {
      this.data.timestamp = timestamp.toISOString();
    } else if (typeof timestamp === 'string') {
      this.data.timestamp = timestamp;
    } else {
      this.data.timestamp = new Date().toISOString();
    }
    return this;
  }

  /**
   * Sets the footer of the embed.
   * @param text - Footer text (max 2048 characters)
   * @param iconUrl - Optional footer icon URL
   */
  setFooter(text: string, iconUrl?: string): this {
    this.data.footer = { text: text.slice(0, 2048), icon_url: iconUrl };
    return this;
  }

  /**
   * Sets the thumbnail image of the embed.
   * @param url - Thumbnail image URL
   */
  setThumbnail(url: string): this {
    this.data.thumbnail = { url };
    return this;
  }

  /**
   * Sets the main image of the embed.
   * @param url - Image URL
   */
  setImage(url: string): this {
    this.data.image = { url };
    return this;
  }

  /**
   * Sets the author of the embed.
   * @param name - Author name
   * @param iconUrl - Optional author icon URL
   * @param url - Optional author URL
   */
  setAuthor(name: string, iconUrl?: string, url?: string): this {
    this.data.author = { name, icon_url: iconUrl, url };
    return this;
  }

  /**
   * Adds a field to the embed.
   * @param name - Field name (max 256 characters)
   * @param value - Field value (max 1024 characters)
   * @param inline - Whether this field should be inline
   */
  addField(name: string, value: string, inline: boolean = false): this {
    if (!this.data.fields) this.data.fields = [];
    if (this.data.fields.length >= 25) {
      throw new Error('An embed can have at most 25 fields.');
    }
    this.data.fields.push({
      name: name.slice(0, 256),
      value: value.slice(0, 1024),
      inline,
    });
    return this;
  }

  /**
   * Adds multiple fields to the embed.
   * @param fields - Array of field objects
   */
  addFields(...fields: Array<{ name: string; value: string; inline?: boolean }>): this {
    for (const field of fields) {
      this.addField(field.name, field.value, field.inline ?? false);
    }
    return this;
  }

  /**
   * Serializes the embed to a JSON-compatible object.
   */
  toJSON(): EmbedData {
    return { ...this.data };
  }
}

/**
 * Raw embed data structure.
 */
export interface EmbedData {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  footer?: { text: string; icon_url?: string };
  thumbnail?: { url: string };
  image?: { url: string };
  author?: { name: string; icon_url?: string; url?: string };
  fields?: Array<{ name: string; value: string; inline: boolean }>;
}
