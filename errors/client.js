import express from 'express';

/**
 * @summary Handles errors for AJAX requests.
 * @param {Error} error - The error that was thrown.
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * @param {express.NextFunction} next - The next middleware function.
 * @returns {void}
 */
export function clientErrorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (req.accepts('json')) {
    return res.status(500).send({ error: 'An unexpected error has occurred' });
  }

  return next(error);
}
