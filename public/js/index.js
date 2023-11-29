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
  filters: {
    env: document.getElementById('envFilter'),
    status: document.getElementById('statusFilter'),
    workflow: document.getElementById('workflowFilter'),
    startDate: document.getElementById('startDateFilter'),
    endDate: document.getElementById('endDateFilter'),
  },
  handleFilterChange() {
    const reports = [...document.querySelectorAll('.test-file-test')];

    reports.forEach(report => {
      const env = report.dataset.environment.toLowerCase();
      const status = report.dataset.status.toLowerCase();
      const workflow = report.dataset.workflow.toLowerCase();
      const date = parseInt(report.dataset.date);

      const envFilter = this.filters.env.value.toLowerCase();
      const statusFilter = this.filters.status.value.toLowerCase();
      const workflowFilter = this.filters.workflow.value.toLowerCase();
      const startDateFilter = this.filters.startDate.value;
      const endDateFilter = this.filters.endDate.value;

      const envFilterMatch = envFilter === 'all' || env === envFilter;

      const statusFilterMatch =
        statusFilter === 'all' || status === statusFilter;

      const workflowFilterMatch =
        workflowFilter === 'all' || workflow === workflowFilter;

      const startDateFilterMatch =
        startDateFilter === '' || date >= new Date(startDateFilter).getTime();

      const endDateFilterMatch =
        endDateFilter === '' || date <= new Date(endDateFilter).getTime();

      const showReport =
        envFilterMatch &&
        statusFilterMatch &&
        workflowFilterMatch &&
        startDateFilterMatch &&
        endDateFilterMatch;

      if (showReport) {
        return report.classList.remove('hidden');
      }

      return report.classList.add('hidden');
    });
  },
  addFilterEventListeners() {
    Object.values(this.filters).forEach(filter => {
      if (filter) {
        filter.addEventListener('change', () => this.handleFilterChange());
      }
    });
  },
  clearFilters() {
    Object.values(this.filters).forEach(filter => {
      if (filter.tagName === 'INPUT') {
        return (filter.value = '');
      }

      if (filter.tagName === 'SELECT') {
        return (filter.value = 'all');
      }
    });

    this.handleFilterChange();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  eventHandler.convertDatesFromUtcToLocal();
  eventHandler.addFilterEventListeners();

  const clearFilterButton = document.getElementById('clearFiltersButton');

  if (clearFilterButton) {
    clearFilterButton.addEventListener('click', () => {
      eventHandler.clearFilters();
    });
  }
});
