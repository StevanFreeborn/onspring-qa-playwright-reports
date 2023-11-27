import bcrypt from 'bcrypt';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

/**
 * @summary Creates a local strategy for passport.
 * @param {object} params The params to use for creating the local strategy
 * @param {import('.prisma/client').PrismaClient} params.context The prisma context
 * @returns {LocalStrategy} The local strategy
 */
export function createLocalStrategy({ context }) {
  return new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async function (email, password, done) {
      try {
        const user = await context.user.findUnique({
          where: {
            email,
          },
        });

        if (user === null) {
          return done(null, false, { message: 'Invalid username or password' });
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.passwordHash
        );

        if (isPasswordValid === false) {
          return done(null, false, { message: 'Invalid username or password' });
        }

        return done(null, user);
      } catch (error) {
        done(error);
      }
    }
  );
}

/**
 * @summary Creates a deserialize user function for passport.
 * @param {object} params The params to use for creating the deserialize user function
 * @param {import('.prisma/client').PrismaClient} params.context The prisma context
 * @returns {passport.DeserializeUserFunction} The deserialize user function
 */
export function createDeserializeUser({ context }) {
  return async function (id, done) {
    try {
      const user = await context.user.findUnique({
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
  };
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
