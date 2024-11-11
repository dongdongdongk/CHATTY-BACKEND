import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import Logger from 'bunyan';
import sendGridMail from '@sendgrid/mail';
import { config } from '@root/config';
import { BadRequestError } from '@global/helpers/error-handler';

interface IMailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

const log: Logger = config.createLogger('mailOption');
sendGridMail.setApiKey(config.SENDGRID_API_KEY!);

class MailTransport {

  public async sendEmail(receiveEmail: string, subject: string, body: string): Promise<void> {
    if (config.NODE_ENV === 'test' || config.NODE_ENV === 'development') {
      this.developmentEmailSender(receiveEmail, subject, body);
    } else {
      this.productionEmailSender(receiveEmail, subject, body);
    }
  }
  private async developmentEmailSender(receiveEmail: string, subject: string, body: string): Promise<void> {
    const transporter: Mail = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for port 465, false for other ports
      auth: {
        user: config.SENDER_EMAIL!,
        pass: config.SENDER_EMAIL_PASSWORD!
      }
    });

    const mailOption: IMailOptions = {
      from: `Chatty App <${config.SENDER_EMAIL!}`,
      to: receiveEmail,
      subject,
      html: body
    };

    try {
      await transporter.sendMail(mailOption);
      log.info('Development email sent successfully');
    } catch (error) {
      log.error('Error sending email', error);
      throw new BadRequestError('Error sending email');
    }
  }

  private async productionEmailSender(receiveEmail: string, subject: string, body: string): Promise<void> {

    const mailOption: IMailOptions = {
      from: `Chatty App <${config.SENDER_EMAIL!}`,
      to: receiveEmail,
      subject,
      html: body
    };

    try {
      await sendGridMail.send(mailOption);
      log.info('Production email sent successfully');
    } catch (error) {
      log.error('Error sending email', error);
      throw new BadRequestError('Error sending email');
    }
  }
}

export const mailTransport: MailTransport = new MailTransport();
