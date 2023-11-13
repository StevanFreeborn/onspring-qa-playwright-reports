import configureMorgan from 'morgan';
import { logger } from './logger.js';

const stream = {
  write: message => logger.http(message.trim()),
};

export const morgan = configureMorgan('tiny', { stream });
