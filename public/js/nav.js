document.addEventListener('DOMContentLoaded', () => {
  const logoutButton = document.getElementById('logout');
  const toggleButton = document.getElementById('toggle');

  if (logoutButton) {
    logoutButton.addEventListener('click', logOutUser);
  }

  if (toggleButton) {
    toggleButton.addEventListener('click', toggleNav);
  }

  const csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    .getAttribute('content');

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
        _csrf: csrfToken,
      }),
    });

    if (response.redirected) {
      return (window.location.href = response.url);
    }

    return alert('We were unable to log you out. Please try again.');
  }

  /**
   * @summary Toggle the navigation menu
   */
  function toggleNav() {
    const nav = document.querySelector('.right-header');
    nav.classList.toggle('show');
  }
});
