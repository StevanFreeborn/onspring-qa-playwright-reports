import express from 'express';
import { reportsService } from '../services/reports.js';

/**
 * @summary Gets the index view.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @returns {void}
 */
export function getIndexView(req, res) {
  const reports = reportsService.getReports();
  const statuses = reports
    .map(report => {
      const status = report.status;
      return status[0].toUpperCase() + status.slice(1).toLowerCase();
    })
    .filter((value, index, self) => self.indexOf(value) === index)
    .filter(Boolean);
  const workflows = reports
    .map(report => report.workflow)
    .filter((value, index, self) => self.indexOf(value) === index)
    .filter(Boolean);

  const environments = reports
    .map(report => report.environment)
    .filter((value, index, self) => self.indexOf(value) === index)
    .filter(Boolean);

  res.render('pages/index', {
    title: 'QA Playwright Reports',
    styles: ['index'],
    scripts: ['index'],
    reports: reports,
    statuses: statuses,
    workflows: workflows,
    environments: environments,
  });
}

/**
 * @summary Checks the status of the app.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @returns {void}
 */
export function checkStatus(req, res) {
  return res.json({ message: 'pong' });
}
