import type { APIUser } from '../structures/User';
import type { APIChannel } from '../structures/Channel';

/**
 * Payload for message reaction events.
 */
export interface MessageReactionPayload {
  message_id: string;
  emoji: string;
  user_id: string;
  user: APIUser;
  channel_id?: string;
  forum_post_id?: string;
  to_user_id?: string;
}

/**
 * Payload for voice channel events (join/leave/move).
 */
export interface VoiceStatePayload {
  user: APIUser;
  channel: APIChannel;
  from_channel?: APIChannel;
  to_channel?: APIChannel;
}

/**
 * Payload for typing indicators.
 */
export interface TypingPayload {
  user: APIUser;
  channel_id?: string;
}

/**
 * Payload for server ban events.
 */
export interface BanPayload {
  server_id: string;
  user: APIUser;
}

/**
 * Payload for server kick events.
 */
export interface KickPayload {
  server_id: string;
  user_id: string;
}

/**
 * Basic friendship object structure from backend.
 */
export interface FriendshipPayload {
  id: string;
  requester_user_id: string | APIUser;
  receiver_user_id: string | APIUser;
  status: string;
  blocked_user_id?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Payload for call-related events.
 */
export interface CallPayload {
  friend_ship_id: string;
  caller: APIUser;
  receiver: APIUser;
}

/**
 * Payload for call answers.
 */
export interface CallAnswerPayload {
  user: APIUser;
  session_id: string;
  tracks: any;
}

/**
 * Payload for stream tracks in calls.
 */
export interface StreamTrackPayload {
  user: APIUser;
  friend_ship_id: string;
  data: {
    session_id: string;
    tracks: any;
  };
}

/**
 * Payload for channel position updates.
 */
export interface ChannelPositionPayload {
  id: string;
  position: number;
  parent_id?: string;
}

/**
 * Payload for permission updates.
 */
export interface PermissionUpdatePayload {
  server_id: string;
  role_id: string;
}
