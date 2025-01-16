import { BaseCache } from '@service/redis/base.caches';
import { config } from '@root/config';
import Logger from 'bunyan';
import { ServerError } from '@global/helpers/error-handler';
import { IReaction, IReactionDocument } from '@reaction/interfaces/reaction.interface';

const log: Logger = config.createLogger('reactionCache');

export class ReactionCache extends BaseCache {
  constructor() {
    super('reactionCache');
  }

  public async savePostReactionToCache(
    key: string,
    reaction: IReactionDocument,
    postReactions: IReaction,
    type: string,
    previousReaction: string
  ): Promise<void> {
    try {
      if(!this.client.isOpen) {
        await this.client.connect();
      }
      if (previousReaction) {
        // call remove reaction method
      }

      if (type) {
        await this.client.LPUSH(`reactions:${key}`, JSON.stringify(reaction));
        const dataToSave: string[] = ['reaction', JSON.stringify(postReactions)];
        await this.client.HSET(`posts:${key}`, dataToSave);
      }

    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }
}
