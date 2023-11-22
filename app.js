import cookieParser from 'cookie-parser';
import 'dotenv/config';
import express from 'express';
import passport from 'passport';
import path from 'path';
import { csrf } from './auth/csrf.js';
import {
  deserializeUser,
  localStrategy,
  serializeUser,
} from './auth/passport.js';
import { session } from './auth/session.js';
import * as authController from './controllers/auth.js';
import * as homeController from './controllers/home.js';
import * as reportsController from './controllers/reports.js';
import { clientErrorHandler } from './errors/client.js';
import { errorHandler, notFoundHandler } from './errors/server.js';
import { logErrors } from './logging/logger.js';
import { morgan } from './logging/morgan.js';

const app = express();

app.use(morgan);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(session);

app.use(csrf);

passport.use(localStrategy);
passport.deserializeUser(deserializeUser);
passport.serializeUser(serializeUser);
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.use((req, res, next) => {
  if (req.session.csrfToken === undefined && req.method === 'GET') {
    req.session.csrfToken = req.csrfToken();
  }

  res.locals.csrfToken = req.session.csrfToken;
  res.locals.user = req.user;
  next();
});

app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.get('/login', authController.ensureAnonymous, authController.getLoginView);
app.post('/login', authController.ensureAnonymous, authController.login);

app.get(
  '/',
  authController.ensureAuthenticated,
  authController.ensureAuthorized('user'),
  homeController.getIndexView
);

app.post('/logout', authController.ensureAuthenticated, authController.logout);

app.get(
  '/register',
  authController.ensureAuthenticated,
  authController.ensureAuthorized('admin'),
  authController.getRegisterView
);

app.post(
  '/register',
  authController.ensureAuthenticated,
  authController.ensureAuthorized('admin'),
  authController.register
);

app.get('/set-password', authController.getSetPasswordView);
app.post('/set-password', authController.setPassword);

app.get('/forgot-password', authController.getForgotPasswordView);
app.post('/forgot-password', authController.forgotPassword);

app.use(
  '/reports/:name',
  authController.ensureAuthenticated,
  authController.ensureAuthorized('user'),
  reportsController.getReport
);

app.use(
  '/reports',
  authController.ensureAuthenticated,
  authController.ensureAuthorized('user'),
  homeController.getIndexView
);

app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);
app.use(notFoundHandler);

export { app };
