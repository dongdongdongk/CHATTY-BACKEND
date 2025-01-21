import { IPostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { IReactionDocument, IReactionJob } from '@reaction/interfaces/reaction.interface';
import { ReactionModel } from '@reaction/models/reaction.schema';
import { UserCache } from '@service/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';

const userCache: UserCache = new UserCache();

class ReactionService {
  public async addReactionDataToDB(reactionData: IReactionJob): Promise<void> {
    const { postId, userTo, userFrom, username, type, previousReaction, reactionObject } = reactionData;
    const updatedReaction: [IUserDocument, IReactionDocument, IPostDocument] = await Promise.all([
      userCache.getUserFromCache(`${userTo}`),
      ReactionModel.findOneAndReplace({ postId, type: previousReaction, username}, reactionObject, { upsert: true}),
      PostModel.findOneAndUpdate(
        { _id: postId },
        {
          $inc: {
            [`reactions.${previousReaction}`]: -1,
            [`reactions.${type}`]: 1
          }
        },
        { new: true }
      )
    ]) as [IUserDocument, IReactionDocument, IPostDocument];
    // send reaciton notification
  }

  public async removeReactionDataFromDB(reacitonData: IReactionJob): Promise<void> {
    const { postId, previousReaction, username } = reacitonData;
    await Promise.all([
      ReactionModel.deleteOne({ postId, type: previousReaction, username}),
      PostModel.updateOne(
        { _id: postId },
        {
            $inc: {
              [`reactions,.${previousReaction}`]: -1
            },
        },
        { new: true }
      )
    ]);
  }
}

export const reactionService: ReactionService = new ReactionService();
