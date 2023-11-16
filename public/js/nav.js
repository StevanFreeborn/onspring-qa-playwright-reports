document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('logout').addEventListener('click', logOutUser);
  document.getElementById('toggle').addEventListener('click', toggleNav);

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
      window.location.href = response.url;
    }
  }

  /**
   * @summary Toggle the navigation menu
   */
  function toggleNav() {
    const nav = document.querySelector('.right-header');
    nav.classList.toggle('show');
  }
});
