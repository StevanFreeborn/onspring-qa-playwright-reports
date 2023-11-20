import { emailService } from '../../../services/email.js';

describe('email service', () => {
  test('playground', async () => {
    const spy = jest.spyOn(emailService, 'send').mockReturnValue('mocked');
    const result = await emailService.send();
    expect(result).toBe('mocked');
    expect(spy).toHaveBeenCalled();
  });
});
