import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import configureSession from 'express-session';
// import { prismaClient } from '../data/prisma.js';

// export const sessionStore = new PrismaSessionStore(prismaClient, {
//   checkPeriod: 2 * 60 * 1000,
//   dbRecordIdIsSessionId: true,
//   dbRecordIdFunction: undefined,
// });

export let sessionStore;

export function createSession({ context }) {
  sessionStore = new PrismaSessionStore(context, {
    checkPeriod: 2 * 60 * 1000,
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
    },
    store: sessionStore,
  });
}

// export const session = configureSession({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: false,
//   proxy: process.env.NODE_ENV === 'production',
//   cookie: {
//     secure: process.env.NODE_ENV === 'production', // HTTPS only in production,
//     sameSite: 'lax',
//     httpOnly: true,
//   },
//   store: sessionStore,
// });
