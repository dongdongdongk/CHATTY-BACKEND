import { Request, Response } from 'express';
import * as cloudinaryUploads from '@global/helpers/cloudinary-upload';
import { SignUp } from '../signup';
import { CustomError } from '@global/helpers/error-handler';
import { authMock, authMockRequest, authMockResponse } from '@root/mocks/auth.mock';
import { authService } from '@service/db/auth.service';
import { UserCache } from '@service/redis/user.cache';
import { version } from 'joi';

jest.mock('@service/queues/base.queue');
jest.mock('@service/redis/user.cache');
jest.mock('@service/queues/user.queue');
jest.mock('@service/queues/auth.queue');
jest.mock('@global/helpers/cloudinary-upload');


describe('SignUp', () => {

  it('should throw an error if username is not available', () => {
    const req: Request = authMockRequest({}, {
      username: '',
      email: 'many@test.com',
      password: 'qwerty',
      avatarColor: 'red',
      avatarImage: 'data:text/dfjakejrk341;base64'
    }) as Request;
    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Username is a required field');
    });
  });

  it('should throw an error if username length is less than minimum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'ma',
        email: 'dhfke@test.com',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/dfjakejrk341;base64'
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid username');
    });
  });

  it('should throw an error if email is not valid', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Many',
        email: 'not vaild',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/dfjakejrk341;base64'
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Email must be valid');
    });
  });

  it('should throw unauthorize error is user already exist', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Many',
        email: 'dhfke@test.com',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/dfjakejrk341;base64'
      }
    ) as Request;
    const res: Response = authMockResponse();

    jest.spyOn(authService, 'getUserByUsernameOrEamil').mockResolvedValue(authMock);
    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid credentials');
    });
  });

  it('should set session data for valid credentials and send correct json response',async () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Many',
        email: 'dhfke@test.com',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/dfjakejrk341;base64'
      }
    ) as Request;
    const res: Response = authMockResponse();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(authService, 'getUserByUsernameOrEamil').mockResolvedValue(null as any);
    const userSpy = jest.spyOn(UserCache.prototype, 'saveUserToCache');
    jest.spyOn(cloudinaryUploads, 'upload').mockImplementation((): any => Promise.resolve({
      version: '1234545454', public_id: '123456'
    }));



    await SignUp.prototype.create(req, res);
    console.log(req.session);
    console.log(res.json);
    expect(req.session?.jwt).toBeDefined();
    expect(res.json).toHaveBeenCalledWith({
      message: 'User created successfully',
      user: userSpy.mock.calls[0][2],
      token: req.session?.jwt
    });

  });
});
