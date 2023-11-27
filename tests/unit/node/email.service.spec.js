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
  const mockContext = {
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
      jest.spyOn(global, 'fetch').mockReturnValue(mockResponse);

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

  test('it should have a sendNewAccountEmail function', () => {
    expect(emailService.sendNewAccountEmail).toBeDefined();
  });

  test('it should have a sendForgotPasswordEmail function', () => {
    expect(emailService.sendForgotPasswordEmail).toBeDefined();
  });

  test('it should have a send function', () => {
    expect(emailService.send).toBeDefined();
  });

  describe('sendNewAccountEmail', () => {
    test('it should create a password token when called', async () => {
      const mockNow = 1234567890;

      jest
        .spyOn(emailService, 'send')
        .mockImplementation(() => Promise.resolve(mockSuccessfulSendResponse));

      jest.spyOn(Date, 'now').mockReturnValue(mockNow);

      await emailService.sendNewAccountEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        context: mockContext,
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
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    test('it should send an email when called using the new account template', async () => {
      jest
        .spyOn(emailService, 'send')
        .mockImplementation(() => Promise.resolve(mockSuccessfulSendResponse));

      await emailService.sendNewAccountEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        context: mockContext,
      });

      expect(emailService.send).toHaveBeenCalledWith({
        templateId: 'new_account_template_id',
        templateParams: {
          to_email: mockUser.email,
          set_password_link: `${mockBaseUrl}/set-password?token=${mockToken}`,
        },
      });
      expect(emailService.send).toHaveBeenCalledTimes(1);
    });

    test('it should return an error if the email fails to send', async () => {
      jest
        .spyOn(emailService, 'send')
        .mockImplementation(() =>
          Promise.resolve(mockUnsuccessfulSendResponse)
        );

      const result = await emailService.sendNewAccountEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        context: mockContext,
      });

      expect(result.error.message).toBe('Oh no');
      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(logger.error).toHaveBeenCalled();
      expect(emailService.send).toHaveBeenCalledTimes(1);
    });

    test('it should return a success message if the email sends successfully', async () => {
      jest
        .spyOn(emailService, 'send')
        .mockImplementation(() => Promise.resolve(mockSuccessfulSendResponse));

      const result = await emailService.sendNewAccountEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        context: mockContext,
      });

      expect(result.value).toBe(`Email sent to user: ${mockUser.id}`);
      expect(result.isFailed).toBe(false);
      expect(result.isSuccess).toBe(true);
      expect(emailService.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendForgotPasswordEmail', () => {
    test('it should create a password token when called', async () => {
      const mockNow = 1234567890;

      jest
        .spyOn(emailService, 'send')
        .mockImplementation(() => Promise.resolve(mockSuccessfulSendResponse));

      jest.spyOn(Date, 'now').mockReturnValue(mockNow);

      await emailService.sendForgotPasswordEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        context: mockContext,
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
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    test('it should send an email when called using the forgot password template', async () => {
      jest
        .spyOn(emailService, 'send')
        .mockImplementation(() => Promise.resolve(mockSuccessfulSendResponse));

      await emailService.sendForgotPasswordEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        context: mockContext,
      });

      expect(emailService.send).toHaveBeenCalledWith({
        templateId: 'forgot_password_template_id',
        templateParams: {
          to_email: mockUser.email,
          set_password_link: `${mockBaseUrl}/set-password?token=${mockToken}`,
        },
      });
      expect(emailService.send).toHaveBeenCalledTimes(1);
    });

    test('it should return an error if the email fails to send', async () => {
      jest
        .spyOn(emailService, 'send')
        .mockImplementation(() =>
          Promise.resolve(mockUnsuccessfulSendResponse)
        );

      const result = await emailService.sendForgotPasswordEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        context: mockContext,
      });

      expect(result.error.message).toBe('Oh no');
      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(emailService.send).toHaveBeenCalledTimes(1);
    });

    test('it should return a success message if the email sends successfully', async () => {
      jest
        .spyOn(emailService, 'send')
        .mockImplementation(() => Promise.resolve(mockSuccessfulSendResponse));

      const result = await emailService.sendForgotPasswordEmail({
        user: mockUser,
        baseUrl: mockBaseUrl,
        context: mockContext,
      });

      expect(result.value).toBe(`Email sent to user: ${mockUser.id}`);
      expect(result.isFailed).toBe(false);
      expect(result.isSuccess).toBe(true);
      expect(emailService.send).toHaveBeenCalledTimes(1);
    });
  });
});
