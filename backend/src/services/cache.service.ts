import { RedisService, REDIS_KEYS } from '../config/redis';
import { logError } from '../utils/helpers';

export class CacheService {
  /**
   * Cache user data
   */
  static async cacheUser(userId: string, userData: any, ttl: number = 3600): Promise<void> {
    try {
      const key = REDIS_KEYS.USER_CACHE(userId);
      await RedisService.setWithExpiry(key, userData, ttl);
    } catch (error) {
      logError(error, 'Cache User');
    }
  }

  /**
   * Get cached user data
   */
  static async getCachedUser(userId: string): Promise<any> {
    try {
      const key = REDIS_KEYS.USER_CACHE(userId);
      return await RedisService.get(key);
    } catch (error) {
      logError(error, 'Get Cached User');
      return null;
    }
  }

  /**
   * Cache video data
   */
  static async cacheVideo(videoId: string, videoData: any, ttl: number = 1800): Promise<void> {
    try {
      const key = REDIS_KEYS.VIDEO_DETAILS(videoId);
      await RedisService.setWithExpiry(key, videoData, ttl);
    } catch (error) {
      logError(error, 'Cache Video');
    }
  }

  /**
   * Get cached video data
   */
  static async getCachedVideo(videoId: string): Promise<any> {
    try {
      const key = REDIS_KEYS.VIDEO_DETAILS(videoId);
      return await RedisService.get(key);
    } catch (error) {
      logError(error, 'Get Cached Video');
      return null;
    }
  }

  /**
   * Cache trending videos
   */
  static async cacheTrendingVideos(videos: any[], ttl: number = 900): Promise<void> {
    try {
      const key = REDIS_KEYS.TRENDING_VIDEOS;
      await RedisService.setWithExpiry(key, videos, ttl);
    } catch (error) {
      logError(error, 'Cache Trending Videos');
    }
  }

  /**
   * Get cached trending videos
   */
  static async getCachedTrendingVideos(): Promise<any[]> {
    try {
      const key = REDIS_KEYS.TRENDING_VIDEOS;
      const cached = await RedisService.get(key);
      return cached || [];
    } catch (error) {
      logError(error, 'Get Cached Trending Videos');
      return [];
    }
  }

  /**
   * Cache user feed
   */
  static async cacheUserFeed(userId: string, feed: any[], ttl: number = 600): Promise<void> {
    try {
      const key = REDIS_KEYS.USER_FEED(userId);
      await RedisService.setWithExpiry(key, feed, ttl);
    } catch (error) {
      logError(error, 'Cache User Feed');
    }
  }

  /**
   * Get cached user feed
   */
  static async getCachedUserFeed(userId: string): Promise<any[]> {
    try {
      const key = REDIS_KEYS.USER_FEED(userId);
      const cached = await RedisService.get(key);
      return cached || [];
    } catch (error) {
      logError(error, 'Get Cached User Feed');
      return [];
    }
  }

  /**
   * Cache search results
   */
  static async cacheSearchResults(query: string, results: any[], ttl: number = 1800): Promise<void> {
    try {
      const key = REDIS_KEYS.SEARCH_CACHE(query.toLowerCase());
      await RedisService.setWithExpiry(key, results, ttl);
    } catch (error) {
      logError(error, 'Cache Search Results');
    }
  }

  /**
   * Get cached search results
   */
  static async getCachedSearchResults(query: string): Promise<any[]> {
    try {
      const key = REDIS_KEYS.SEARCH_CACHE(query.toLowerCase());
      const cached = await RedisService.get(key);
      return cached || [];
    } catch (error) {
      logError(error, 'Get Cached Search Results');
      return [];
    }
  }

  /**
   * Invalidate user cache
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    try {
      await Promise.all([
        RedisService.delete(REDIS_KEYS.USER_CACHE(userId)),
        RedisService.delete(REDIS_KEYS.USER_FEED(userId)),
        RedisService.delete(REDIS_KEYS.RECOMMENDED_VIDEOS(userId))
      ]);
    } catch (error) {
      logError(error, 'Invalidate User Cache');
    }
  }

  /**
   * Invalidate video cache
   */
  static async invalidateVideoCache(videoId: string): Promise<void> {
    try {
      await Promise.all([
        RedisService.delete(REDIS_KEYS.VIDEO_DETAILS(videoId)),
        RedisService.delete(REDIS_KEYS.TRENDING_VIDEOS),
        RedisService.clearPattern('feed:*'), // Clear all user feeds
        RedisService.clearPattern('search:*') // Clear search cache
      ]);
    } catch (error) {
      logError(error, 'Invalidate Video Cache');
    }
  }

  /**
   * Cache analytics pages data
   */
  static async cacheAnalyticsPages(cacheKey: string, data: any, ttl: number = 300): Promise<void> {
    try {
      const key = REDIS_KEYS.ANALYTICS_PAGES(cacheKey);
      await RedisService.setWithExpiry(key, data, ttl);
    } catch (error) {
      logError(error, 'Cache Analytics Pages');
    }
  }

  /**
   * Get cached analytics pages data
   */
  static async getCachedAnalyticsPages(cacheKey: string): Promise<any> {
    try {
      const key = REDIS_KEYS.ANALYTICS_PAGES(cacheKey);
      return await RedisService.get(key);
    } catch (error) {
      logError(error, 'Get Cached Analytics Pages');
      return null;
    }
  }

  /**
   * Cache analytics acquisition data
   */
  static async cacheAnalyticsAcquisition(cacheKey: string, data: any, ttl: number = 300): Promise<void> {
    try {
      const key = REDIS_KEYS.ANALYTICS_ACQUISITION(cacheKey);
      await RedisService.setWithExpiry(key, data, ttl);
    } catch (error) {
      logError(error, 'Cache Analytics Acquisition');
    }
  }

  /**
   * Get cached analytics acquisition data
   */
  static async getCachedAnalyticsAcquisition(cacheKey: string): Promise<any> {
    try {
      const key = REDIS_KEYS.ANALYTICS_ACQUISITION(cacheKey);
      return await RedisService.get(key);
    } catch (error) {
      logError(error, 'Get Cached Analytics Acquisition');
      return null;
    }
  }

  /**
   * Invalidate analytics cache
   */
  static async invalidateAnalyticsCache(): Promise<void> {
    try {
      await Promise.all([
        RedisService.clearPattern('analytics:pages:*'),
        RedisService.clearPattern('analytics:acquisition:*')
      ]);
    } catch (error) {
      logError(error, 'Invalidate Analytics Cache');
    }
  }

  /**
   * Clear all cache
   */
  static async clearAllCache(): Promise<void> {
    try {
      await RedisService.clearPattern('cache:*');
    } catch (error) {
      logError(error, 'Clear All Cache');
    }
  }
}