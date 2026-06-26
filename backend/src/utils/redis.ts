import { RedisService, REDIS_KEYS } from '../config/redis';

/**
 * Utility functions for common Redis operations
 */

/**
 * Track video view
 */
export const trackVideoView = async (videoId: string, userId?: string): Promise<void> => {
  const viewKey = REDIS_KEYS.VIDEO_VIEWS(videoId);
  const today = new Date().toISOString().split('T')[0];
  const dailyViewKey = REDIS_KEYS.DAILY_VIEWS(today);
  
  await Promise.all([
    RedisService.increment(viewKey),
    RedisService.increment(dailyViewKey),
    userId ? RedisService.addToSet(`${viewKey}:users`, userId) : Promise.resolve()
  ]);
};

/**
 * Track video like
 */
export const trackVideoLike = async (videoId: string, userId: string, isLike: boolean): Promise<void> => {
  const likeKey = REDIS_KEYS.VIDEO_LIKES(videoId);
  
  if (isLike) {
    await RedisService.addToSet(likeKey, userId);
  } else {
    await RedisService.removeFromSet(likeKey, userId);
  }
};

/**
 * Get video engagement stats
 */
export const getVideoEngagementStats = async (videoId: string): Promise<{
  views: number;
  likes: number;
  uniqueViewers: number;
}> => {
  const viewKey = REDIS_KEYS.VIDEO_VIEWS(videoId);
  const likeKey = REDIS_KEYS.VIDEO_LIKES(videoId);
  
  const [views, likes, uniqueViewers] = await Promise.all([
    RedisService.get(viewKey) || 0,
    RedisService.getSetMembers(likeKey).then(members => members.length),
    RedisService.getSetMembers(`${viewKey}:users`).then(members => members.length)
  ]);
  
  return { views, likes, uniqueViewers };
};

/**
 * Update trending hashtags
 */
export const updateTrendingHashtags = async (hashtags: string[]): Promise<void> => {
  const trendingKey = REDIS_KEYS.POPULAR_HASHTAGS;
  
  for (const hashtag of hashtags) {
    await RedisService.addToSortedSet(trendingKey, Date.now(), hashtag);
  }
  
  const allHashtags = await RedisService.getSortedSetRange(trendingKey, 0, -1);
  if (allHashtags.length > 100) {
    await RedisService.getSortedSetRange(trendingKey, 0, allHashtags.length - 101);
  }
};

/**
 * Get trending hashtags
 */
export const getTrendingHashtags = async (limit: number = 20): Promise<string[]> => {
  const trendingKey = REDIS_KEYS.POPULAR_HASHTAGS;
  return RedisService.getSortedSetRange(trendingKey, -limit, -1);
};

/**
 * Cache user notification count
 */
export const updateNotificationCount = async (userId: string, count: number): Promise<void> => {
  const countKey = REDIS_KEYS.UNREAD_COUNT(userId);
  await RedisService.setWithExpiry(countKey, count, 3600);
};

/**
 * Get cached notification count
 */
export const getNotificationCount = async (userId: string): Promise<number> => {
  const countKey = REDIS_KEYS.UNREAD_COUNT(userId);
  return (await RedisService.get(countKey)) || 0;
};

/**
 * Add to processing queue
 */
export const addToProcessingQueue = async (queueName: string, data: any): Promise<void> => {
  await RedisService.pushToList(queueName, JSON.stringify(data));
};

/**
 * Get from processing queue
 */
export const getFromProcessingQueue = async (queueName: string, count: number = 1): Promise<any[]> => {
  const items = await RedisService.getListRange(queueName, 0, count - 1);
  return items.map(item => JSON.parse(item));
};

/**
 * Track user activity
 */
export const trackUserActivity = async (userId: string, activity: string): Promise<void> => {
  const activityKey = `user:activity:${userId}`;
  const timestamp = Date.now();
  
  await RedisService.addToSortedSet(activityKey, timestamp, activity);
  
  const activities = await RedisService.getSortedSetRange(activityKey, 0, -1);
  if (activities.length > 100) {
    await RedisService.getSortedSetRange(activityKey, -100, -1);
  }
};