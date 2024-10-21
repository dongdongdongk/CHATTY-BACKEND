import Logger from 'bunyan';
import { config } from '@root/config';
import { BaseCache } from '@service/redis/base.caches';

const log: Logger = config.createLogger('redisConnection');

class RedisConnection extends BaseCache {
  constructor() {
    super('redisConnection');
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      const res = await this.client.ping();
      console.log(res,'redis');
    } catch (error) {
      log.error(error);
    }
  }
}

export const redisConnection: RedisConnection = new RedisConnection();