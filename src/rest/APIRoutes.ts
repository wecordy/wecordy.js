export const APIRoutes = {
  // ─── User / Auth ─────────────────────────────────────────────────
  /** GET - Get current user */
  currentUser: () => `/v1/user` as const,
  /** GET - Get user by ID */
  user: (userId: string) => `/v1/user/${userId}` as const,
  /** PUT - Update current user */
  updateUser: () => `/v1/user` as const,

  // ─── Application / Bot ──────────────────────────────────────────
  /** GET - Get current application for bot */
  currentApplication: () => `/v1/application/@me` as const,
  /** GET, POST - Applications list / create (owner only) */
  applications: () => `/v1/application` as const,
  /** GET, PATCH, DELETE - Application by ID (owner only) */
  application: (appId: string) => `/v1/application/${appId}` as const,
  /** GET - Get servers the application's bot is in (owner only, not available with a bot token) */
  applicationServers: (appId: string) => `/v1/application/${appId}/servers` as const,

  // ─── Application Commands (Slash Commands) ──────────────────────
  /** GET, POST, PUT - Global commands for an application */
  applicationCommands: (appId: string) => `/v1/application/${appId}/commands` as const,
  /** GET, PATCH, DELETE - Single global command */
  applicationCommand: (appId: string, commandId: string) =>
    `/v1/application/${appId}/commands/${commandId}` as const,

  // ─── Servers ────────────────────────────────────────────────────
  /** GET - Get servers owned by the current user */
  servers: () => `/v1/servers` as const,
  /** GET - Get a specific server */
  server: (serverId: string) => `/v1/servers/${serverId}` as const,
  /** PUT - Update a server */
  updateServer: (serverId: string) => `/v1/servers/${serverId}` as const,
  /** POST - Ban a user from a server */
  serverBan: (serverId: string) => `/v1/servers/${serverId}/ban` as const,
  /** DELETE - Unban a user from a server */
  serverUnban: (serverId: string, userId: string) => `/v1/servers/${serverId}/ban/${userId}` as const,
  /** GET - Get banned users of a server */
  serverBannedUsers: (serverId: string) => `/v1/servers/${serverId}/banned-users` as const,
  /** POST - Kick a user from a server */
  serverKick: (serverId: string) => `/v1/servers/${serverId}/kick` as const,

  // ─── Server Members ─────────────────────────────────────────────
  /** GET - Get the server memberships of the current user (servers the bot is in) */
  userServers: () => `/v1/server-has-user` as const,
  /** GET - Get server members */
  serverMembers: (serverId: string) => `/v1/server-has-user/${serverId}` as const,
  /** GET - Get a specific member */
  serverMember: (serverId: string, userId: string) =>
    `/v1/server-has-user/${serverId}/user/${userId}` as const,
  /** POST - Get online users in a server */
  serverOnlineUsers: () => `/v1/server-has-user/online` as const,

  // ─── Channels ───────────────────────────────────────────────────
  /** GET - Get channels in a server */
  serverChannels: (serverId: string) => `/v1/channel/${serverId}/channels` as const,
  /** POST - Create a channel */
  createChannel: () => `/v1/channel` as const,
  /** GET - Get a specific channel */
  channel: (channelId: string) => `/v1/channel/${channelId}` as const,
  /** PUT - Update a channel */
  updateChannel: () => `/v1/channel` as const,
  /** DELETE - Delete a channel */
  deleteChannel: () => `/v1/channel` as const,
  /** POST - Join voice channel */
  joinVoiceChannel: () => `/v1/channel/join` as const,
  /** POST - Disconnect voice channel */
  disconnectVoiceChannel: () => `/v1/channel/disconnect` as const,
  /** POST - Add tracks to voice channel */
  addTracks: () => `/v1/channel/add-tracks` as const,

  // ─── Cloudflare Calls ───────────────────────────────────────────
  /** POST - Create Cloudflare Session */
  cloudflareSession: () => `/v1/cloudflare/session` as const,
  /** POST - Send new tracks offer to Cloudflare */
  cloudflareNewTracks: () => `/v1/cloudflare/tracks` as const,
  /** POST - Send renegotiation to Cloudflare */
  cloudflareRenegotiate: () => `/v1/cloudflare/renegotiate` as const,
  /** POST - Close tracks on Cloudflare */
  cloudflareCloseTracks: () => `/v1/cloudflare/close` as const,
  /** POST - Get session info/tracks from Cloudflare */
  cloudflareGetTracks: () => `/v1/cloudflare/session/info` as const,

  // ─── Messages ───────────────────────────────────────────────────
  /** POST - Get messages in a channel */
  channelMessages: () => `/v1/message/channel` as const,
  /** PUT - Send a message to a channel */
  sendChannelMessage: () => `/v1/message/channel` as const,
  /** DELETE - Delete a message */
  deleteChannelMessage: () => `/v1/message/channel` as const,
  /** PATCH - Edit a message */
  editMessage: () => `/v1/message` as const,
  /** PUT - React to a channel message */
  channelMessageReaction: () => `/v1/message/channel/reaction` as const,
  /** POST - Get pinned messages of a channel */
  pinnedMessages: () => `/v1/message/pinned` as const,
  /** POST - Pin a message */
  pinMessage: () => `/v1/message/pin` as const,
  /** POST - Unpin a message */
  unpinMessage: () => `/v1/message/unpin` as const,
  /** POST, DELETE - Start / stop the typing indicator in a channel */
  channelTyping: () => `/v1/message/writing/channel` as const,

  // ─── DM Messages ───────────────────────────────────────────────
  /** POST - Get DM messages with a specific user, DELETE - Delete a DM */
  directMessages: () => `/v1/message` as const,
  /** PUT - Send a DM */
  sendDirectMessage: () => `/v1/message` as const,
  /** PUT - React to a DM */
  directMessageReaction: () => `/v1/message/reaction` as const,
  /** POST, DELETE - Start / stop the typing indicator in a DM */
  directTyping: () => `/v1/message/writing` as const,

  // ─── Roles ──────────────────────────────────────────────────────
  /** GET - Get roles in a server */
  serverRoles: (serverId: string) => `/v1/servers/${serverId}/roles` as const,
  /** POST - Create a role */
  createRole: (serverId: string) => `/v1/servers/${serverId}/roles` as const,
  /** PUT - Update a role */
  updateRole: (serverId: string, roleId: string) =>
    `/v1/servers/${serverId}/roles/${roleId}` as const,
  /** DELETE - Delete a role */
  deleteRole: (serverId: string, roleId: string) =>
    `/v1/servers/${serverId}/roles/${roleId}` as const,
  /** POST - Assign a role to a member, DELETE - Remove a role from a member */
  memberRole: (serverId: string, roleId: string, userId: string) =>
    `/v1/servers/${serverId}/roles/${roleId}/members/${userId}` as const,
  /** GET - Get the roles of a member */
  memberRoles: (serverId: string, userId: string) =>
    `/v1/servers/${serverId}/roles/members/${userId}` as const,

  // ─── Webhooks ───────────────────────────────────────────────────
  /** GET - Get webhooks for a channel, POST - Create a webhook */
  channelWebhooks: (channelId: string) => `/v1/webhook/channel/${channelId}` as const,
  /** GET - Get webhooks for a server */
  serverWebhooks: (serverId: string) => `/v1/webhook/server/${serverId}` as const,
  /** PATCH - Update a webhook, DELETE - Delete a webhook */
  webhook: (webhookId: string) => `/v1/webhook/${webhookId}` as const,
  /** POST - Execute a webhook (no authorization required) */
  executeWebhook: (webhookId: string, token: string) => `/v1/webhook/${webhookId}/${token}` as const,

  // ─── Interactions ───────────────────────────────────────────────
  /** POST - Interactions endpoint (for incoming user interactions) */
  interactions: () => `/v1/interactions` as const,

  // ─── Invites ────────────────────────────────────────────────────
  /** POST - Create an invite, GET - List invites for a server */
  serverInvites: (serverId: string) => `/v1/servers/${serverId}/invite` as const,
  /** DELETE - Delete an invite */
  serverInvite: (serverId: string, inviteId: string) => `/v1/servers/${serverId}/invite/${inviteId}` as const,

  // ─── Audit Log ──────────────────────────────────────────────────
  /** POST - Get audit log for a server */
  auditLog: (serverId: string) => `/v1/servers/${serverId}/audit-logs` as const,
} as const;
