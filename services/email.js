/**
 * @typedef { import("@prisma/client").User } User
 * @typedef { import("@prisma/client").PrismaClient } PrismaClient
 */

import { randomBytes } from 'crypto';
import { prismaClient } from '../data/prisma.js';
import { logger } from '../logging/logger.js';
import { Result } from '../utils/result.js';

/**
 * @summary Sends a new account email to the user.
 * @param {object} params - The options to use.
 * @param {User} params.user - The user to send the email to.
 * @param {string} params.baseUrl - The base URL to use for the link.
 * @param {PrismaClient} [params.client] - The Prisma client to use.
 * @returns {Promise<Result>} The result of the operation.
 */
export async function sendNewAccountEmail({
  user,
  baseUrl,
  client = prismaClient,
}) {
  const MS_PER_SEC = 1000;
  const MS_PER_MIN = 60 * MS_PER_SEC;
  const token = randomBytes(16).toString('base64url');

  await client.passwordToken.create({
    data: {
      expiresAt: Date.now() + 15 * MS_PER_MIN,
      token,
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  const link = `${baseUrl}/set-password?token=${token}`;

  const result = await sendEmail({
    templateId: process.env.NEW_ACCOUNT_EMAIL_TEMPLATE_ID,
    templateParams: {
      to_email: user.email,
      set_password_link: link,
    },
  });

  if (result.status !== 200) {
    logger.error('Failed to send email', {
      status: result.status,
      text: await result.text(),
    });
    return Result.failure(new Error(result.text));
  }

  return Result.success(`Email sent to user: ${user.id}`);
}

/**
 * @summary Sends an email.
 * @param {object} params - The options to use.
 * @param {string} params.templateId - The email template ID.
 * @param {object} params.templateParams - The email template parameters.
 * @returns {Promise<Response>} The result of the operation.
 */
async function sendEmail({ templateId, templateParams }) {
  return await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    body: JSON.stringify({
      service_id: process.env.EMAIL_JS_SERVICE_ID,
      user_id: process.env.EMAIL_JS_PUBLIC_KEY,
      template_id: templateId,
      template_params: templateParams,
      accessToken: process.env.EMAIL_JS_PRIVATE_KEY,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
