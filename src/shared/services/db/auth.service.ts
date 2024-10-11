import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { AuthModel } from '@auth/models/auth.schema';
import { Helpers } from '@global/helpers/heplers';

class AuthService {
  public async getUserByUsernameOrEamil(username: string, email: string): Promise<IAuthDocument> {
    const query = {
      $or: [{username: Helpers.firstletterUppercase(username)},{ email: Helpers.lowerCase(email)}]
    };
    const user: IAuthDocument = await AuthModel.findOne(query).exec() as IAuthDocument;
    return user;
  }
}

export const authService: AuthService = new AuthService();
