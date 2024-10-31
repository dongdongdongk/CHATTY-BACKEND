import { BaseCache } from '@service/redis/base.caches';
import { IUserDocument } from '@user/interfaces/user.interface';
import { config } from '@root/config';
import Logger from 'bunyan';
import { ServerError } from '@global/helpers/error-handler';

const log: Logger = config.createLogger('redisConnection');

export class UserCache extends BaseCache {
  constructor() {
    super('userCache');
  }

  public async saveUserToCache(key: string, userUId: string, createdUser: IUserDocument): Promise<void> {
    const createdAt = new Date();
    const {
      _id,
      uId,
      username,
      email,
      avatarColor,
      blocked,
      blockedBy,
      postsCount,
      profilePicture,
      followersCount,
      followingCount,
      notifications,
      work,
      location,
      school,
      quote,
      bgImageId,
      bgImageVersion,
      social
    } = createdUser;

    const firstList: string[] = [
      '_id',
      `${_id}`,
      'uId',
      `${uId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'avatarColor',
      `${avatarColor}`,
      'createdAt',
      `${createdAt}`,
      'postsCount',
      `${postsCount}`
    ];
    const secondList: string[] = [
      'blocked',
      JSON.stringify(blocked),
      'blockedBy',
      JSON.stringify(blockedBy),
      'profilePicture',
      `${profilePicture}`,
      'followersCount',
      `${followersCount}`,
      'followingCount',
      `${followingCount}`,
      'notifications',
      JSON.stringify(notifications),
      'social',
      JSON.stringify(social)
    ];

    const thirdList: string[] = [
      'work',
      `${work}`,
      'location',
      `${location}`,
      'school',
      `${school}`,
      'quote',
      `${quote}`,
      'avatarColor',
      `${avatarColor}`,
      'bgImageVersion',
      `${bgImageVersion}`,
      'bgImageId',
      `${bgImageId}`
    ];
    const dataToSave: string[] = [...firstList, ...secondList, ...thirdList];

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.ZADD('user', { score: parseInt(userUId, 10), value: `${key}` });
      for (let i = 0; i < dataToSave.length; i += 2) {
        // dataToSave[i]는 키(필드이름), dataToSave[i + 1]는 값
        // 예: i가 0일 때 => HSET('users:key', '_id', '123')
        //     i가 2일 때 => HSET('users:key', 'username', 'john')
        await this.client.HSET(`users:${key}`, dataToSave[i], dataToSave[i + 1]);
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
