import express from 'express';
import { check, matchedData, validationResult } from 'express-validator';
import passport from 'passport';
import * as usersService from '../services/users.js';

/**
 * @summary Gets the login view.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @returns {void}
 */
export function getLoginView(req, res) {
  return res.render('pages/login', {
    title: 'Login',
    styles: ['login'],
  });
}

/**
 * @summary Redirects user to correct page after successful authentication.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @param {express.NextFunction} next The next function
 * @returns {void}
 */
export async function login(req, res, next) {
  try {
    const { redirect } = req.query;

    await Promise.all([
      check('email', 'Email is required').notEmpty().escape().run(req),
      check('password', 'Password is required').notEmpty().escape().run(req),
    ]);

    const errors = validationResult(req)
      .formatWith(err => ({ type: 'error', text: err.msg }))
      .array();

    if (errors.length > 0) {
      return res.status(400).render('pages/login', {
        title: 'Login',
        styles: ['login'],
        formData: {
          email: req.body.email,
          password: req.body.password,
        },
        errors: errors,
      });
    }

    passport.authenticate('local', function (err, user, info) {
      if (err) {
        return next(err);
      }

      if (!user) {
        errors.push(info.message);
        return res.status(400).render('pages/login', {
          title: 'Login',
          styles: ['login'],
          formData: {
            email: req.body.email,
            password: req.body.password,
          },
          errors: errors,
        });
      }

      req.logIn(user, function (err) {
        if (err) {
          return next(err);
        }

        return res.redirect(redirect || '/');
      });
    })(req, res, next);
  } catch (error) {
    next(error);
  }
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
 * GET /register
 * Gets the register view.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @returns {void}
 */
export function getRegisterView(req, res) {
  return res.render('pages/register', {
    title: 'Register',
    styles: ['register'],
  });
}

/**
 * @summary Registers a new user.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @param {express.NextFunction} next The next function
 * @returns {void}
 */
export async function register(req, res, next) {
  try {
    req.session.messages = [];

    await Promise.all([
      check('email', 'Email is required and should be a valid email')
        .notEmpty()
        .isEmail()
        .escape()
        .run(req),
      check(
        'password',
        'Password is required and should contain at least 8 characters, 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol'
      )
        .notEmpty()
        .isStrongPassword({
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
        })
        .escape()
        .run(req),
      check('verifyPassword', 'Verify password is required')
        .notEmpty()
        .escape()
        .run(req),
    ]);

    const errors = validationResult(req)
      .formatWith(err => ({ type: 'error', text: err.msg }))
      .array();

    if (errors.length > 0) {
      req.session.messages = errors;
      return res.redirect('/register');
    }

    const { email, password, verifyPassword } = matchedData(req);

    const result = await usersService.registerUser({
      email,
      password,
      verifyPassword,
    });

    if (result.isFailed) {
      req.session.messages = [
        {
          type: 'error',
          text: result.error.message,
        },
      ];
      return res.redirect('/register');
    }

    req.session.messages = [
      {
        type: 'success',
        text: 'User registered successfully',
      },
    ];

    return res.redirect('/register');
  } catch (error) {
    return next(error);
  }
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
 * @summary Ensures that the user has the correct access based on given role.
 * @param {string} role The role to check for
 * @returns {Function} The middleware function
 */
export function ensureAuthorized(role) {
  return function (req, res, next) {
    if (req.user.roles.includes(role)) {
      return next();
    }

    if (req.xhr) {
      return res.status(403).send({ error: 'Forbidden' });
    }

    return res.status(403).render('pages/error403', {
      title: 'Forbidden',
      styles: ['error'],
    });
  };
}

/**
 * @summary Ensures that the user is authenticated.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @param {express.NextFunction} next The next function
 * @returns {void}
 */
export function ensureAnonymous(req, res, next) {
  if (
    req.isAuthenticated() === false ||
    req.user.roles.includes('user') === false
  ) {
    return next();
  }

  return res.redirect('/');
}
