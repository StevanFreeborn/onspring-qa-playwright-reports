# Onspring QA Playwright Reports

This is an application designed to store and present playwright html reports generated from Onspring QA tests.

## Use Case

This application is used in conjunction with the [OnspringEnd2EndTests](https://github.com/StevanFreeborn/OnspringEnd2EndTests) repository. The OnspringEnd2EndTests repository contains the tests that are run against the Onspring application. The tests are run using the playwright framework. When the tests are run they produce an html report as an artifact. After the report is generated it is published and served by this application. These reports can potentially contain trace files which shouldn't be shared publicly, but come in very useful when debugging failed or flaky tests. This application is used to store and present the html reports, but require authentication to view them.

## Technologies

### Hosting

- VPS
- [Docker](https://www.docker.com/)

### Runtime

- [Node.js](https://nodejs.org/en/)

### Database

- [Prisma](https://www.prisma.io/)
- [SQLite](https://www.sqlite.org/index.html)

### Server

- [Express](https://expressjs.com/)
- [EJS](https://ejs.co/)

### Email

- [EmailJS](https://www.emailjs.com/)

### Authentication

- [Passport](http://www.passportjs.org/)

### Tests

- [Playwright](https://playwright.dev/)
- [Jest](https://jestjs.io/)
- [Docker](https://www.docker.com/)
- [Testcontainers](https://testcontainers.com/)

## Development

### Prerequisites

- [Node.js](https://nodejs.org/en/)
- [Docker](https://www.docker.com/)
- [NPM](https://www.npmjs.com/)

### Setup

1. Clone the repository

```bash
git clone https://github.com/StevanFreeborn/onspring-qa-playwright-reports.git
```

2. Change directory into the repository

```bash
cd onspring-qa-playwright-reports
```

3. Install dependencies

```bash
npm install
```

4. Create a copy of the `example.env` file and name it `.env`

```bash
cp example.env .env
```

5. Fill in the `.env` file with the appropriate values

6. Run migrations

```bash
npm run migrate
```

7. Generate prism client

```bash
npm run generate
```

8. Start the application

```bash
npm run dev
```

### Testing

#### Unit Tests

```bash
npm run test:unit
```

#### Integration Tests

```bash
npm run test:integration
```

#### End to End Tests

1. Install playwright dependencies

```bash
npx playwright install
```

2. Run the tests

```bash
npm run test:e2e
```

#### All Tests

```bash
npm run test
```
