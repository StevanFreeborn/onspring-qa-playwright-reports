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
    const paths = req.path.split('/');
    let reportFilePath = path.join(process.cwd(), req.path);

    // If the path is /reports/:reportName, redirect to /reports/:reportName/
    // this is so the relative paths in the playwright report work properly
    if (paths.length === 3) {
      return res.redirect(`${req.path}/`);
    }

    // if the path is not a file in the reports directory
    // call next middleware function
    if (fs.existsSync(reportFilePath) === false) {
      return next();
    }

    // if the path is a file in the reports directory
    // and the path does not a directory then send the file
    if (paths[paths.length - 1] !== '') {
      return res.sendFile(reportFilePath);
    }

    // otherwise serve the directory index.html file with the modified report view
    const modifiedReport = await modifyReport(reportFilePath, req);
    return res.send(modifiedReport);
  } catch (error) {
    next(error);
  }
}

/**
 * @summary Modifies the report view
 * @param {string} reportDir The report directory
 * @param {express.Request} req The express request object
 * @returns {Promise<string>} The modified report view
 */
async function modifyReport(reportDir, req) {
  const reportFilePath = path.join(reportDir, 'index.html');
  const reportFile = fs.readFileSync(reportFilePath, 'utf8');
  const reportDom = new JSDOM(reportFile);
  let modifiedReport = await addHeadPartial(reportDom);
  modifiedReport = await addHeaderPartial(modifiedReport, req);
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
  head.prepend(new JSDOM(headContent).window.document.querySelector('head'));
  return reportDom;
}

/**
 * @summary Adds the header partial to the report view
 * @param {JSDOM} reportDom The report DOM
 * @param {express.Request} req The express request object
 * @returns {Promise<JSDOM>} The report DOM with the header partial added
 */
async function addHeaderPartial(reportDom, req) {
  const headerPath = path.join(
    process.cwd(),
    'views',
    'partials',
    '_header.ejs'
  );

  const headerContent = await ejs.renderFile(headerPath, {
    user: req.user,
  });
  const headerDom = new JSDOM(headerContent);
  const dom = reportDom.window.document;

  dom
    .querySelector('body')
    .prepend(headerDom.window.document.querySelector('header'));

  dom
    .querySelector('meta[name="csrf-token"]')
    .setAttribute('content', req.session.csrfToken);

  return reportDom;
}
