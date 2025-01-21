import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { IReactionDocument, IReactionJob } from '@reaction/interfaces/reaction.interface';
import { addReactionSchema } from '@reaction/schemes/reactions';
import { reactionQueue } from '@service/queues/reaction.queue';
import { ReactionCache } from '@service/redis/reaction.cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';

const reactionCache: ReactionCache = new ReactionCache();

export class Add { 
  @joiValidation(addReactionSchema)
  public async reaction(req: Request, res: Response): Promise<void> {
    const { userTo, postId, type, previousReaction, postReactions, profilePicture} = req.body;
    const reactionObject: IReactionDocument = {
      _id: new ObjectId(),
      postId,
      type,
      avataColor: req.currentUser!.avatarColor,
      username: req.currentUser!.username,
      profilePicture
    } as IReactionDocument;

    await reactionCache.savePostReactionToCache(postId, reactionObject, postReactions, type, previousReaction);

    const databaseReaction: IReactionJob = {
      postId,
      userTo,
      userFrom: req.currentUser!.userId,
      username: req.currentUser!.username,
      type,
      previousReaction,
      reactionObject,
    };

    reactionQueue.addReactionJob('addReactionToDB', databaseReaction);
    res.status(HTTP_STATUS.OK).json({message: 'Reaction added successfully'});
  }
}
