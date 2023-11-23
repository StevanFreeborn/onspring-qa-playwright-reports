import { sessionStore } from '../../auth/session.js';

afterAll(async () => {
  await sessionStore.shutdown();
});
