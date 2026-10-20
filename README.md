# Jenkins QA Pipeline

API and UI test automation against public practice sites, run by a **Jenkins pipeline on a home Ubuntu Server** that watches this GitHub repository.

> Test targets are sites built for practice: [Restful-Booker](https://restful-booker.herokuapp.com) (API) and [SauceDemo](https://www.saucedemo.com) (UI). They belong to their owners. These tests are light functional checks only, with no load or attack testing. No employer code or data is used.

## How it fits together
```
 GitHub (this repo) <------ polls every ~5 min ------ Jenkins on Ubuntu Server (home network)
                                                         |
                                  +----------------------+----------------------+
                                  |                                             |
                       API tests: Newman (Postman)                   UI tests: Cypress (POM)
                          -> Restful-Booker API                          -> SauceDemo website
                                  |                                             |
                                  +------------- JUnit XML + HTML reports ------+
                                                         |
                                            Jenkins: Test Result, API report, Allure report,
                                            archived artifacts, failure screenshots
```
Jenkins is **not** exposed to the internet. It polls GitHub instead of receiving webhooks.

## What is tested
| Suite | Tool | Target | Tests |
|---|---|---|---|
| API | Postman collection run with Newman | Restful-Booker | 13 requests, 37 assertions: auth, create/read/list/filter, update, partial update, forbidden update, invalid payload, delete, deleted-is-gone |
| UI | Cypress with Page Object Model | SauceDemo | 14 tests: valid/invalid/locked-out login, required fields, protected page, logout, cart badge, sorting, full checkout, checkout validation |

Reporting: JUnit (Jenkins trends), the Newman HTML report, and one **Allure** report for API and UI together, with features, severity labels and steps.

Techniques: positive and negative testing, boundary and validation checks, authorisation checks, state-based flows (create then update then delete), end-to-end user journeys, and data sharing between requests with variables.

## Pipeline (`Jenkinsfile`)
1. **Install**: `npm ci`
2. **Lint**: ESLint on the Cypress code
3. **Tests (in parallel)**: Newman API tests and Cypress UI tests
4. **Post**: publish JUnit results, the API HTML report and the combined **Allure report**, archive reports and screenshots, clean the workspace

Features: pipeline as code, SCM polling, a `SUITE` parameter (`all`, `api`, `ui`) to run part of the pipeline, a build timeout, build history limits, retries for flaky public sites (UI), and no concurrent builds.

## Set up Jenkins
Follow [`docs/JENKINS_SETUP.md`](docs/JENKINS_SETUP.md) (Ubuntu Server, about 30–45 minutes).

## Run the tests without Jenkins
Requires Node.js 20 or newer.
```bash
npm install
npm run test:api     # Newman, report in reports/api/index.html
npm run test:ui      # Cypress headless, JUnit in reports/ui/
npm run cy:open      # Cypress interactive mode
npm run report       # build the Allure report from the last run (reports/allure-report)
npm run report:open  # open it in the browser
npm run lint
```

## Screenshots
_Added after the first Jenkins runs, in `docs/screenshots/`._

## Project layout
```
Jenkinsfile                      pipeline definition
api-tests/                       Postman collection and environment
cypress/e2e/                     UI tests
cypress/support/pages/           page objects (Login, Inventory, Checkout)
docs/JENKINS_SETUP.md            server installation guide
```
