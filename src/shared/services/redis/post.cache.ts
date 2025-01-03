import { BaseCache } from '@service/redis/base.caches';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { IPostDocument, IReactions, ISavePostToCache } from '@post/interfaces/post.interface';
import { Helpers } from '@global/helpers/heplers';
import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';

const log: Logger = config.createLogger('postCache');

export type PostCacheMultiType = string | number | Buffer | RedisCommandRawReply[] | IPostDocument | IPostDocument[];

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
        log.info('Connecting to Redis...');
        await this.client.connect();
      }

      const postCount: string[] = await this.client.HMGET(`users:${currentUserId}`, 'postsCount');
      log.info(`Fetched post count for user ${currentUserId}: ${postCount}`);

      // ZADD 명령 실행
      log.info(`Adding post key ${key} with score ${uId} to sorted set.`);
      await this.client.ZADD('post', { score: parseInt(uId, 10), value: `${key}` });

      // HSET 명령 실행
      for (let i = 0; i < dataToSave.length; i += 2) {
        log.info(`Setting field ${dataToSave[i]} with value ${dataToSave[i + 1]} for key post:${key}`);
        // dataToSave[i]는 키(필드 이름), dataToSave[i + 1]는 값
        // 예: i가 0일 때 => HSET('users:key', '_id', '123')
        //     i가 2일 때 => HSET('users:key', 'username', 'john')
        await this.client.HSET(`posts:${key}`, dataToSave[i], dataToSave[i + 1]);
      }

      // postsCount 업데이트
      const count: number = parseInt(postCount[0], 10) + 1;
      log.info(`Updating posts count for user ${currentUserId}: ${count}`);
      await this.client.HSET(`users:${currentUserId}`, 'postsCount', count);
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getPostFromCashe(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        log.info('Connecting to Redis...');
        await this.client.connect();
      }

      log.info(`Fetching posts from sorted set ${key}, range ${start} to ${end}`);
      const reply: string[] = await this.client.ZRANGE(key, start, end);
      log.info(`ZRANGE result for ${key}: ${reply}`);

      const reversedReply = reply.reverse(); // 역순으로 정렬
      log.info(`Reversed order: ${reversedReply}`);

      const multi = this.client.multi();
      for (const value of reversedReply) {
        log.info(`Fetching hash for post:${value}`);
        multi.HGETALL(`posts:${value}`);
      }

      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      log.info(`Fetched data for posts: ${JSON.stringify(replies)}`);
      const postReplies: IPostDocument[] = [];
      for (const post of replies as IPostDocument[]) {
        post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
        post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
        post.createdAt = Helpers.parseJson(`${post.createdAt}`) as Date;
        postReplies.push(post);
      }
      return postReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getTotalPostsInCashe(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      log.info('Fetching total posts count from sorted set "post"');
      const count: number = await this.client.ZCARD('post');
      log.info(`Total posts count: ${count}`);
      return count;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getPostsWithImagesFromCashe(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      log.info(`Fetching posts from sorted set ${key}, range ${start} to ${end}`);
      const reply: string[] = await this.client.ZRANGE(key, start, end);
      log.info(`ZRANGE result for ${key}: ${reply}`);

      const reversedReply = reply.reverse(); // 역순으로 정렬
      log.info(`Reversed order: ${reversedReply}`);
      const multi = this.client.multi();
      for (const value of reversedReply) {
        log.info(`Fetching hash for post:${value}`);
        multi.HGETALL(`posts:${value}`);
      }

      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postWithImage: IPostDocument[] = [];
      for (const post of replies as IPostDocument[]) {
        if ((post.imgId && post.imgVersion) || post.gifUrl) {
          post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
          post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
          post.createdAt = Helpers.parseJson(`${post.createdAt}`) as Date;
          postWithImage.push(post);
        }
      }
      return postWithImage;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getUserPostFromCashe(key: string, uId: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const reply: string[] = await this.client.ZRANGE(key, uId, uId, { REV: true, BY: 'SCORE' });
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }

      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postReplies: IPostDocument[] = [];
      for (const post of replies as IPostDocument[]) {
        post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
        post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
        post.createdAt = Helpers.parseJson(`${post.createdAt}`) as Date;
        postReplies.push(post);
      }
      return postReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getTotalUserPostsInCashe(uId: number): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const count: number = await this.client.ZCOUNT('post', uId, uId);
      return count;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async deletePostFromCache(key: string, currentUserId:string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const postCount: string[] = await this.client.HMGET(`users:${currentUserId}`, 'postsCount');
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.ZREM('post', `${key}`);
      multi.DEL(`posts:${key}`);
      multi.DEL(`coments:${key}`);
      multi.DEL(`reactions:${key}`);
      const count: number = parseInt(postCount[0], 10) - 1;
      multi.HSET(`users:${currentUserId}`, ['postsCount', count]);
      await multi.exec();

    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
