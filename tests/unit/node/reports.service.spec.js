import fs from 'fs';
import { reportsService } from '../../../services/reports.js';

jest.mock('fs');

describe('reportService', () => {
  const reportNames = [
    '1626355200000-prod-pass-ci-1-1',
    '1626355200000-prod-pass-ci-1-2-PR_1',
  ];

  fs.readdirSync.mockReturnValue(reportNames);

  test('it should have a getReports function', () => {
    expect(reportsService.getReports).toBeDefined();
  });

  describe('getReports', () => {
    test('it should return an array of reports', () => {
      const reports = reportsService.getReports();

      expect(reports).toEqual([
        {
          date: 1626355200000,
          environment: 'prod',
          status: 'pass',
          path: '1626355200000-prod-pass-ci-1-2-PR_1',
          workflow: 'ci',
          number: '1',
          attempt: '2',
          pr: 'PR_1',
        },
        {
          date: 1626355200000,
          environment: 'prod',
          status: 'pass',
          path: '1626355200000-prod-pass-ci-1-1',
          workflow: 'ci',
          number: '1',
          attempt: '1',
          pr: undefined,
        },
      ]);
    });
  });
});
