import fs from 'fs';
import {
  hashedTestPassword,
  testRole,
  testUser,
} from './fixtures/testUsers.js';

/**
 * @summary Saves the accessibility scan results and attaches to the test report
 * @param {import('@playwright/test').TestInfo} testInfo The test info
 * @param {import('axe-core').Result} results The accessibility scan results
 * @returns {Promise<void>}
 */
export async function saveAccessibilityResultsToReport(testInfo, results) {
  const jsonString = JSON.stringify(results, null, 2);
  const attachmentPath = `${testInfo.outputPath()}/accessibility_scan_results.json`;

  fs.writeFileSync(attachmentPath, jsonString);

  await testInfo.attach('accessibility_scan_results.json', {
    name: 'Accessibility scan results',
    path: attachmentPath,
    contentType: 'application/json',
  });
}

/**
 * @summary Seeds the database with test data.
 * @param {import('.prisma/client').PrismaClient} context The prisma client
 * @returns {Promise<void>} A promise that resolves when the operation is complete
 */
export async function seedDatabase(context) {
  for (const role of Object.values(testRole)) {
    await context.role.create({
      data: {
        name: role.name,
      },
    });
  }

  for (const user of Object.values(testUser)) {
    await context.user.create({
      data: {
        email: user.email,
        passwordHash: hashedTestPassword,
        userRoles: {
          create: user.roles.map(role => ({
            role: {
              connect: {
                name: role,
              },
            },
          })),
        },
      },
    });
  }
}
