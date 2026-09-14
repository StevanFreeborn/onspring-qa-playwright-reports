import fs from 'fs';
import { reportsService } from '../../../services/reports.js';
import { jest } from '@jest/globals';

describe('reportService', () => {
  const reportNames = [
    '1626355200000-prod-pass-ci-1-1',
    '1626355200000-prod-pass-ci-1-2-PR_1',
  ];

  beforeEach(() => {
    // Both existsSync and readdirSync must be mocked
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readdirSync').mockReturnValue(reportNames);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('it should have a getReports function', () => {
    expect(reportsService.getReports).toBeDefined();
  });

  describe('getReports', () => {
    test('it should return an empty array if reportDir does not exist', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const reports = reportsService.getReports();

      expect(reports).toEqual([]);
    });

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
