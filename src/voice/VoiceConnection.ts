import { RTCPeerConnection, MediaStreamTrack, RTCSessionDescription } from 'werift';
import type { Client } from '../client/Client';
import { APIRoutes } from '../rest/APIRoutes';
import { AudioPlayer } from './AudioPlayer';

export interface VoiceConnectionOptions {
  channelId: string;
  serverId: string;
}

/**
 * Manages a voice connection to a Wecordy channel.
 * Uses WebRTC (via werift) to communicate with Cloudflare Calls.
 */
export class VoiceConnection {
  public readonly client: Client;
  public readonly channelId: string;
  public readonly serverId: string;

  private peerConnection: RTCPeerConnection | null = null;
  private sessionId: string | null = null;
  private audioTrack: MediaStreamTrack | null = null;
  private player: AudioPlayer | null = null;

  constructor(client: Client, options: VoiceConnectionOptions) {
    this.client = client;
    this.channelId = options.channelId;
    this.serverId = options.serverId;
  }

  /**
   * Establishes the voice connection.
   */
  public async connect(): Promise<this> {
    // 1. Join the voice channel via API
    await this.client.rest.post(APIRoutes.joinVoiceChannel(), {
      channel_id: this.channelId,
    });

    // 2. Create Cloudflare Session
    const sessionResponse = await this.client.rest.post<any>(APIRoutes.cloudflareSession(), {});
    this.sessionId = sessionResponse.sessionId;

    // 3. Initialize PeerConnection
    this.peerConnection = new RTCPeerConnection({
      bundlePolicy: 'max-bundle',
      // In a real scenario, we might need ICE servers from cloudflareIceServerData()
    });

    // 4. Create Audio Track (for sending)
    this.audioTrack = new MediaStreamTrack({ kind: 'audio' });
    if (!this.audioTrack.id) {
      this.audioTrack.id = this.audioTrack.uuid;
    }
    const transceiver = this.peerConnection.addTransceiver(this.audioTrack, {
      direction: 'sendonly',
    });

    // 5. Create Offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    // 6. Send Tracks to Cloudflare
    const tracks = [
      {
        location: 'local',
        mid: transceiver.mid,
        trackName: this.audioTrack.id,
      },
    ];

    const newTracksResult = await this.client.rest.post<any>(APIRoutes.cloudflareNewTracks(), {
      tracks,
      offer_sdp: this.peerConnection.localDescription!.sdp,
      session_id: this.sessionId,
    });

    // 7. Set Remote Description (Answer)
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(newTracksResult.sessionDescription.sdp, newTracksResult.sessionDescription.type),
    );

    // 8. Register tracks with the channel service
    await this.client.rest.post(APIRoutes.addTracks(), {
      channel_id: this.channelId,
      session_id: this.sessionId,
      tracks: [
        {
          location: 'local',
          mid: transceiver.mid,
          trackName: this.audioTrack.id,
        },
      ],
    });

    console.log(`[VoiceConnection] Connected to channel ${this.channelId}`);

    // Register in client's connections
    this.client.voiceConnections.set(this.channelId, this);

    return this;
  }

  /**
   * Plays an audio file.
   * @param filePath - Path to the audio file
   */
  public play(filePath: string): AudioPlayer {
    if (!this.audioTrack) {
      throw new Error('Cannot play audio: No audio track established.');
    }

    if (this.player) {
      this.player.stop();
    }

    this.player = new AudioPlayer(this.audioTrack, filePath);
    this.player.start();
    return this.player;
  }

  /**
   * Disconnects from the voice channel.
   */
  public async disconnect(): Promise<void> {
    if (this.player) {
      this.player.stop();
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    await this.client.rest.post(APIRoutes.disconnectVoiceChannel(), {
      channel_id: this.channelId,
    });

    // Unregister from client's connections
    this.client.voiceConnections.delete(this.channelId);

    this.sessionId = null;
    this.audioTrack = null;
  }
}
