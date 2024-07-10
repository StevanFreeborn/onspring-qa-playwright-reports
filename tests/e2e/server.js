/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { createApp } from '../../app.js';
import { seedDatabase } from './utils.js';
import path from 'path';
import { rm } from 'fs/promises';
import { existsSync } from 'fs';

run().catch(error => {
  console.error(error);
  process.exit(1);
});

/**
 * @summary This function is used to setup the database and start the server for end to end testing.
 */
async function run() {
  const sqliteFilePath = path.join(process.cwd(), 'db', 'e2e-test.db');

  if (existsSync(sqliteFilePath)) {
    await rm(sqliteFilePath);
  }

  const connectionString = `file:${sqliteFilePath}`;

  console.log('Running migrations');
  execSync(`cross-env DATABASE_URL=${connectionString} prisma migrate deploy`);
  console.log('Migrations ran');

  const context = new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });

  console.log('Seeding database');
  await seedDatabase(context);
  console.log('Seeded database');

  console.log('Starting server');
  const app = createApp({ context });
  const server = app.listen(5000, () => {
    console.log('Server started. Listening on port 5000');
  });

  ['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'].forEach(event =>
    process.on(event, () => {
      console.log('Closing server');
      server.close();
    })
  );
}
