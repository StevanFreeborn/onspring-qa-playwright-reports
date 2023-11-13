import express from 'express';
import passport from 'passport';
import * as userService from '../services/user.js';

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
 * @summary Authenticates the user.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @returns void
 */
export const login = passport.authenticate('local', {
  failureRedirect: '/login',
  successRedirect: '/',
  failureFlash: true,
  failureMessage: 'Invalid username or password.',
});

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

  const result = await userService.registerUser(
    email,
    password,
    verifyPassword
  );

  if (result.isFailed) {
    req.session.messages = [result.error.message];
    return res.redirect('/register');
  }

  return res.redirect('/');
}

/**
 * @summary Ensures that the user is authenticated.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @param {express.NextFunction} next The next function
 * @returns {void}
 */
export const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  if (req.xhr) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  return res.redirect('/login');
};
