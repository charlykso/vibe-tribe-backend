import Redis from 'ioredis';

// Redis client for caching
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Redis key prefixes
export const REDIS_PREFIX = {
  OAUTH_STATE: 'oauth:state:',
  OAUTH_TOKENS: 'oauth:tokens:',
  OAUTH_AUDIT: 'oauth:audit:',
  OAUTH_USED_STATES: 'oauth:used_states:',
  RATE_LIMIT: 'rate:limit:'
};

// Handle Redis connection events
redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

redis.on('ready', () => {
  console.log('✅ Redis client ready');
});

// Helper function to get a namespaced key
export function getRedisKey(prefix: string, key: string): string {
  return `${prefix}${key}`;
}

// Helper function to set a key with expiration
export async function setWithExpiry(key: string, value: any, expiresInSeconds: number): Promise<void> {
  await redis.setex(key, expiresInSeconds, JSON.stringify(value));
}

// Helper function to get and parse a key
export async function getAndParse<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

// Helper function to delete a key
export async function deleteKey(key: string): Promise<void> {
  await redis.del(key);
} 