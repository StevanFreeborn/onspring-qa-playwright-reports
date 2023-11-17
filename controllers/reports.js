import ejs from 'ejs';
import express from 'express';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';

/**
 * @summary Get a report
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next middleware function
 * @returns {void}
 */
export async function getReport(req, res, next) {
  try {
    const reportDir = path.join(process.cwd(), 'reports', req.params.name);
    const reportFile = path.join(reportDir, req.path);

    if (fs.existsSync(reportDir) === false) {
      return next();
    }

    if (req.path === '/') {
      const modifiedReport = await modifyReport(reportDir);
      return res.send(modifiedReport);
    }

    if (fs.existsSync(reportFile)) {
      return res.sendFile(req.path, { root: reportDir });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * @summary Modifies the report view
 * @param {string} reportDir The report directory
 * @returns {Promise<string>} The modified report view
 */
async function modifyReport(reportDir) {
  const reportFilePath = path.join(reportDir, 'index.html');
  const reportFile = fs.readFileSync(reportFilePath, 'utf8');
  const reportDom = new JSDOM(reportFile);

  const modifiedReport = await addHeadPartial(reportDom);

  return modifiedReport.serialize();
}

/**
 * @summary Adds the head partial to the report view
 * @param {JSDOM} reportDom The report DOM
 * @returns {Promise<JSDOM>} The report DOM with the head partial added
 */
async function addHeadPartial(reportDom) {
  const headPath = path.join(process.cwd(), 'views', 'partials', '_head.ejs');
  const headContent = await ejs.renderFile(headPath);
  const dom = reportDom.window.document;
  const head = dom.querySelector('head');
  head.append(new JSDOM(headContent).window.document.querySelector('head'));
  return reportDom;
}
