import * as fs from 'fs';
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
 * Returns the decoded value and byte length consumed.
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
  // Mask off the length marker bit to get the value
  let value = firstByte & (mask - 1);
  for (let i = 1; i < length; i++) {
    if (offset + i >= data.length) throw new Error('Unexpected end of data');
    value = value * 256 + data[offset + i];
  }
  return { value, length };
}

/**
 * Reads an EBML element ID.
 * IDs keep the leading marker bit (unlike size VINTs).
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
  let id = firstByte; // Keep the marker bit for element IDs
  for (let i = 1; i < length; i++) {
    if (offset + i >= data.length) throw new Error('Unexpected end of data');
    id = id * 256 + data[offset + i];
  }
  return { id, length };
}

/**
 * Check if an EBML size value represents "unknown size"
 * (all data bits set to 1, e.g. 0x7F for 1-byte, 0x3FFF for 2-byte, etc.)
 */
function isUnknownSize(value: number, vintLength: number): boolean {
  const maxValues = [0x7f, 0x3fff, 0x1fffff, 0x0fffffff];
  return vintLength <= 4 && value === maxValues[vintLength - 1];
}

/**
 * Extracts raw Opus frames from a WebM/Opus file buffer.
 * Parses EBML structure, finds SimpleBlock elements, and extracts the audio payload.
 */
function extractOpusFrames(data: Buffer): Buffer[] {
  const frames: Buffer[] = [];
  let offset = 0;

  while (offset < data.length - 1) {
    try {
      const { id, length: idLen } = readElementId(data, offset);
      const { value: size, length: sizeLen } = readVint(data, offset + idLen);
      const headerSize = idLen + sizeLen;

      if (id === SIMPLE_BLOCK_ID && !isUnknownSize(size, sizeLen)) {
        // Parse SimpleBlock: trackNum(VINT) + timecode(int16) + flags(uint8) + frameData
        const blockStart = offset + headerSize;
        const blockEnd = blockStart + size;

        if (blockEnd <= data.length) {
          const blockData = data.subarray(blockStart, blockEnd);
          // Read track number VINT (just to know how many bytes to skip)
          const { length: trackNumLen } = readVint(blockData, 0);
          // Skip: trackNum + 2 bytes timecode + 1 byte flags
          const frameStart = trackNumLen + 3;
          if (frameStart < blockData.length) {
            const frame = Buffer.from(blockData.subarray(frameStart));
            if (frame.length > 0) {
              frames.push(frame);
            }
          }
        }
        offset += headerSize + size;
      } else if (CONTAINER_IDS.has(id) || isUnknownSize(size, sizeLen)) {
        // Descend into container elements
        offset += headerSize;
      } else {
        // Skip non-container, non-block elements
        if (isUnknownSize(size, sizeLen)) {
          offset += headerSize;
        } else {
          offset += headerSize + size;
        }
      }
    } catch {
      break; // End of parseable data
    }
  }

  return frames;
}

/**
 * AudioPlayer — extracts Opus frames from a WebM file and streams them
 * over a WebRTC track at real-time pace (20ms intervals).
 */
export class AudioPlayer {
  private readonly track: MediaStreamTrack;
  private readonly filePath: string;
  private timer: ReturnType<typeof setInterval> | null = null;
  private isPlaying: boolean = false;
  private frames: Buffer[] = [];
  private frameIndex: number = 0;
  private sequenceNumber: number = 0;
  private timestamp: number = 0;
  private ssrc: number;

  constructor(track: MediaStreamTrack, filePath: string) {
    this.track = track;
    this.filePath = filePath;
    this.ssrc = (Math.random() * 0xffffffff) >>> 0;
  }

  /**
   * Starts playback: parses the file, extracts Opus frames,
   * then sends one frame every 20ms as a proper RTP packet.
   */
  public start(): void {
    if (this.isPlaying) return;

    if (!fs.existsSync(this.filePath)) {
      throw new Error(`File not found: ${this.filePath}`);
    }

    // Read the entire file and extract Opus frames from WebM container
    const fileData = fs.readFileSync(this.filePath);
    this.frames = extractOpusFrames(fileData);

    if (this.frames.length === 0) {
      throw new Error('No Opus frames found in the file. Make sure it is a WebM/Opus file.');
    }

    console.log(
      `[AudioPlayer] Extracted ${this.frames.length} Opus frames (~${((this.frames.length * 20) / 1000).toFixed(1)}s) from ${this.filePath}`,
    );

    this.isPlaying = true;
    this.frameIndex = 0;
    this.sequenceNumber = (Math.random() * 0xffff) >>> 0;
    this.timestamp = (Math.random() * 0xffffffff) >>> 0;

    // Send one Opus frame every 20ms (standard Opus frame duration at 48kHz)
    this.timer = setInterval(() => {
      if (!this.isPlaying || this.frameIndex >= this.frames.length) {
        this.stop();
        console.log(`[AudioPlayer] Finished playing ${this.filePath}`);
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

    // Byte 0: V=2 (bits 6-7), P=0, X=0, CC=0
    header[0] = 0x80;
    // Byte 1: M=0, PT=111 (Opus)
    header[1] = 111;
    // Bytes 2-3: Sequence number
    header.writeUInt16BE(this.sequenceNumber, 2);
    // Bytes 4-7: Timestamp
    header.writeUInt32BE(this.timestamp, 4);
    // Bytes 8-11: SSRC
    header.writeUInt32BE(this.ssrc, 8);

    return Buffer.concat([header, opusFrame]);
  }

  /**
   * Stops the playback and cleans up resources.
   */
  public stop(): void {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.frames = [];
    this.frameIndex = 0;
  }
}
