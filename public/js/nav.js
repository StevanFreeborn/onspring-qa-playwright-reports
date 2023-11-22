/**
 * @summary Event handler for the navigation menu
 */
export const eventHandler = {
  /**
   * @summary Log out a user
   * @returns {Promise<void>}
   */
  async logOutUser() {
    const response = await fetch('/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        _csrf: this.getCsrfToken(),
      }),
    });

    if (response.redirected) {
      return (window.location.href = response.url);
    }

    return alert('We were unable to log you out. Please try again.');
  },
  /**
   * @summary Toggle the navigation menu
   * @returns {boolean} Whether the navigation menu is shown
   */
  toggleNav() {
    const nav = document.querySelector('.right-header');
    return nav.classList.toggle('show');
  },
  /**
   * @summary Retrieve the CSRF token from the page
   * @returns {string} The CSRF token
   */
  getCsrfToken() {
    return document
      .querySelector('meta[name="csrf-token"]')
      .getAttribute('content');
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const logoutButton = document.getElementById('logout');
  const toggleButton = document.getElementById('toggle');

  if (logoutButton) {
    logoutButton.addEventListener('click', eventHandler.logOutUser);
  }

  if (toggleButton) {
    toggleButton.addEventListener('click', eventHandler.toggleNav);
  }
});
