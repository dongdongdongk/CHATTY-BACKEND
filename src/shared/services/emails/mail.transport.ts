import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import Logger from 'bunyan';
import sendGridMail from '@sendgrid/mail';
import { config } from '@root/config';


interface IMailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

const log: Logger = config.createLogger('mailOption');
sendGridMail.setApiKey(config.SENDGRID_API_KEY);

class MailTransport {

  private async developmentEmailSender(receiveEmail: string, subject:string, body: string): Promise<void> {
    
  }
}
