import * as fs from 'fs';
import { ChildProcess } from 'child_process';
import { MediaStreamTrack, RtpPacket, RtpHeader } from 'werift';

// WebM EBML element IDs
const SIMPLE_BLOCK_ID = 0xa3;
const CONTAINER_IDS = new Set([
  0x1a45dfa3, // EBML
  0x18538067, // Segment
  0x1654ae6b, // Tracks
  0xae, // TrackEntry
  0x1f43b675, // Cluster
  0xe1, // Audio
]);

/**
 * Reads an EBML variable-length integer (VINT) used for element sizes.
 */
function readVint(data: Buffer, offset: number): { value: number; length: number } {
  if (offset >= data.length) throw new Error('Unexpected end of data');
  const firstByte = data[offset];
  let length = 1;
  let mask = 0x80;
  while ((firstByte & mask) === 0 && length < 8) {
    length++;
    mask >>= 1;
  }
  let value = firstByte & (mask - 1);
  for (let i = 1; i < length; i++) {
    if (offset + i >= data.length) throw new Error('Unexpected end of data');
    value = value * 256 + data[offset + i];
  }
  return { value, length };
}

/**
 * Reads an EBML element ID (keeps leading marker bit).
 */
function readElementId(data: Buffer, offset: number): { id: number; length: number } {
  if (offset >= data.length) throw new Error('Unexpected end of data');
  const firstByte = data[offset];
  let length = 1;
  let mask = 0x80;
  while ((firstByte & mask) === 0 && length < 4) {
    length++;
    mask >>= 1;
  }
  let id = firstByte;
  for (let i = 1; i < length; i++) {
    if (offset + i >= data.length) throw new Error('Unexpected end of data');
    id = id * 256 + data[offset + i];
  }
  return { id, length };
}

/**
 * Check if an EBML size value represents "unknown size".
 */
function isUnknownSize(value: number, vintLength: number): boolean {
  const maxValues = [0x7f, 0x3fff, 0x1fffff, 0x0fffffff];
  return vintLength <= 4 && value === maxValues[vintLength - 1];
}

/**
 * Extracts Opus frames from a WebM buffer (batch mode).
 */
export function extractOpusFrames(data: Buffer): Buffer[] {
  const result = extractOpusFramesIncremental(data, 0);
  return result.frames;
}

/**
 * Incrementally extracts Opus frames from a WebM buffer starting at a given offset.
 * Returns extracted frames and the new offset to resume parsing from.
 */
export function extractOpusFramesIncremental(
  data: Buffer,
  startOffset: number,
): { frames: Buffer[]; newOffset: number } {
  const frames: Buffer[] = [];
  let offset = startOffset;

  while (offset < data.length - 1) {
    try {
      const { id, length: idLen } = readElementId(data, offset);
      const { value: size, length: sizeLen } = readVint(data, offset + idLen);
      const headerSize = idLen + sizeLen;

      if (id === SIMPLE_BLOCK_ID && !isUnknownSize(size, sizeLen)) {
        const blockEnd = offset + headerSize + size;

        // Not enough data yet — stop and wait for more
        if (blockEnd > data.length) {
          break;
        }

        const blockData = data.subarray(offset + headerSize, blockEnd);
        const { length: trackNumLen } = readVint(blockData, 0);
        const frameStart = trackNumLen + 3;
        if (frameStart < blockData.length) {
          const frame = Buffer.from(blockData.subarray(frameStart));
          if (frame.length > 0) {
            frames.push(frame);
          }
        }
        offset = blockEnd;
      } else if (CONTAINER_IDS.has(id) || isUnknownSize(size, sizeLen)) {
        offset += headerSize;
      } else {
        if (isUnknownSize(size, sizeLen)) {
          offset += headerSize;
        } else {
          const elementEnd = offset + headerSize + size;
          // Not enough data for this element yet
          if (elementEnd > data.length) {
            break;
          }
          offset = elementEnd;
        }
      }
    } catch {
      break;
    }
  }

  return { frames, newOffset: offset };
}

/**
 * AudioPlayer — plays Opus frames over a WebRTC track at 20ms intervals.
 * Supports both batch mode (from file/buffer) and streaming mode.
 */
export class AudioPlayer {
  private readonly track: MediaStreamTrack;
  private readonly source: string;
  private timer: ReturnType<typeof setInterval> | null = null;
  private isPlaying: boolean = false;
  private frames: Buffer[] = [];
  private frameIndex: number = 0;
  private sequenceNumber: number = 0;
  private timestamp: number = 0;
  private ssrc: number;
  private streamEnded: boolean = false;
  private isPaused: boolean = false;
  private sourceProcess: ChildProcess | null = null;

  constructor(track: MediaStreamTrack, source: string) {
    this.track = track;
    this.source = source;
    this.ssrc = (Math.random() * 0xffffffff) >>> 0;
  }

  /**
   * Creates an AudioPlayer from a local file path.
   */
  public static fromFile(track: MediaStreamTrack, filePath: string): AudioPlayer {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const fileData = fs.readFileSync(filePath);
    const player = new AudioPlayer(track, filePath);
    player.frames = extractOpusFrames(fileData);
    player.streamEnded = true;
    return player;
  }

  /**
   * Creates an AudioPlayer from a raw WebM/Opus buffer.
   */
  public static fromBuffer(track: MediaStreamTrack, data: Buffer, label: string = 'buffer'): AudioPlayer {
    const player = new AudioPlayer(track, label);
    player.frames = extractOpusFrames(data);
    player.streamEnded = true;
    return player;
  }

  /**
   * Creates a streaming AudioPlayer that receives frames incrementally.
   */
  public static createStream(track: MediaStreamTrack, label: string = 'stream'): AudioPlayer {
    return new AudioPlayer(track, label);
  }

  /**
   * Pushes Opus frames to the playback queue (used in streaming mode).
   */
  public pushFrames(newFrames: Buffer[]): void {
    this.frames.push(...newFrames);
  }

  /**
   * Marks the stream as complete — no more frames will arrive.
   */
  public markEnd(): void {
    this.streamEnded = true;
  }

  /**
   * Starts playback. Sends one Opus frame every 20ms as a proper RTP packet.
   * In streaming mode, waits for frames if the buffer runs dry.
   */
  public start(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.frameIndex = 0;
    this.sequenceNumber = (Math.random() * 0xffff) >>> 0;
    this.timestamp = (Math.random() * 0xffffffff) >>> 0;

    console.log(`[AudioPlayer] Starting playback: ${this.source}`);

    this.timer = setInterval(() => {
      if (!this.isPlaying) {
        this.stop();
        return;
      }

      // Skip sending when paused
      if (this.isPaused) return;

      // If we've consumed all frames...
      if (this.frameIndex >= this.frames.length) {
        if (this.streamEnded) {
          // Stream is done and all frames played
          console.log(`[AudioPlayer] Finished playing ${this.source} (${this.frames.length} frames)`);
          this.stop();
        }
        // else: still streaming, wait for more frames
        return;
      }

      const opusFrame = this.frames[this.frameIndex];
      const rtpPacket = this.buildRtpPacket(opusFrame);
      this.track.writeRtp(rtpPacket);

      this.frameIndex++;
      this.sequenceNumber = (this.sequenceNumber + 1) & 0xffff;
      this.timestamp = (this.timestamp + 960) >>> 0; // 960 samples = 20ms at 48kHz
    }, 20);
  }

  /**
   * Builds an RTP packet buffer with the given Opus frame as payload.
   */
  private buildRtpPacket(opusFrame: Buffer): Buffer {
    const header = Buffer.alloc(12);

    header[0] = 0x80; // V=2, P=0, X=0, CC=0
    header[1] = 111; // M=0, PT=111 (Opus)
    header.writeUInt16BE(this.sequenceNumber, 2);
    header.writeUInt32BE(this.timestamp, 4);
    header.writeUInt32BE(this.ssrc, 8);

    return Buffer.concat([header, opusFrame]);
  }

  /**
   * Links a child process (like yt-dlp) to this player so it can be killed when playback stops.
   */
  public setSourceProcess(process: ChildProcess): void {
    this.sourceProcess = process;
  }

  /**
   * Stops the playback and cleans up resources.
   */
  public stop(): void {
    this.isPlaying = false;
    this.isPaused = false;

    if (this.sourceProcess) {
      this.sourceProcess.kill();
      this.sourceProcess = null;
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.frames = [];
    this.frameIndex = 0;
    this.streamEnded = false;
  }

  /**
   * Pauses the playback. Can be resumed with resume().
   */
  public pause(): void {
    this.isPaused = true;
  }

  /**
   * Resumes playback after a pause.
   */
  public resume(): void {
    this.isPaused = false;
  }
}
