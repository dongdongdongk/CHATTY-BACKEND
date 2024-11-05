import { Request, Response } from 'express';
import { UserCache } from '@service/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';

const userCache: UserCache = new UserCache();

export class CurrentUser {
  public async read(req: Request, res:Response): Promise<void> {
    let isUser = false;
    let token = null;
    let user = null;
    const cashUser: IUserDocument = await userCache.getUserFromCache();
  }
}
