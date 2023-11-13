import express from 'express';

/**
 * @summary Gets the index view.
 * @param {express.Request} req The request object
 * @param {express.Response} res The response object
 * @returns {void}
 */
export function getIndexView(req, res) {
  res.render('pages/index', {
    title: 'QA Playwright Reports',
  });
}
