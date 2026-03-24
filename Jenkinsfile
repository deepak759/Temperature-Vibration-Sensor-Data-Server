pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "deepaksharma611/node-backend"
    }


    stages {

        stage('Clone') {
            steps {
                git branch: 'CI/CD',
                    url: 'https://github.com/deepak759/Temperature-Vibration-Sensor-Data-Server.git',
                    credentialsId: 'github-creds'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $DOCKER_IMAGE .'
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([string(credentialsId: 'docker-pass', variable: 'PASS')]) {
                    sh 'docker login -u deepaksharma611 -p $PASS'
                }
                sh 'docker push $DOCKER_IMAGE'
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh 'kubectl apply -f deployment.yaml'
                sh 'kubectl apply -f service.yaml'
            }
        }
    }
}