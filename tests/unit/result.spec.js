import { Result } from '@/utils/result.js';

describe('result', () => {
  test('it should contain a success function', () => {
    expect(Result.success).toBeDefined();
    expect(typeof Result.success).toBe('function');
  });

  test('it should contain a failure function', () => {
    expect(Result.failure).toBeDefined();
    expect(typeof Result.failure).toBe('function');
  });

  describe('success', () => {
    test('it should take one argument', () => {
      expect(Result.success.length).toBe(1);
    });

    test('it should return a successful result with the provided value', () => {
      const value = 'value';
      const result = Result.success(value);

      expect(result.isFailed).toBe(false);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(value);
    });
  });
  describe('failure', () => {
    test('it should return a failed result with provided error', () => {
      const error = new Error('error');
      const result = Result.failure(error);

      expect(result.isFailed).toBe(true);
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(error);
    });
  });
});
