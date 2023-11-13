import configureCsrf from 'tiny-csrf';

export const csrf = configureCsrf(process.env.CSRF_SECRET, [
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);
