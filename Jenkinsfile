pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS' // Configure this name in Jenkins Global Tool Configuration
    }
    
    environment {
        CI = 'true'
        PLAYWRIGHT_BROWSERS_PATH = '0' // Use default browser path
        RUN_INTEGRATION_TESTS = 'true' // Set to 'false' to skip real API tests
    }
    
    parameters {
        booleanParam(name: 'RUN_INTEGRATION_TESTS', defaultValue: true, description: 'Run integration tests with real Hugging Face API')
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
            steps {
                bat 'npx playwright install --with-deps chromium'
            }
        }
        
        stage('Run Schema Tests') {
            steps {
                bat 'npx playwright test tests/ai-goal-coach/schema.spec.ts --reporter=list'
            }
        }
        
        stage('Run Adversarial Tests') {
            steps {
                bat 'npx playwright test tests/ai-goal-coach/adversarial.spec.ts --reporter=list'
            }
        }
        
        stage('Run Functional Tests') {
            steps {
                bat 'npx playwright test tests/ai-goal-coach/functional.spec.ts --reporter=list'
            }
        }
        
        stage('Run Performance Tests') {
            steps {
                bat 'npx playwright test tests/ai-goal-coach/performance.spec.ts --reporter=list'
            }
        }
        
        stage('Run Integration Tests (Real API)') {
            // Only run if HF_TOKEN credential exists
            when {
                expression {
                    return env.RUN_INTEGRATION_TESTS == 'true'
                }
            }
            steps {
                withCredentials([string(credentialsId: 'HF_TOKEN', variable: 'HF_TOKEN')]) {
                    bat """
                        set HF_TOKEN=%HF_TOKEN%
                        set USE_REAL_API=true
                        npx playwright test tests/ai-goal-coach/integration.spec.ts --reporter=list
                    """
                }
            }
        }
        
        stage('Run All Tests with Report') {
            steps {
                bat 'npx playwright test tests/ai-goal-coach/ --reporter=html,junit'
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
