document.addEventListener('DOMContentLoaded', () => {
  convertDatesFromUtcToLocal();

  /**
   * @summary Converts all report dates from server rendered UTC values to local time
   * @returns {void}
   */
  function convertDatesFromUtcToLocal() {
    const dates = [...document.querySelectorAll('[data-date-in-ms]')];
    for (const date of dates) {
      date.textContent = 'Converting to local time...';
      const dateInMs = parseInt(date.dataset.dateInMs);
      const localDateString = new Date(parseInt(dateInMs)).toLocaleString();
      date.textContent = localDateString;
    }
  }
});
