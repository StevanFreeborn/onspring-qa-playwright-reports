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
  res.render('pages/index', {
    title: 'QA Playwright Reports',
    styles: ['index'],
    scripts: ['index'],
    reports: reports,
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
