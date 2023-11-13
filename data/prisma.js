/**
 * @typedef { import("@prisma/client").User } User
 */

import { PrismaClient } from '@prisma/client';

export const prismaClient = new PrismaClient();
