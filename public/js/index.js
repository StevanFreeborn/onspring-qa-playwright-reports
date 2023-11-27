/**
 * @summary Event handler for the index view
 */
export const eventHandler = {
  /**
   * @summary Converts all report dates from server rendered UTC values to local time
   * @returns {void}
   */
  convertDatesFromUtcToLocal() {
    const dates = [...document.querySelectorAll('[data-date-in-ms]')];
    for (const date of dates) {
      const dateInMs = parseInt(date.dataset.dateInMs);
      const localDateString = new Date(parseInt(dateInMs)).toLocaleString();
      date.textContent = localDateString;
    }
  },
};

document.addEventListener(
  'DOMContentLoaded',
  eventHandler.convertDatesFromUtcToLocal
);
