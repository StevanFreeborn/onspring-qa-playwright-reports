const { sessionStore } = require('../../auth/session.js');

afterAll(async () => {
  await sessionStore.shutdown();
});
