import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import csurf from 'tiny-csrf';
import {
  deserializeUser,
  localStrategy,
  serializeUser,
} from './auth/passport.js';
import * as authController from './controllers/auth.js';
import * as homeController from './controllers/home.js';
import { prismaClient } from './data/prisma.js';
import { logger } from './logging/logger.js';
import { morgan } from './logging/morgan.js';

const app = express();

app.use(morgan);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
    },
    store: new PrismaSessionStore(prismaClient, {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

app.use(csurf(process.env.CSRF_SECRET, ['POST', 'PUT', 'PATCH', 'DELETE']));
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
});

passport.use(localStrategy);
passport.deserializeUser(deserializeUser);
passport.serializeUser(serializeUser);

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs', {
  strict: false,
});
app.set('views', path.join(process.cwd(), 'views'));

app.get('/login', authController.getLoginView);
app.post('/login', authController.login);

app.use(authController.redirectUnauthenticatedUser);

app.get('/', homeController.getIndexView);
app.post('/logout', authController.logout);

app.get('/register', authController.getRegisterView);
app.post('/register', authController.register);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Listening on port ${PORT}`);
});
