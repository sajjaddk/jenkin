// Declarative pipeline. Runs on the Jenkins server (Ubuntu) that polls this GitHub repo.
// Needs on the agent: Node.js 22, Git, and the browser libraries from docs/JENKINS_SETUP.md
// (xvfb + Cypress libraries, and Playwright's system libraries).
pipeline {
  agent any

  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '15'))
  }

  // The Jenkins server is not reachable from the internet, so it asks GitHub for changes
  // every ~5 minutes instead of waiting for a webhook.
  triggers {
    pollSCM('H/5 * * * *')
  }

  parameters {
    choice(name: 'SUITE', choices: ['all', 'newman', 'cypress', 'playwright'], description: 'Which tests to run')
  }

  environment {
    CI = 'true'
    NO_COLOR = '1'
  }

  stages {
    stage('Install') {
      steps {
        sh 'node --version && npm --version'
        sh 'npm ci'
      }
    }

    stage('Lint') {
      steps {
        sh 'npm run lint'
      }
    }

    stage('Tests') {
      parallel {
        stage('API tests (Newman)') {
          when { expression { params.SUITE == 'all' || params.SUITE == 'newman' } }
          steps {
            sh 'npm run test:api'
          }
          post {
            always {
              junit allowEmptyResults: true, testResults: 'reports/api/*.xml'
            }
          }
        }

        stage('UI tests (Cypress)') {
          when { expression { params.SUITE == 'all' || params.SUITE == 'cypress' } }
          steps {
            sh 'npm run test:ui'
          }
          post {
            always {
              junit allowEmptyResults: true, testResults: 'reports/ui/*.xml'
            }
          }
        }

        stage('API + UI tests (Playwright)') {
          when { expression { params.SUITE == 'all' || params.SUITE == 'playwright' } }
          steps {
            // Downloads Chromium for the jenkins user the first time (cached afterwards).
            sh 'npx playwright install chromium'
            sh 'npm run test:pw'
          }
          post {
            always {
              junit allowEmptyResults: true, testResults: 'reports/playwright/junit.xml'
            }
          }
        }
      }
    }
  }

  post {
    always {
      publishHTML(target: [
        reportName: 'API report (Newman)',
        reportDir: 'reports/api',
        reportFiles: 'index.html',
        keepAll: true,
        alwaysLinkToLastBuild: true,
        allowMissing: true
      ])
      publishHTML(target: [
        reportName: 'Playwright report',
        reportDir: 'reports/playwright/html',
        reportFiles: 'index.html',
        keepAll: true,
        alwaysLinkToLastBuild: true,
        allowMissing: true
      ])
      // Allure report: needs the Allure Jenkins plugin and an Allure tool named 'allure'.
      // If they are not set up yet, the build still finishes and the console says why.
      script {
        try {
          allure includeProperties: false, jdk: '', commandline: 'allure', results: [[path: 'reports/allure-results']]
        } catch (err) {
          echo "Allure report skipped: ${err.message}"
        }
      }
      archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true
    }
    success { echo 'All selected test suites passed.' }
    failure { echo 'A stage failed. Check the Test Result tab and the archived reports and screenshots.' }
    cleanup { cleanWs() }
  }
}
