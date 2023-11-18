import * as emailService from '@/services/email.js';
import { jest } from '@jest/globals';

global.fetch = jest.fn();

describe('email service', () => {
  const env = process.env;

  beforeAll(() => {
    jest.resetModules();
    process.env = { ...env };
  });

  afterAll(() => {
    process.env = env;
  });

  describe('send', () => {
    it('should sent a POST request with correct parameters', async () => {
      process.env.EMAIL_JS_SERVICE_ID = 'service_id';
      process.env.EMAIL_JS_PUBLIC_KEY = 'public_key';
      process.env.EMAIL_JS_PRIVATE_KEY = 'private_key';

      const mockResponse = { ok: true };
      const params = {
        templateId: 'template_id',
        templateParams: { param1: 'value1' },
      };

      fetch.mockResolvedValue(mockResponse);

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
});
