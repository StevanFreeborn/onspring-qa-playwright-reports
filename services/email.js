/**
 * @typedef { import("@prisma/client").User } User
 * @typedef { import("@prisma/client").PrismaClient } PrismaClient
 */

import { randomBytes } from 'crypto';
import { logger } from '../logging/logger.js';
import { Result } from '../utils/result.js';

/**
 * @summary The email service.
 */
export const emailService = {
  /**
   * @summary Sends a new account email to the user.
   * @param {object} params The options to use.
   * @param {User} params.user The user to send the email to.
   * @param {string} params.baseUrl The base URL to use for the link.
   * @param {PrismaClient} params.context The Prisma client to use.
   * @returns {Promise<Result>} The result of the operation.
   */
  async sendNewAccountEmail({ user, baseUrl, context }) {
    const MS_PER_SEC = 1000;
    const MS_PER_MIN = 60 * MS_PER_SEC;
    const token = randomBytes(16).toString('base64url');

    await context.passwordToken.create({
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

    const result = await this.send({
      templateId: process.env.NEW_ACCOUNT_EMAIL_TEMPLATE_ID,
      templateParams: {
        to_email: user.email,
        set_password_link: link,
      },
    });

    if (result.status !== 200) {
      const resultText = await result.text();
      logger.error('Failed to send email', {
        status: result.status,
        text: resultText,
      });
      return Result.failure(new Error(resultText));
    }

    return Result.success(`Email sent to user: ${user.id}`);
  },

  /**
   * @summary Sends a forgot password email to the user.
   * @param {object} params The options to use.
   * @param {User} params.user The user to send the email to.
   * @param {string} params.baseUrl The base URL to use for the link.
   * @param {PrismaClient} params.context The Prisma client to use.
   * @returns {Promise<Result>} The result of the operation.
   */
  async sendForgotPasswordEmail({ user, baseUrl, context }) {
    const MS_PER_SEC = 1000;
    const MS_PER_MIN = 60 * MS_PER_SEC;
    const token = randomBytes(16).toString('base64url');

    await context.passwordToken.create({
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

    const result = await this.send({
      templateId: process.env.FORGOT_PASSWORD_EMAIL_TEMPLATE_ID,
      templateParams: {
        to_email: user.email,
        set_password_link: link,
      },
    });

    if (result.status !== 200) {
      const resultTest = await result.text();
      logger.error('Failed to send email', {
        status: result.status,
        text: resultTest,
      });
      return Result.failure(new Error(resultTest));
    }

    return Result.success(`Email sent to user: ${user.id}`);
  },

  /**
   * @summary Sends an email.
   * @param {object} params The options to use.
   * @param {string} params.templateId The email template ID.
   * @param {object} params.templateParams The email template parameters.
   * @returns {Promise<Response>} The result of the operation.
   */
  async send({ templateId, templateParams }) {
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
  },
};
