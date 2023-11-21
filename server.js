import { app } from './app.js';
import { logger } from './logging/logger.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Listening on port ${PORT}`);
});
