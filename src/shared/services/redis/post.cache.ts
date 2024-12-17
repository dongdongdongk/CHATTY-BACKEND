import { BaseCache } from '@service/redis/base.caches';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { IPostDocument, ISavePostToCache } from '@post/interfaces/post.interface';
import { Helpers } from '@global/helpers/heplers';

const log: Logger = config.createLogger('postCache');

export class PostCache extends BaseCache {
  constructor() {
    super('postCache');
  }

  public async savePostToCache(data: ISavePostToCache): Promise<void> {
    const { key, currentUserId, uId, createdPost } = data;
    const {
      _id,
      userId,
      username,
      email,
      avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount,
      imgVersion,
      imgId,
      // videoId,
      // videoVersion,
      reactions,
      createdAt
    } = createdPost;

    const firstList: string[] = [
      '_id',
      `${_id}`,
      'userId',
      `${userId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'avatarColor',
      `${avatarColor}`,
      'profilePicture',
      `${profilePicture}`,
      'post',
      `${post}`,
      'bgColor',
      `${bgColor}`,
      'feelings',
      `${feelings}`,
      'privacy',
      `${privacy}`,
      'gifUrl',
      `${gifUrl}`
    ];

    const secondList: string[] = [
      'commentsCount',
      `${commentsCount}`,
      'reactions',
      JSON.stringify(reactions),
      'imgVersion',
      `${imgVersion}`,
      'imgId',
      `${imgId}`,
      'createdAt',
      `${createdAt}`
    ];

    const dataToSave: string[] = [...firstList, ...secondList];

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const postCount: string[] = await this.client.HMGET(`users:${currentUserId}`, 'postsCount');

      // ZADD 명령 실행
      await this.client.ZADD('post', { score: parseInt(uId, 10), value: `${key}` });

      // HSET 명령 실행
      for (let i = 0; i < dataToSave.length; i += 2) {
        // dataToSave[i]는 키(필드 이름), dataToSave[i + 1]는 값
        // 예: i가 0일 때 => HSET('users:key', '_id', '123')
        //     i가 2일 때 => HSET('users:key', 'username', 'john')
        await this.client.HSET(`posts:${key}`, dataToSave[i], dataToSave[i + 1]);
      }

      // postsCount 업데이트
      const count: number = parseInt(postCount[0], 10) + 1;
      await this.client.HSET(`users:${currentUserId}`, 'postsCount', count);
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getPostFromCashe(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const reply: string[] = await this.client.ZRANGE(key, start, end, {REV : true}); 
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for( const value of reply) {
        multi.HGETALL(`post${value}`);
      }
      const replies:any = await multi.exec();
      const postReplies: IPostDocument[] = [];
      for(const post of replies as IPostDocument[]) {
        post.commentsCount = Helpers.parseJson(`${post}`)
      }
      return [];

    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
