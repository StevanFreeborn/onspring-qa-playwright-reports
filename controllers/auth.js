import express from 'express';
import * as usersService from '../services/users.js';

/**
 * @summary Gets the login view.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @returns {void}
 */
export function getLoginView(req, res) {
  const { messages } = req.session;
  const error = messages ? messages[0] : '';
  return res.render('pages/login', {
    title: 'Login',
    styles: ['login'],
    csrfToken: req.csrfToken(),
    error: error,
  });
}

/**
 * @summary Logs the user out.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @param {express.NextFunction} next The next function
 * @returns {void}
 */
export function logout(req, res, next) {
  return req.logout(function (err) {
    if (err) {
      return next(err);
    }

    return res.redirect('/login');
  });
}

/**
 * @summary Redirects user to correct page after successful authentication.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @returns {void}
 */
export function login(req, res) {
  const { redirect } = req.query;
  return res.redirect(redirect || '/');
}
/**
 * GET /register
 * Gets the register view.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @returns {void}
 */
export function getRegisterView(req, res) {
  const { messages } = req.session;
  const error = messages ? messages[0] : '';
  return res.render('pages/register', {
    title: 'Register',
    csrfToken: req.csrfToken(),
    error: error,
  });
}

/**
 * @summary Registers a new user.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @returns {void}
 */
export async function register(req, res) {
  const { email, password, verifyPassword } = req.body;

  const result = await usersService.registerUser({
    email,
    password,
    verifyPassword,
  });

  if (result.isFailed) {
    req.session.messages = [result.error.message];
    return res.redirect('/register');
  }

  req.session.messages = [];
  return res.redirect('/');
}

/**
 * @summary Ensures that the user is authenticated.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @param {express.NextFunction} next The next function
 * @returns {void}
 */
export function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  if (req.xhr) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  if (req.originalUrl !== '/') {
    const redirectUrl = encodeURIComponent(req.originalUrl);
    return res.redirect(`/login?redirect=${redirectUrl}`);
  }

  return res.redirect(`/login`);
}

/**
 * @summary Ensures that the user is authenticated.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @param {express.NextFunction} next The next function
 * @returns {void}
 */
export function ensureAnonymous(req, res, next) {
  if (req.isAuthenticated() === false) {
    return next();
  }

  return res.redirect('/');
}
