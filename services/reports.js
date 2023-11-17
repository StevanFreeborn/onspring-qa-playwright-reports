import fs from 'fs';

/**
 * @typedef {object} Report A report.
 * @property {number} date The date the report was published to the site in ms according to UTC.
 * @property {string} environment The environment the report was generated in.
 * @property {string} status The status of the report.
 */

/**
 * @summary Gets the test reports.
 * @returns {Array<Report>} The test reports.
 */
export function getReports() {
  // report directory names contain the following pieces
  // of information in order listed delimited by "-"
  // + {date in ms}
  // + {environment}
  // + {status}
  // + {github workflow name}
  // + {github workflow run number}
  // + {github workflow run attempt}
  // + {pull request identifier} (only present if run on a pull request)
  //   i.e. PR_{pull request number}
  // this is currently enforced by the test CI workflow
  // maybe we use database in future?
  const reportNames = fs.readdirSync('./reports');
  const reports = reportNames.map(reportName => {
    const [
      date,
      environment,
      status,
      workflowName,
      runNumber,
      runAttempt,
      prId,
    ] = reportName.split('-');
    return {
      date: parseInt(date),
      environment,
      status,
      path: reportName,
      workflowName,
      runNumber,
      runAttempt,
      prId,
    };
  });

  return reports.reverse();
}
