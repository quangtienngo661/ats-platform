import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';

export interface RoomTokenRequest {
  room: string;
  identity: string;
  name: string;
  metadata: string;
  /** The token stops working here: the end of the room's join window. */
  expiresAt: Date;
  now: Date;
}

/**
 * Signs LiveKit access tokens. It never calls the LiveKit server: a room is created by
 * the first participant who joins it and closes by itself once empty.
 */
@Injectable()
export class LiveKitService {
  constructor(private readonly config: ConfigService) {}

  /** All three settings present (the env validation refuses a partial set). */
  isConfigured(): boolean {
    return Boolean(this.apiKey() && this.apiSecret() && this.publicUrl());
  }

  /** The address browsers connect to. */
  publicUrl(): string | undefined {
    return this.config.get<string>('LIVEKIT_PUBLIC_URL');
  }

  async createRoomToken(request: RoomTokenRequest): Promise<string> {
    const ttlSeconds = Math.max(
      1,
      Math.floor((request.expiresAt.getTime() - request.now.getTime()) / 1000),
    );
    const token = new AccessToken(this.apiKey(), this.apiSecret(), {
      identity: request.identity,
      name: request.name,
      metadata: request.metadata,
      ttl: ttlSeconds,
    });
    token.addGrant({
      roomJoin: true,
      room: request.room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    return token.toJwt();
  }

  private apiKey(): string | undefined {
    return this.config.get<string>('LIVEKIT_API_KEY');
  }

  private apiSecret(): string | undefined {
    return this.config.get<string>('LIVEKIT_API_SECRET');
  }
}
