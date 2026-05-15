import Redis from "ioredis";
import { logError } from "../utils/helpers";

// Create Redis connection URL from environment
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Redis common options
const commonOptions = {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Create Redis clients
export const redis = new Redis(redisUrl, commonOptions);
export const redisPub = new Redis(redisUrl, commonOptions);
export const redisSub = new Redis(redisUrl, commonOptions);

// Register connection events
const registerEvents = (client: Redis, name: string) => {
  client.on("error", (error) => logError(error, `Redis (${name}) Error`));
};

registerEvents(redis, "main");
registerEvents(redisPub, "pub");
registerEvents(redisSub, "sub");

// Redis key patterns
export const REDIS_KEYS = {
  USER_SESSION: (userId: string) => `user:session:${userId}`,
  USER_ONLINE: (userId: string) => `user:online:${userId}`,
  USER_ACTIVE_SESSIONS: (userId: string) => `user:active_sessions:${userId}`,

  VIDEO_DETAILS: (videoId: string) => `video:${videoId}`,
  VIDEO_VIEWS: (videoId: string) => `video:views:${videoId}`,
  VIDEO_LIKES: (videoId: string) => `video:likes:${videoId}`,
  TRENDING_VIDEOS: "trending:videos",
  RECOMMENDED_VIDEOS: (userId: string) => `recommended:${userId}`,

  LIVE_STREAM: (streamId: string) => `stream:${streamId}`,
  LIVE_VIEWERS: (streamId: string) => `stream:viewers:${streamId}`,
  ACTIVE_STREAMS: "streams:active",
  STREAM_CHAT: (streamId: string) => `stream:chat:${streamId}`,

  USER_FOLLOWERS: (userId: string) => `user:followers:${userId}`,
  USER_FOLLOWING: (userId: string) => `user:following:${userId}`,
  USER_FEED: (userId: string) => `feed:${userId}`,

  USER_NOTIFICATIONS: (userId: string) => `notifications:${userId}`,
  UNREAD_COUNT: (userId: string) => `notifications:unread:${userId}`,

  RATE_LIMIT: (key: string) => `rate_limit:${key}`,
  API_RATE_LIMIT: (ip: string, endpoint: string) =>
    `api_limit:${ip}:${endpoint}`,

  CACHE: (key: string) => `cache:${key}`,
  USER_CACHE: (userId: string) => `cache:user:${userId}`,

  DAILY_VIEWS: (date: string) => `analytics:views:${date}`,
  POPULAR_HASHTAGS: "analytics:hashtags:popular",
  ANALYTICS_PAGES: (params: string) => `analytics:pages:${params}`,
  ANALYTICS_ACQUISITION: (params: string) => `analytics:acquisition:${params}`,

  SEARCH_CACHE: (query: string) => `search:${query}`,
  TRENDING_SEARCHES: "search:trending",

  TIP_QUEUE: "tips:processing",
  GIFT_QUEUE: "gifts:processing",
  WITHDRAWAL_QUEUE: "withdrawals:processing",
} as const;

// Redis pub/sub channels
export const REDIS_CHANNELS = {
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  LIVE_STREAM_START: "stream:start",
  LIVE_STREAM_END: "stream:end",
  LIVE_STREAM_VIEWER_JOIN: "stream:viewer:join",
  LIVE_STREAM_VIEWER_LEAVE: "stream:viewer:leave",
  NEW_MESSAGE: "message:new",
  NEW_NOTIFICATION: "notification:new",
  VIDEO_UPLOAD: "video:upload",
  TIP_SENT: "tip:sent",
  GIFT_SENT: "gift:sent",
} as const;

// Redis helper service
export class RedisService {
  static async setWithExpiry(key: string, value: any, expirySeconds = 3600) {
    try {
      const data = typeof value === "string" ? value : JSON.stringify(value);
      await redis.setex(key, expirySeconds, data);
    } catch (error) {
      logError(error, `Redis SETEX ${key}`);
    }
  }

  static async get(key: string): Promise<any> {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logError(error, `Redis GET ${key}`);
      return null;
    }
  }

  static async delete(key: string | string[]) {
    try {
      if (Array.isArray(key)) await redis.del(...key);
      else await redis.del(key);
    } catch (error) {
      logError(error, `Redis DEL ${key}`);
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      return (await redis.exists(key)) === 1;
    } catch (error) {
      logError(error, `Redis EXISTS ${key}`);
      return false;
    }
  }

  static async increment(key: string, by = 1): Promise<number> {
    try {
      return await redis.incrby(key, by);
    } catch (error) {
      logError(error, `Redis INCR ${key}`);
      return 0;
    }
  }

  static async addToSet(key: string, ...members: string[]) {
    try {
      await redis.sadd(key, ...members);
    } catch (error) {
      logError(error, `Redis SADD ${key}`);
    }
  }

  static async removeFromSet(key: string, ...members: string[]) {
    try {
      await redis.srem(key, ...members);
    } catch (error) {
      logError(error, `Redis SREM ${key}`);
    }
  }

  static async getSetMembers(key: string): Promise<string[]> {
    try {
      return await redis.smembers(key);
    } catch (error) {
      logError(error, `Redis SMEMBERS ${key}`);
      return [];
    }
  }

  static async isSetMember(key: string, member: string): Promise<boolean> {
    try {
      return (await redis.sismember(key, member)) === 1;
    } catch (error) {
      logError(error, `Redis SISMEMBER ${key}`);
      return false;
    }
  }

  static async addToSortedSet(key: string, score: number, member: string) {
    try {
      await redis.zadd(key, score, member);
    } catch (error) {
      logError(error, `Redis ZADD ${key}`);
    }
  }

  static async getSortedSetRange(
    key: string,
    start = 0,
    stop = -1,
    withScores = false
  ): Promise<string[]> {
    try {
      return withScores
        ? await redis.zrange(key, start, stop, "WITHSCORES")
        : await redis.zrange(key, start, stop);
    } catch (error) {
      logError(error, `Redis ZRANGE ${key}`);
      return [];
    }
  }

  static async pushToList(key: string, ...values: string[]) {
    try {
      await redis.lpush(key, ...values);
    } catch (error) {
      logError(error, `Redis LPUSH ${key}`);
    }
  }

  static async getListRange(
    key: string,
    start = 0,
    stop = -1
  ): Promise<string[]> {
    try {
      return await redis.lrange(key, start, stop);
    } catch (error) {
      logError(error, `Redis LRANGE ${key}`);
      return [];
    }
  }

  static async setHashField(key: string, field: string, value: any) {
    try {
      const data = typeof value === "string" ? value : JSON.stringify(value);
      await redis.hset(key, field, data);
    } catch (error) {
      logError(error, `Redis HSET ${key}`);
    }
  }

  static async getHashField(key: string, field: string): Promise<any> {
    try {
      const value = await redis.hget(key, field);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logError(error, `Redis HGET ${key}`);
      return null;
    }
  }

  static async getAllHashFields(key: string): Promise<Record<string, any>> {
    try {
      const raw = await redis.hgetall(key);
      const parsed: Record<string, any> = {};
      Object.entries(raw).forEach(([k, v]) => {
        try {
          parsed[k] = JSON.parse(v);
        } catch {
          parsed[k] = v;
        }
      });
      return parsed;
    } catch (error) {
      logError(error, `Redis HGETALL ${key}`);
      return {};
    }
  }

  static async publish(channel: string, message: any) {
    try {
      const data =
        typeof message === "string" ? message : JSON.stringify(message);
      await redisPub.publish(channel, data);
    } catch (error) {
      logError(error, `Redis PUBLISH ${channel}`);
    }
  }

  static async subscribe(channel: string, callback: (message: any) => void) {
    try {
      await redisSub.subscribe(channel);
      redisSub.on("message", (ch, msg) => {
        if (ch === channel) {
          try {
            callback(JSON.parse(msg));
          } catch {
            callback(msg);
          }
        }
      });
    } catch (error) {
      logError(error, `Redis SUBSCRIBE ${channel}`);
    }
  }

  static async clearPattern(pattern: string) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length) await redis.del(...keys);
    } catch (error) {
      logError(error, `Redis CLEAR PATTERN ${pattern}`);
    }
  }
}

// Test & initialize
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    logError(error, "Redis Ping");
    return false;
  }
};

export const initializeRedis = async (): Promise<boolean> => {
  try {
    const ok = await testRedisConnection();
    return ok;
  } catch (error) {
    logError(error, "Redis Init");
    return false;
  }
};

export const closeRedisConnections = async () => {
  try {
    await Promise.all([
      redis.disconnect(),
      redisPub.disconnect(),
      redisSub.disconnect(),
    ]);
  } catch (error) {
    logError(error, "Redis Shutdown");
  }
};

export default redis;
