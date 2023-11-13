import express from 'express';
import configureCsrf from 'tiny-csrf';

export const csrf = configureCsrf(process.env.CSRF_SECRET, [
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

/**
 * @summary Generates a CSRF token for GET requests.
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * @param {express.NextFunction} next - The next middleware function.
 * @returns {void}
 */
export function generateCsrfToken(req, res, next) {
  if (req.method === 'GET') {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
}
