// import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { signupSchema } from '@auth/schemes/signup';
import { IAuthDocument, ISignUpData } from '@auth/interfaces/auth.interface';
import { authService } from '@service/db/auth.service';
import { BadRequestError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/heplers';
import { UploadApiResponse } from 'cloudinary';
import { upload } from '@global/helpers/cloudinary-upload';
import { ObjectId } from 'mongodb';

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response):Promise<void> {
    const { username, email, password, avatarColor, avatarImage} = req.body;
    const checkIfUserExit: IAuthDocument = await authService.getUserByUsernameOrEamil(username, email);
    if (checkIfUserExit) {
      throw new BadRequestError('Invalid credentials');
    }

    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId();
    const uId = `${Helpers.generateRandomIntegers(12)}`;
    const authDate: IAuthDocument = SignUp.prototype.signupData({
      _id: authObjectId,
      uId,
      username,
      email,
      password,
      avatarColor
    });

    const result: UploadApiResponse = await upload(avatarImage, `${userObjectId}`, true, true) as UploadApiResponse;
    // https://res.cloudinary.com/123/23reiqej
    // https://res.cloudinary.com/123/439fjemfm
    if(!result?.public_id) {
      throw new BadRequestError('File upload Error accurred. Try again')
    }
  }

  private signupData(data: ISignUpData): IAuthDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id,
      uId,
      username: Helpers.firstletterUppercase(username),
      email: Helpers.lowerCase(email),
      password,
      avatarColor,
      createdAt: new Date()
    } as IAuthDocument;
  }
}
