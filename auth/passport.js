import bcrypt from 'bcrypt';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { prismaClient } from '../data/prisma.js';

/**
 * Configures the local strategy for use by Passport.
 */
export const localStrategy = new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  verify
);

/**
 * Verifies the user's credentials and calls the done callback with the user if
 * the credentials are valid. Otherwise, calls the done callback with false.
 * @param {string} email
 * @param {string} password
 * @param {passport.DoneCallback} done
 * @returns {Promise<void>}
 */
export async function verify(email, password, done) {
  const user = await prismaClient.user.findUnique({
    where: {
      email,
    },
  });

  if (user === null) {
    return done(null, false);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (isPasswordValid === false) {
    return done(null, false, { message: 'Invalid username or password' });
  }

  return done(null, user);
}

/**
 * Serializes the user by calling the done callback with the user's id.
 * @param {import('.prisma/client').User} user
 * @param {passport.DoneCallback} done
 * @returns {Promise<void>}
 */
export async function serializeUser(user, done) {
  return done(null, user.id);
}

/**
 * Deserializes the user by looking up the user by the id and calling the done
 * callback with the user if the user exists. Otherwise, calls the done callback
 * with false.
 * @param {string} id
 * @param {passport.DoneCallback} done
 * @returns {Promise<void>}
 */
export async function deserializeUser(id, done) {
  const user = await prismaClient.user.findUnique({
    where: {
      id,
    },
  });

  if (user === null) {
    return done(null, false);
  }

  return done(null, user);
}
