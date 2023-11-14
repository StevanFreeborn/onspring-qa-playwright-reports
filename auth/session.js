import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import configureSession from 'express-session';
import { prismaClient } from '../data/prisma.js';

export const session = configureSession({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
  },
  store: new PrismaSessionStore(prismaClient, {
    checkPeriod: 2 * 60 * 1000,
    dbRecordIdIsSessionId: true,
    dbRecordIdFunction: undefined,
  }),
});
