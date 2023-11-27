# Onspring QA Playwright Reports

This is an application designed to store and present playwright html reports generated from Onspring QA tests.

## Use Case

This application is used in conjunction with the [OnspringEnd2EndTests](https://github.com/StevanFreeborn/OnspringEnd2EndTests) repository. The OnspringEnd2EndTests repository contains the tests that are run against the Onspring application. The tests are run using the playwright framework. When the tests are run they produce an html report as an artifact. After the report is generated it is committed to this repository and then the application is deployed with the updated reports directory to a web service hosted on Render. These reports can potentially contain trace files which shouldn't be shared publicly, but come in very useful when debugging failed or flaky tests. This application is used to store and present the html reports, but require authentication to view them.

## Technologies

### Hosting

- [Render](https://render.com/)

### Runtime

- [Node.js](https://nodejs.org/en/)

### Database

- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)

### Server

- [Express](https://expressjs.com/)
- [EJS](https://ejs.co/)

### Authentication

- [Passport](http://www.passportjs.org/)

### Testing

- [Playwright](https://playwright.dev/)
- [Jest](https://jestjs.io/)
