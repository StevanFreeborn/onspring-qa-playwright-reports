import express from 'express';
import * as reportsService from '../services/reports.js';

/**
 * @summary Gets the index view.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @returns {void}
 */
export function getIndexView(req, res) {
  const reports = reportsService.getReportNames();
  res.render('pages/index', {
    title: 'QA Playwright Reports',
    csrfToken: req.csrfToken(),
    styles: ['index'],
    reports: reports,
  });
}
