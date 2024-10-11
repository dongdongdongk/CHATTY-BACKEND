// import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { signupSchema } from '@auth/schemes/signup';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { authService } from '@service/db/auth.service';
import { BadRequestError } from '@global/helpers/error-handler';

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response):Promise<void> {
    const { username, email, password, avatarColor, avatarImage} = req.body;
    const checkIfUserExit: IAuthDocument = await authService.getUserByUsernameOrEamil(username, email);
    if (checkIfUserExit) {
      throw new BadRequestError('Invalid credentials');
    }
  }
}
