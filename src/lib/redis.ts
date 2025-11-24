import IORedis from 'ioredis';
import { env } from '../config/env';

export const redisConfig = {
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT, 10),
};

export const redis = new IORedis(redisConfig);
export const redisPub = new IORedis(redisConfig);
export const redisSub = new IORedis(redisConfig);
