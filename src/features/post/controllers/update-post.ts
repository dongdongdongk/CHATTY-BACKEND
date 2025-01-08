import { Request, Response } from 'express';
import { PostCache } from '@service/redis/post.cache';
import HTTP_STATUS from 'http-status-codes';
import { postQueue } from '@service/queues/post.queue';
import { socketIOPostObject } from '@socket/post';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { postSchema } from '@post/schemes/post.schemes';
import { IPostDocument } from '@post/interfaces/post.interface';

const postCache: PostCache = new PostCache();

export class Update {
  @joiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void> {
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture } = req.body;
    const { postId } = req.params;
    const updatedPost: IPostDocument = {
      post, 
      bgColor, 
      feelings, 
      privacy, 
      gifUrl, 
      imgVersion, 
      imgId, 
      profilePicture
    } as IPostDocument;
    const postUpdated = await postCache.updatePostInCache(postId, updatedPost);
    socketIOPostObject.emit('update post', postUpdated, 'posts');
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPost});
    res.status(HTTP_STATUS.OK).json({ message: 'Post update successfully'});
  }
}
