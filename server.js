import { PrismaClient } from '@prisma/client';
import { createApp } from './app.js';
import { logger } from './logging/logger.js';

const PORT = process.env.PORT || 3000;
const context = new PrismaClient();
const app = createApp({ context });

app.listen(PORT, () => {
  logger.info(`Listening on port ${PORT}`);
});
