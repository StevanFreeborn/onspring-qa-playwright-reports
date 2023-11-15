import bcrypt from 'bcrypt';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { prismaClient } from '../data/prisma.js';

/**
 * @summary Configures the passport local strategy.
 */
export const localStrategy = new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  verify
);

/**
 * @summary Verifies the user's credentials and calls the done callback with the user if
 * the credentials are valid. Otherwise, calls the done callback with false.
 * @param {string} email The user's email
 * @param {string} password The user's password
 * @param {passport.DoneCallback} done The done callback
 * @returns {Promise<void>}
 */
export async function verify(email, password, done) {
  try {
    const user = await prismaClient.user.findUnique({
      where: {
        email,
      },
    });

    if (user === null) {
      return done(null, false, { message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (isPasswordValid === false) {
      return done(null, false, { message: 'Invalid username or password' });
    }

    return done(null, user);
  } catch (error) {
    done(error);
  }
}

/**
 * @summary Serializes the user by calling the done callback with the user's id.
 * @param {import('.prisma/client').User} user The user to serialize
 * @param {passport.DoneCallback} done The done callback
 * @returns {Promise<void>}
 */
export async function serializeUser(user, done) {
  try {
    return done(null, user.id);
  } catch (error) {
    return done(error);
  }
}

/**
 * @summary Deserializes the user by looking up the user by the id and calling the done
 * callback with the user if the user exists. Otherwise, calls the done callback
 * with false.
 * @param {string} id The user's id
 * @param {passport.DoneCallback} done The done callback
 * @returns {Promise<void>}
 */
export async function deserializeUser(id, done) {
  try {
    const user = await prismaClient.user.findUnique({
      where: {
        id,
      },
      include: {
        userRoles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (user === null) {
      return done(null, false);
    }

    user.roles = user.userRoles.map(userRole => userRole.role.name);

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}
