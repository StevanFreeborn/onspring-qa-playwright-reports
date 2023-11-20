/**
 * @template T The type of the value of the result
 * @typedef {object} Result A result
 * @property {boolean} isFailed Indicates whether the result is a failure
 * @property {boolean} isSuccess Indicates whether the result is a success
 * @property {Error} error The error of the result
 * @property {T} value The value of the result
 */

/**
 * @template T The type of the value of the result
 * @typedef {object} SuccessResult A successful result
 * @property {false} isFailed Indicates whether the result is a failure
 * @property {true} isSuccess Indicates whether the result is a success
 * @property {T} value The value of the result
 */

/**
 * @typedef {object} FailureResult A failed result
 * @property {true} isFailed Indicates whether the result is a failure
 * @property {false} isSuccess Indicates whether the result is a success
 * @property {Error} error The error of the result
 */

export const Result = {
  /**
   * @summary Creates a successful result.
   * @template T The type of the value of the result
   * @param {T} value The value of the result
   * @returns {SuccessResult<T>} A successful result
   */
  success(value) {
    return {
      isFailed: false,
      isSuccess: true,
      value,
    };
  },

  /**
   * @summary Creates a failed result.
   * @param {Error} error The error of the result
   * @returns {FailureResult} A failed result
   */
  failure(error) {
    return {
      isFailed: true,
      isSuccess: false,
      error,
    };
  },
};
