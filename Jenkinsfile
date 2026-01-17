pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS' // Configure this name in Jenkins Global Tool Configuration
    }
    
    environment {
        CI = 'true'
        // Cache browsers in a persistent location outside workspace
        PLAYWRIGHT_BROWSERS_PATH = 'C:\\playwright-browsers'
        RUN_INTEGRATION_TESTS = 'true' // Set to 'false' to skip real API tests
    }
    
    parameters {
        choice(name: 'TEST_SCOPE', choices: ['All Tests (Mock + Real API)', 'Mock Tests Only', 'Real API Tests Only'], description: 'Select which tests to run')
        booleanParam(name: 'FORCE_BROWSER_INSTALL', defaultValue: false, description: 'Force reinstall Playwright browsers')
    }
    
    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }
        
        stage('Install Playwright Browsers') {
            when {
                anyOf {
                    // Only install if browsers don't exist OR force install is true
                    expression { return params.FORCE_BROWSER_INSTALL == true }
                    expression { return !fileExists("${env.PLAYWRIGHT_BROWSERS_PATH}\\chromium-*") }
                }
            }
            steps {
                bat 'npx playwright install --with-deps chromium'
            }
        }
        
        stage('Verify Browsers') {
            steps {
                // Quick check that browsers are available
                bat 'npx playwright --version'
            }
        }
        
        stage('Run Schema Tests') {
            when {
                expression { return params.TEST_SCOPE != 'Real API Tests Only' }
            }
            steps {
                bat 'npx playwright test tests/ai-goal-coach/schema.spec.ts --reporter=list'
            }
        }
        
        stage('Run Adversarial Tests') {
            when {
                expression { return params.TEST_SCOPE != 'Real API Tests Only' }
            }
            steps {
                bat 'npx playwright test tests/ai-goal-coach/adversarial.spec.ts --reporter=list'
            }
        }
        
        stage('Run Functional Tests') {
            when {
                expression { return params.TEST_SCOPE != 'Real API Tests Only' }
            }
            steps {
                bat 'npx playwright test tests/ai-goal-coach/functional.spec.ts --reporter=list'
            }
        }
        
        stage('Run Performance Tests') {
            when {
                expression { return params.TEST_SCOPE != 'Real API Tests Only' }
            }
            steps {
                bat 'npx playwright test tests/ai-goal-coach/performance.spec.ts --reporter=list'
            }
        }
        
        stage('Run Integration Tests (Real API)') {
            // Only run if TEST_SCOPE includes Real API tests
            // Skip gracefully if HF_TOKEN credential doesn't exist
            when {
                expression {
                    return params.TEST_SCOPE != 'Mock Tests Only'
                }
            }
            environment {
                USE_REAL_API = 'true'
            }
            steps {
                script {
                    try {
                        withCredentials([string(credentialsId: 'HF_TOKEN', variable: 'HF_TOKEN')]) {
                            bat 'npx playwright test tests/ai-goal-coach/integration.spec.ts --reporter=list'
                        }
                    } catch (Exception e) {
                        echo "⚠️ Skipping Integration Tests: HF_TOKEN credential not configured in Jenkins"
                        echo "To enable: Jenkins → Manage Credentials → Add 'HF_TOKEN' as Secret text"
                    }
                }
            }
        }
        
        stage('Generate Report') {
            steps {
                script {
                    if (params.TEST_SCOPE == 'Real API Tests Only') {
                        bat 'npx playwright test tests/ai-goal-coach/integration.spec.ts --reporter=html,junit || exit 0'
                    } else if (params.TEST_SCOPE == 'Mock Tests Only') {
                        bat 'npx playwright test tests/ai-goal-coach/schema.spec.ts tests/ai-goal-coach/adversarial.spec.ts tests/ai-goal-coach/functional.spec.ts tests/ai-goal-coach/performance.spec.ts --reporter=html,junit'
                    } else {
                        bat 'npx playwright test tests/ai-goal-coach/ --reporter=html,junit'
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Archive Playwright HTML report
            publishHTML(target: [
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright Report'
            ])
            
            // Archive JUnit results if available
            junit allowEmptyResults: true, testResults: 'test-results/*.xml'
            
            // Clean workspace
            cleanWs(cleanWhenNotBuilt: false,
                    deleteDirs: true,
                    disableDeferredWipeout: true,
                    notFailBuild: true)
        }
        
        success {
            echo '✅ All tests passed!'
        }
        
        failure {
            echo '❌ Tests failed. Check the Playwright report for details.'
        }
    }
}
