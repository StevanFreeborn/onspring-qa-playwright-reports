import fs from 'fs';

/**
 * @summary Gets the names of the reports.
 * @returns {string[]} The names of the reports.
 */
export function getReportNames() {
  const reportNames = fs.readdirSync('./reports');
  return reportNames.reverse();
}
