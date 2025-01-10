import { Request, Response } from 'express';
import { PostCache } from '@service/redis/post.cache';
import HTTP_STATUS from 'http-status-codes';
import { postQueue } from '@service/queues/post.queue';
import { socketIOPostObject } from '@socket/post';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { postSchema, postWithImageSchema } from '@post/schemes/post.schemes';
import { IPostDocument } from '@post/interfaces/post.interface';
import { BadRequestError } from '@global/helpers/error-handler';
import { upload } from '@global/helpers/cloudinary-upload';
import { UploadApiResponse } from 'cloudinary';

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
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPost });
    res.status(HTTP_STATUS.OK).json({ message: 'Post updated successfully' });
  }

  @joiValidation(postWithImageSchema)
  public async postWithImage(req: Request, res: Response): Promise<void> {
    try {
      const { imgId, imgVersion } = req.body;
      if (imgId && imgVersion) {
        await Update.prototype.updatedPostWithImage(req);
      } else {
        const result: UploadApiResponse = await Update.prototype.addImageToExistingPost(req);
        if (!result?.public_id) {
          throw new BadRequestError('Image upload failed');
        }
      }
      res.status(HTTP_STATUS.OK).json({ message: 'Post with image updated successfully' });
    } catch (error) {
      if (error instanceof BadRequestError) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Server error occurred' });
      }
    }
  }

  private async updatedPostWithImage(req: Request): Promise<void> {
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
    postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPost });
  }

  private async addImageToExistingPost(req: Request): Promise<UploadApiResponse> {
    const { post, bgColor, feelings, privacy, gifUrl, profilePicture, image } = req.body;
    const { postId } = req.params;

    if (!image) {
      throw new BadRequestError('Image is required');
    }

    try {
      // 이미지 업로드 시도
      const result = await upload(image);

      // 업로드 결과 검증
      if (!result?.public_id || !result?.version) {
        throw new BadRequestError('Image upload failed');
      }

      try {
        // 포스트 업데이트 관련 작업
        const updatedPost: IPostDocument = {
          post,
          bgColor,
          feelings,
          privacy,
          gifUrl,
          profilePicture,
          imgId: result.public_id,
          imgVersion: result.version.toString()
        } as IPostDocument;

        // 캐시 업데이트
        const postUpdated: IPostDocument = await postCache.updatePostInCache(postId, updatedPost);
        if (!postUpdated) {
          throw new BadRequestError('Failed to update post in cache');
        }

        // 소켓 이벤트 발생 및 큐 작업 추가
        socketIOPostObject.emit('update post', postUpdated, 'posts');
        postQueue.addPostJob('updatePostInDB', { key: postId, value: updatedPost });

        return result as UploadApiResponse;
      } catch (error) {
        const err = error as Error;
        throw new BadRequestError(err.message || 'Failed to update post');
      }
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new BadRequestError('Image upload process failed');
    }
  }
}
