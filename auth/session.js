import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import configureSession from 'express-session';
import { prismaClient } from '../data/prisma.js';

export const session = configureSession({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: process.env.NODE_ENV === 'production',
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production,
    sameSite: 'strict',
    httpOnly: true,
  },
  store: new PrismaSessionStore(prismaClient, {
    checkPeriod: 2 * 60 * 1000,
    dbRecordIdIsSessionId: true,
    dbRecordIdFunction: undefined,
  }),
});
