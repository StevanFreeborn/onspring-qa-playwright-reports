import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import configureSession from 'express-session';

/**
 * @type {PrismaSessionStore}
 * @summary The session store for the application. This is used to store session data in the database.
 * It is initialized in the `createSession` function. This is exported so that it can be used in tests.
 */
export let sessionStore;

/**
 * @summary Creates a session middleware for express.
 * @param {object} params The params to use for creating the session middleware
 * @param {import('.prisma/client').PrismaClient} params.context The prisma context
 * @returns {import('express').RequestHandler} The session middleware
 */
export function createSession({ context }) {
  sessionStore = new PrismaSessionStore(context, {
    checkPeriod: 2 * 60 * 1000, // 2 minutes
    dbRecordIdIsSessionId: true,
    dbRecordIdFunction: undefined,
  });

  return configureSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === 'production',
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production,
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000, // 12 hours
    },
    store: sessionStore,
  });
}
