import express from 'express';

/**
 * @summary Handles errors for non-AJAX requests.
 * @param {Error} error - The error that was thrown.
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * @param {express.NextFunction} next - The next middleware function.
 * @returns {void}
 */
export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).render('pages/error500', { title: 'Error' });
}
