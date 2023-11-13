import express from 'express';

/**
 * GET /
 * Home page.
 * @param req {express.Request}
 * @param res {express.Response}
 * @returns void
 */
export function getIndexView(req, res) {
  res.render('pages/index', { title: 'Express' });
}
