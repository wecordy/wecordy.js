export const APIRoutes = {
  // ─── User / Auth ─────────────────────────────────────────────────
  /** GET - Get current user */
  currentUser: () => `/v1/user` as const,
  /** GET - Get user by ID */
  user: (userId: string) => `/v1/user/${userId}` as const,
  /** PATCH - Update current user */
  updateUser: () => `/v1/user` as const,

  // ─── Application / Bot ──────────────────────────────────────────
  /** GET - Get current application for bot */
  currentApplication: () => `/v1/application/@me` as const,
  /** GET, POST - Applications list / create */
  applications: () => `/v1/application` as const,
  /** GET, PATCH, DELETE - Application by ID */
  application: (appId: string) => `/v1/application/${appId}` as const,
  /** GET - Get servers the bot is in */
  applicationServers: (appId: string) => `/v1/application/${appId}/servers` as const,

  // ─── Application Commands (Slash Commands) ──────────────────────
  /** GET, POST, PUT - Global commands for an application */
  applicationCommands: (appId: string) => `/v1/application/${appId}/commands` as const,
  /** GET, PATCH, DELETE - Single global command */
  applicationCommand: (appId: string, commandId: string) =>
    `/v1/application/${appId}/commands/${commandId}` as const,
  /** GET, POST, PUT - Server-specific commands */
  applicationServerCommands: (appId: string, serverId: string) =>
    `/v1/application/${appId}/servers/${serverId}/commands` as const,
  /** GET, PATCH, DELETE - Single server-specific command */
  applicationServerCommand: (appId: string, serverId: string, commandId: string) =>
    `/v1/application/${appId}/servers/${serverId}/commands/${commandId}` as const,

  // ─── Servers ────────────────────────────────────────────────────
  /** GET - Get servers the bot is in */
  servers: () => `/v1/servers` as const,
  /** GET - Get a specific server */
  server: (serverId: string) => `/v1/servers/${serverId}` as const,
  /** PATCH - Update a server */
  updateServer: (serverId: string) => `/v1/servers/${serverId}` as const,
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
  /** PATCH - Update a channel */
  updateChannel: (channelId: string) => `/v1/channel/${channelId}` as const,
  /** DELETE - Delete a channel */
  deleteChannel: (channelId: string) => `/v1/channel/${channelId}` as const,

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
  /** GET - Get pinned messages */
  pinnedMessages: (channelId: string) => `/v1/channels/${channelId}/pins` as const,
  /** POST - Pin a message */
  pinMessage: (channelId: string, messageId: string) =>
    `/v1/channels/${channelId}/pins/${messageId}` as const,

  // ─── DM Messages ───────────────────────────────────────────────
  /** POST - Get DM messages with a specific user */
  directMessages: () => `/v1/message` as const,
  /** PUT - Send a DM */
  sendDirectMessage: () => `/v1/message` as const,

  // ─── Roles ──────────────────────────────────────────────────────
  /** GET - Get roles in a server */
  serverRoles: (serverId: string) => `/v1/servers/${serverId}/roles` as const,
  /** POST - Create a role */
  createRole: (serverId: string) => `/v1/servers/${serverId}/roles` as const,
  /** PATCH - Update a role */
  updateRole: (serverId: string, roleId: string) =>
    `/v1/servers/${serverId}/roles/${roleId}` as const,
  /** DELETE - Delete a role */
  deleteRole: (serverId: string, roleId: string) =>
    `/v1/servers/${serverId}/roles/${roleId}` as const,
  /** POST - Assign a role to a member */
  assignRole: (serverId: string) => `/v1/servers/${serverId}/roles/assign` as const,
  /** POST - Remove a role from a member */
  removeRole: (serverId: string) => `/v1/servers/${serverId}/roles/remove` as const,

  // ─── Webhooks ───────────────────────────────────────────────────
  /** GET - Get webhooks for a channel */
  channelWebhooks: (channelId: string) => `/v1/channel/${channelId}/webhooks` as const,
  /** POST - Create a webhook */
  createWebhook: (channelId: string) => `/v1/channel/${channelId}/webhooks` as const,
  /** PATCH - Update a webhook */
  updateWebhook: (webhookId: string) => `/v1/webhooks/${webhookId}` as const,
  /** DELETE - Delete a webhook */
  deleteWebhook: (webhookId: string) => `/v1/webhooks/${webhookId}` as const,
  /** POST - Execute a webhook */
  executeWebhook: (webhookId: string, token: string) =>
    `/v1/webhooks/${webhookId}/${token}` as const,

  // ─── Interactions ───────────────────────────────────────────────
  /** POST - Interactions endpoint (for incoming user interactions) */
  interactions: () => `/v1/interactions` as const,
  /** POST - Interaction callback (bot responds to interaction) */
  interactionCallback: (interactionId: string, interactionToken: string) =>
    `/v1/interactions/${interactionId}/${interactionToken}/callback` as const,
  /** PATCH - Edit original interaction response */
  interactionOriginalResponse: (appId: string, interactionToken: string) =>
    `/v1/webhooks/${appId}/${interactionToken}/messages/@original` as const,

  // ─── Invites ────────────────────────────────────────────────────
  /** POST - Create an invite */
  createInvite: (serverId: string) => `/v1/servers/${serverId}/invites` as const,
  /** GET - List invites for a server */
  serverInvites: (serverId: string) => `/v1/servers/${serverId}/invites` as const,

  // ─── Audit Log ──────────────────────────────────────────────────
  /** GET - Get audit log for a server */
  auditLog: (serverId: string) => `/v1/servers/${serverId}/audit-logs` as const,
} as const;
