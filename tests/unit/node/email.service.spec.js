import crypto from 'crypto';
import { logger } from '../../../logging/logger.js';
import { emailService } from '../../../services/email.js';

jest.mock('crypto');

describe('email service', () => {
  const env = process.env;
  const mockToken = 'token';
  const mockUser = {
    id: 'id',
    email: 'email',
  };
  const mockBaseUrl = 'baseUrl';
  const mockCreate = jest.fn();
  const mockPrismaClient = {
    passwordToken: {
      create: mockCreate,
    },
  };
  const mockSuccessfulSendResponse = { status: 200 };
  const mockUnsuccessfulSendResponse = { status: 500, text: () => 'Oh no' };

  beforeAll(() => {
    process.env = { ...env };
  });

  beforeEach(() => {
    process.env.EMAIL_JS_SERVICE_ID = 'service_id';
    process.env.EMAIL_JS_PUBLIC_KEY = 'public_key';
    process.env.EMAIL_JS_PRIVATE_KEY = 'private_key';
    process.env.NEW_ACCOUNT_EMAIL_TEMPLATE_ID = 'new_account_template_id';
    process.env.FORGOT_PASSWORD_EMAIL_TEMPLATE_ID =
      'forgot_password_template_id';
    jest.spyOn(crypto, 'randomBytes').mockReturnValue(mockToken);
    jest.spyOn(logger, 'error').mockImplementation();
  });

  afterAll(() => {
    process.env = env;
  });

  describe('send', () => {
    it('should sent a POST request with correct parameters', async () => {
      const mockResponse = { ok: true };
      const params = {
        templateId: 'template_id',
        templateParams: { param1: 'value1' },
      };
      jest.spyOn(global, 'fetch').mockReturnValueOnce(mockResponse);

      const response = await emailService.send(params);

      expect(response).toBe(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.emailjs.com/api/v1.0/email/send',
        {
          method: 'POST',
          body: JSON.stringify({
            service_id: 'service_id',
            user_id: 'public_key',
            template_id: 'template_id',
            template_params: { param1: 'value1' },
            accessToken: 'private_key',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });
  });

  describe('sendNewAccountEmail', () => {
    test('it should create a password token when called', async () => {
      const mockNow = 1234567890;

      jest
        .spyOn(emailService, 'send')
        .mockImplementationOnce(() =>
          Promise.resolve(mockSuccessfulSendResponse)
        );

      jest.spyOn(Date, 'now').mockReturnValueOnce(mockNow);

      await emailService.sendNewAccountEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        client: mockPrismaClient,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          expiresAt: mockNow + 15 * 60 * 1000,
          token: expect.any(String),
          user: {
            connect: {
              id: mockUser.id,
            },
          },
        },
      });
    });

    test('it should send an email when called using the new account template', () => {
      jest
        .spyOn(emailService, 'send')
        .mockImplementationOnce(() =>
          Promise.resolve(mockSuccessfulSendResponse)
        );

      emailService.sendNewAccountEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        client: mockPrismaClient,
      });

      expect(emailService.send).toHaveBeenCalledWith({
        templateId: 'new_account_template_id',
        templateParams: {
          to_email: mockUser.email,
          set_password_link: `${mockBaseUrl}/set-password?token=${mockToken}`,
        },
      });
    });

    test('it should return an error if the email fails to send', async () => {
      jest
        .spyOn(emailService, 'send')
        .mockImplementationOnce(() =>
          Promise.resolve(mockUnsuccessfulSendResponse)
        );

      const result = await emailService.sendNewAccountEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        client: mockPrismaClient,
      });

      expect(result.error.message).toBe('Oh no');
      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
    });

    test('it should return a success message if the email sends successfully', async () => {
      jest
        .spyOn(emailService, 'send')
        .mockImplementationOnce(() =>
          Promise.resolve(mockSuccessfulSendResponse)
        );

      const result = await emailService.sendNewAccountEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        client: mockPrismaClient,
      });

      expect(result.value).toBe(`Email sent to user: ${mockUser.id}`);
      expect(result.isFailed).toBe(false);
      expect(result.isSuccess).toBe(true);
    });
  });

  describe('sendForgotPasswordEmail', () => {
    test('it should create a password token when called', async () => {
      const mockNow = 1234567890;

      jest
        .spyOn(emailService, 'send')
        .mockImplementationOnce(() =>
          Promise.resolve(mockSuccessfulSendResponse)
        );

      jest.spyOn(Date, 'now').mockReturnValueOnce(mockNow);

      await emailService.sendForgotPasswordEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        client: mockPrismaClient,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          expiresAt: mockNow + 15 * 60 * 1000,
          token: expect.any(String),
          user: {
            connect: {
              id: mockUser.id,
            },
          },
        },
      });
    });

    test('it should send an email when called using the forgot password template', () => {
      jest
        .spyOn(emailService, 'send')
        .mockImplementationOnce(() =>
          Promise.resolve(mockSuccessfulSendResponse)
        );

      emailService.sendForgotPasswordEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        client: mockPrismaClient,
      });

      expect(emailService.send).toHaveBeenCalledWith({
        templateId: 'forgot_password_template_id',
        templateParams: {
          to_email: mockUser.email,
          set_password_link: `${mockBaseUrl}/set-password?token=${mockToken}`,
        },
      });
    });

    test('it should return an error if the email fails to send', async () => {
      jest
        .spyOn(emailService, 'send')
        .mockImplementationOnce(() =>
          Promise.resolve(mockUnsuccessfulSendResponse)
        );

      const result = await emailService.sendForgotPasswordEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        client: mockPrismaClient,
      });

      expect(result.error.message).toBe('Oh no');
      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
    });

    test('it should return a success message if the email sends successfully', async () => {
      jest
        .spyOn(emailService, 'send')
        .mockImplementationOnce(() =>
          Promise.resolve(mockSuccessfulSendResponse)
        );

      const result = await emailService.sendForgotPasswordEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        client: mockPrismaClient,
      });

      expect(result.value).toBe(`Email sent to user: ${mockUser.id}`);
      expect(result.isFailed).toBe(false);
      expect(result.isSuccess).toBe(true);
    });
  });
});
