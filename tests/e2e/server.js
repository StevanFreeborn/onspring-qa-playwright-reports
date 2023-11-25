/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { createApp } from '../../app.js';

run().catch(error => {
  console.error(error);
  process.exit(1);
});

/**
 * @summary This function is used to setup the database and start the server for end to end testing.
 */
async function run() {
  console.log('Starting container');
  const container = await new PostgreSqlContainer().start();
  console.log('Container started');

  const connectionString = container.getConnectionUri();

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
  // TODO: Seed test data
  // need to see admin and user roles
  // need to seed user with admin and user role
  // need to seed user with user role
  // need to seed user with no roles
  console.log('Seeded database');

  console.log('Starting server');
  const app = createApp({ context });
  const server = app.listen(5000, () => {
    console.log('Server started. Listening on port 5000');
  });

  server.on('close', async () => {
    console.log('Stopping container');
    await container.stop();
  });

  ['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'].forEach(event =>
    process.on(event, () => {
      console.log('Closing server');
      server.close();
    })
  );
}
