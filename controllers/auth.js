import bcrypt from 'bcrypt';
import express from 'express';
import passport from 'passport';
import { prismaClient } from '../data/prisma.js';

/**
 * GET /
 * Home page.
 * @param req {express.Request}
 * @param res {express.Response}
 * @returns void
 */
export function getLoginView(req, res) {
  const { messages } = req.session;
  const error = messages ? messages[0] : '';
  res.render('pages/login', { title: 'Login', error: error });
}

/**
 * POST /logout
 * Logs the user out.
 * @param req {express.Request}
 * @param res {express.Response}
 * @param next {express.NextFunction}
 * @returns void
 */
export function logout(req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }

    res.redirect('/login');
  });
}

/**
 * POST /login
 * Logs the user in.
 * @param req {express.Request}
 * @param res {express.Response}
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
 * @param req {express.Request}
 * @param res {express.Response}
 * @returns void
 */
export function getRegisterView(req, res) {
  const { messages } = req.session;
  const error = messages ? messages[0] : '';
  res.render('pages/register', { title: 'Register', error: error });
}

/**
 * POST /register
 * Registers a new user.
 * @param req {express.Request}
 * @param res {express.Response}
 * @returns void
 */
export async function register(req, res) {
  const { email, password, verifyPassword } = req.body;

  const existingUser = await prismaClient.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser !== null) {
    req.session.messages = ['User already exists'];
    return res.redirect('/register');
  }

  if (password !== verifyPassword) {
    req.session.messages = ['Passwords do not match'];
    return res.redirect('/register');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prismaClient.user.create({
    data: {
      email,
      passwordHash,
    },
  });

  res.redirect('/');
}

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 * @returns
 */
export const redirectUnauthenticatedUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};
