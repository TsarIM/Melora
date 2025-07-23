import redisClient from '../db/redisClient.js';

// Helper function to generate cache keys
const generateCacheKey = (req) => {
  const userId = req.user?.userId || 'anonymous';
  const baseUrl = req.baseUrl;
  const path = req.path;
  const query = JSON.stringify(req.query);
  
  return `api_cache:${baseUrl}${path}:${userId}:${query}`;
};

// Cache middleware for GET requests
export const cacheMiddleware = (ttl = 300) => { // Default 5 minutes TTL
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = generateCacheKey(req);
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        console.log(`📦 Cache hit for key: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      console.log(`🔍 Cache miss for key: ${cacheKey}`);

      // Store original res.json function
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function(data) {
        // Cache only successful responses (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setEx(cacheKey, ttl, JSON.stringify(data))
            .catch(err => console.error('Cache set error:', err));
        }

        // Call original res.json
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Continue without caching if Redis fails
      next();
    }
  };
};

// Cache invalidation helper
export const invalidateCache = async (patterns) => {
  try {
    for (const pattern of patterns) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`🗑️ Invalidated ${keys.length} cache entries for pattern: ${pattern}`);
      }
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

// Helper to invalidate user-specific caches
export const invalidateUserCache = async (userId) => {
  const patterns = [
    `api_cache:/api/recordings:${userId}:*`,
    `api_cache:/api/recordings/public:*:*`
  ];
  await invalidateCache(patterns);
};

// Helper to invalidate public feed cache
export const invalidatePublicCache = async () => {
  const patterns = [
    `api_cache:/api/recordings/public:*:*`
  ];
  await invalidateCache(patterns);
};
