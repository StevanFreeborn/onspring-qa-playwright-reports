// This file contains code form this package:
// https://github.com/valexandersaulys/tiny-csrf
// I have rewrote it slightly to fit my style mostly.
// With the main functional change being that the
// CSRF token is verified on all the desired methods
// but is not invalidated and regenerated allowing
// me to generate it once on the server when the
// session is created and then use it for the
// lifetime of the session. Per session CSRF tokens
// is acceptable according to OWASP and avoids issues
// with multiple tabs and back buttons.

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
} from 'crypto';
import express from 'express';

const ALGORITHM = 'aes-256-cbc';
const secret = process.env.CSRF_SECRET;

/**
 * @summary Tiny CSRF middleware
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @param {express.NextFunction} next The next function
 * @returns {void}
 */
export function csrf(req, res, next) {
  if (!req.cookies || !res.cookie || !req.signedCookies) {
    throw new Error('No cookie middleware is installed');
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) === false) {
    req.csrfToken = () => {
      const csrfToken = randomUUID();

      res.cookie('csrfToken', encryptCookie(csrfToken, secret), {
        httpOnly: true,
        sameSite: 'strict',
        signed: true,
      });

      return csrfToken;
    };

    return next();
  }

  const { csrfToken } = req.signedCookies;

  const isTokenValid =
    csrfToken != undefined && verifyCsrf(req.body?._csrf, csrfToken, secret);

  if (isTokenValid === false) {
    throw new Error(
      `Did not get a valid CSRF token for '${req.method} ${req.originalUrl}': ${req.body?._csrf} v. ${csrfToken}`
    );
  }

  return next();
}

/**
 * @summary Encrypt a cookie using AES 256 bits
 * @param {string} cookie the cookie we want to encrypt. Will be visible as plain string to client.
 * @param {string} _secret the secret that will be stored server-side. Client will never see this.
 * @returns {string} the encrypted cookie
 */
function encryptCookie(cookie, _secret) {
  const iv = randomBytes(16);
  const _cipher = createCipheriv(ALGORITHM, Buffer.from(_secret), iv);
  const encrypted = [
    iv.toString('hex'),
    ':',
    _cipher.update(cookie, 'utf8', 'hex'),
    _cipher.final('hex'),
  ];
  return encrypted.join('');
}

/**
 * @summary Decrypt a cookie using AES 256 bits
 * @param {string} cookie the cookie we want to encrypt. Will be visible as plain string to client.
 * @param {string} _secret the secret that will be stored server-side. Client will never see this.
 * @returns {string} the decrypted cookie
 */
function decryptCookie(cookie, _secret) {
  const _encryptedArray = cookie.split(':');
  if (_encryptedArray.length != 2) throw new Error('bad decrypt');
  const iv = Buffer.from(_encryptedArray[0], 'hex');
  const encrypted = Buffer.from(_encryptedArray[1], 'hex');
  const decipher = createDecipheriv(ALGORITHM, _secret, iv);
  const decrypted =
    decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  return decrypted;
}

/**
 * Verify a CSRF token
 * @param {string} requestCsrf the CSRF coming from client side
 * @param {string} cookieCsrf the CSRF as stored in the user's cookies
 * @param {string} _secret the string used to encrypt the CSRF in the first place.
 * @returns {boolean} whether the CSRF token is valid
 */
function verifyCsrf(requestCsrf, cookieCsrf, _secret) {
  try {
    const decryptedCookie = decryptCookie(cookieCsrf, _secret);
    return decryptedCookie === requestCsrf;
  } catch (err) {
    return false;
  }
}
