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

  return res
    .status(500)
    .render('pages/error500', { title: 'Error', styles: ['error'] });
}

/**
 * @summary Handles errors for undefined routes.
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * @returns {void}
 */
export function notFoundHandler(req, res) {
  if (req.xhr) {
    return res.status(404).send({ error: 'Not found' });
  }

  return res
    .status(404)
    .render('pages/error404', { title: 'Not Found', styles: ['error'] });
}
