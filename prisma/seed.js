import { PrismaClient } from '@prisma/client';
import { logger } from '../logging/logger.js';
const prisma = new PrismaClient();

/**
 * @summary Add roles to the database if they don't exist.
 * @returns {Promise<void>}
 */
async function addRoles() {
  const roles = ['admin', 'user'];

  for (const role of roles) {
    const existingRole = await prisma.role.findUnique({
      where: {
        name: role,
      },
    });

    if (existingRole === null) {
      await prisma.role.create({
        data: {
          name: role,
        },
      });
    }
  }
}

async function updateUsersWithUserRole() {
  const users = await prisma.user.findMany();
  const role = await prisma.role.findUnique({
    where: {
      name: 'user',
    },
  });

  if (role === null) {
    throw new Error('Could not user find role');
  }

  for (const user of users) {
    if (user === null) continue;

    await prisma.userRoles.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });
  }
}

/**
 * @summary Seed the database.
 * @returns {Promise<void>}
 */
async function seed() {
  await addRoles();
  await updateUsersWithUserRole();
}

seed()
  .then(() => {
    logger.info('Database seeded successfully');
    process.exit(0);
  })
  .catch(error => {
    logger.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
