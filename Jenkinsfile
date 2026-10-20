// Declarative pipeline. Runs on the Jenkins server (Ubuntu) that polls this GitHub repo.
// Needs on the agent: Node.js 22, Git, Chrome/Electron libraries and xvfb (see docs/JENKINS_SETUP.md).
pipeline {
  agent any

  options {
    timestamps()
    timeout(time: 20, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '15'))
  }

  // The Jenkins server is not reachable from the internet, so it asks GitHub for changes
  // every ~5 minutes instead of waiting for a webhook.
  triggers {
    pollSCM('H/5 * * * *')
  }

  parameters {
    choice(name: 'SUITE', choices: ['all', 'api', 'ui'], description: 'Which tests to run')
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
          when { expression { params.SUITE == 'all' || params.SUITE == 'api' } }
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
          when { expression { params.SUITE == 'all' || params.SUITE == 'ui' } }
          steps {
            sh 'npm run test:ui'
          }
          post {
            always {
              junit allowEmptyResults: true, testResults: 'reports/ui/*.xml'
            }
          }
        }
      }
    }
  }

  post {
    always {
      publishHTML(target: [
        reportName: 'API report',
        reportDir: 'reports/api',
        reportFiles: 'index.html',
        keepAll: true,
        alwaysLinkToLastBuild: true,
        allowMissing: true
      ])
      archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true
    }
    success { echo 'All selected test suites passed.' }
    failure { echo 'A stage failed. Check the Test Result tab and the archived reports and screenshots.' }
    cleanup { cleanWs() }
  }
}
