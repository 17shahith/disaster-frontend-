pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '15', artifactNumToKeepStr: '5'))
        timeout(time: 20, unit: 'MINUTES')
    }

    // Requires the NodeJS Jenkins plugin with a tool named "node-20" (Manage Jenkins -> Tools).
    tools {
        nodejs 'node-20'
    }

    parameters {
        string(
            name: 'API_BASE_URL',
            defaultValue: 'http://127.0.0.1:5000/api',
            description: 'Backend API URL baked into the build (VITE_API_BASE_URL).'
        )
        booleanParam(
            name: 'RUN_INTEGRATION',
            defaultValue: false,
            description: 'Run npm run test:integration. Needs a seeded dev backend at API_BASE_URL and creates "E2E" records - never point at production.'
        )
    }

    environment {
        CI = 'true'
        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm-cache"
        VITE_API_BASE_URL = "${params.API_BASE_URL}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'node --version && npm --version'
            }
        }

        stage('Install') {
            steps {
                sh 'npm ci --no-audit --no-fund'
            }
        }

        stage('Security audit') {
            steps {
                // Reports high/critical vulnerabilities in production deps; marks the build unstable, not failed.
                catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                    sh 'npm audit --omit=dev --audit-level=high'
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Integration tests') {
            when { expression { return params.RUN_INTEGRATION } }
            steps {
                sh 'npm run test:integration'
            }
        }

        stage('Archive') {
            steps {
                sh 'tar -czf drrc-frontend-dist.tgz -C dist .'
                archiveArtifacts artifacts: 'drrc-frontend-dist.tgz', fingerprint: true
            }
        }
    }

    post {
        success {
            echo 'Build succeeded. dist/ is archived as drrc-frontend-dist.tgz.'
        }
        failure {
            echo 'Build failed. Check the stage logs above.'
        }
        cleanup {
            cleanWs(deleteDirs: true, notFailBuild: true)
        }
    }
}
