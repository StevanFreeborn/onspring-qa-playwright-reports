import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { createApp } from './app.js';
import { logger } from './logging/logger.js';

const PORT = process.env.PORT || 3000;
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const context = new PrismaClient({ adapter });
const app = createApp({ context });

app.listen(PORT, () => {
  logger.info(`Listening on port ${PORT}`);
});
