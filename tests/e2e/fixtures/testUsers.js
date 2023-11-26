import bcrypt from 'bcrypt';

const testPassword = 'password';
export const hashedTestPassword = bcrypt.hashSync(testPassword, 10);

export const testRole = {
  admin: {
    id: 0,
    name: 'admin',
  },
  user: {
    id: 0,
    name: 'user',
  },
};

export const testUser = {
  withNoRole: {
    email: 'test.user@norole.com',
    password: testPassword,
    roles: [],
  },
  withUserRole: {
    email: 'test.user@userrole.com',
    password: testPassword,
    roles: [testRole.user.name],
  },
  withAdminRole: {
    email: 'test.user@adminrole.com',
    password: testPassword,
    roles: [testRole.user.name, testRole.admin.name],
  },
};
