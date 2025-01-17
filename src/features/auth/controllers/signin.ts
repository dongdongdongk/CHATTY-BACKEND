import { Request, Response } from 'express';
import { config } from '@root/config';
import JWT from 'jsonwebtoken';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import HTTP_STATUS from 'http-status-codes';
import { authService } from '@service/db/auth.service';
import { BadRequestError } from '@global/helpers/error-handler';
import { loginSchema } from '@auth/schemes/signin';
import { IAuthDocument } from '@auth/interfaces/auth.interface';

// import { forgotPasswordTemplate } from '@service/emails/templates/forgot-password/forgot-password-template';
// import { emailQueue } from '@service/queues/email.queue';
// import moment from 'moment';
// import publicIP from 'ip';
// import { resetPasswordTemplate } from '@service/emails/templates/reset-password/reset-password-template';
// import { mailTransport } from '@service/emails/mail.transport';

export class SignIn {
  @joiValidation(loginSchema)
  public async read ( req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    const existingUser: IAuthDocument = await authService.getAuthUserByUsername(username);
    if(!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const passwordsMatch: boolean = await existingUser.comparePassword(password);
    if(!passwordsMatch) {
      throw new BadRequestError('Invalid credentials');
    }

    // const user: IUserDocument = await userService.getUserByAuthId(`${existingUser._id}`);


    const userJwt: string = JWT.sign(
      {
        userId: existingUser._id,
        uId: existingUser.uId,
        email: existingUser.email,
        username: existingUser.username,
        avatarColor: existingUser.avatarColor
      },
      config.JWT_TOKEN!
    );
    // 이메일 발송 테스트 await mailTransport.sendEmail('travon.gulgowski89@ethereal.email', 'Test development email', 'This is the test email' );

    // 이메일 발송 테스트 forgotPassword
    // const resetLink = `${config.CLIENT_URL}/reset-password?token=12394012939495`;
    // const template: string = forgotPasswordTemplate.passwordResetTemplate(existingUser.username!, resetLink);
    // emailQueue.addEmailJob('forgotPasswordEmail',{ template, receiverEmail: 'roosevelt.quigley@ethereal.email', subject:'reset email'});
    

    // 리셋 패스워드 
    // const templateParams: IResetPasswordParams = {
    //   username: existingUser.username!,
    //   email: existingUser.email,
    //   ipaddress: publicIP.address(),
    //   date: moment().format('DD/MM/YYYY HH:mm')
    // };
    // const template: string = resetPasswordTemplate.passwordResetTemplate(templateParams);
    // emailQueue.addEmailJob('forgotPasswordEmail',{ template, receiverEmail: 'roosevelt.quigley@ethereal.email', subject:'password reset email'});

    req.session = { jwt: userJwt};
    
    // const userDocument: IUserDocument = {
    //   ...user,
    //   authId: existingUser!._id,
    //   username: existingUser!.username,
    //   email: existingUser!.email,
    //   avatarColor: existingUser!.avatarColor,
    //   uId: existingUser!.uId,
    //   createdAt: existingUser!.createdAt,
    // } as IUserDocument;
    
    res.status(HTTP_STATUS.OK).json({ message: 'User login successfully', user: existingUser, token: userJwt});
  }
}
