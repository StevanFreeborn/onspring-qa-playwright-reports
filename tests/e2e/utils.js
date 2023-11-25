import fs from 'fs';

/**
 * @summary Saves the accessibility scan results and attaches to the test report
 * @param {import('@playwright/test').TestInfo} testInfo The test info
 * @param {import('axe-core').Result} results The accessibility scan results
 * @returns {Promise<void>}
 */
export async function saveAccessibilityResultsToReport(testInfo, results) {
  const jsonString = JSON.stringify(results, null, 2);
  const attachmentPath = `${testInfo.outputPath()}/accessibility_scan_results.json`;

  fs.writeFileSync(attachmentPath, jsonString);

  await testInfo.attach('accessibility_scan_results.json', {
    name: 'Accessibility scan results',
    path: attachmentPath,
    contentType: 'application/json',
  });
}
