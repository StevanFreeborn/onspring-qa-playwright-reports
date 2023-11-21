document.addEventListener('DOMContentLoaded', () => {
  const logoutButton = document.getElementById('logout');
  const toggleButton = document.getElementById('toggle');

  if (logoutButton) {
    logoutButton.addEventListener('click', logOutUser);
  }

  if (toggleButton) {
    toggleButton.addEventListener('click', toggleNav);
  }
});

/**
 * @summary Log out a user
 * @returns {Promise<void>}
 */
async function logOutUser() {
  const response = await fetch('/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      _csrf: getCsrfToken,
    }),
  });

  if (response.redirected) {
    return (window.location.href = response.url);
  }

  return alert('We were unable to log you out. Please try again.');
}

/**
 * @summary Toggle the navigation menu
 * @returns {boolean} Whether the navigation menu is shown
 */
function toggleNav() {
  const nav = document.querySelector('.right-header');
  return nav.classList.toggle('show');
}

/**
 * @summary Retrieve the CSRF token from the page
 * @returns {string} The CSRF token
 */
export function getCsrfToken() {
  return document
    .querySelector('meta[name="csrf-token"]')
    .getAttribute('content');
}
