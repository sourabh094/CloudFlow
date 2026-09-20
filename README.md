# CloudFlow — Automated CI/CD Deployment with Docker and AWS

## 1. Overview

**CloudFlow** is a containerized application deployment project that demonstrates an automated CI/CD workflow using **GitHub Actions, Docker, Docker Hub, AWS EC2, and Nginx**.

Whenever code is pushed to the `main` branch, the pipeline automatically:

1. Checks out the source code.
2. Installs dependencies.
3. Runs automated tests.
4. Builds a versioned Docker image.
5. Pushes the image to Docker Hub.
6. Connects to AWS EC2 through SSH.
7. Pulls the new image.
8. Replaces the running container.

Nginx acts as the reverse proxy between the public internet and the application container.

---

# 2. Architecture

     ```               Developer
                        │
                    git push
                        │
                        ▼
                GitHub Repository
                        │
                        ▼
                GitHub Actions
                        │
          ┌─────────────┴─────────────┐
          │                           │
       CI Process                 Deployment
          │                           │
   ┌──────┴──────┐                    │
   │             │                    │
Install        Test                    │
   │             │                    │
   └──────┬──────┘                    │
          │                            │
     Docker Build                      │
          │                            │
     Docker Push                       │
          │                            │
          ▼                            ▼
     Docker Hub ───────────────────► AWS EC2
                                      │
                                      ▼
                                   Nginx :80
                                      │
                                      ▼
                               Docker Container
                                    :3000
                                      │
                                      ▼
                               Application```

---

# 3. Technologies

| Technology                   | Purpose                      |
| ---------------------------- | ---------------------------- |
| Node.js / Express            | Application                  |
| Git                          | Version control              |
| GitHub                       | Source-code repository       |
| GitHub Actions               | CI/CD automation             |
| Docker                       | Application containerization |
| Docker Hub                   | Docker image registry        |
| AWS EC2                      | Deployment server            |
| Nginx                        | Reverse proxy                |
| SSH                          | Remote EC2 deployment        |
| Supertest / Node Test Runner | Automated testing            |

---

# 4. Project Structure

```text
CloudFlow/
│
├── server.js
├── package.json
├── package-lock.json
├── Dockerfile
├── .dockerignore
│
├── test/
│   └── server.test.js
│
└── .github/
    └── workflows/
        └── ci.yml
```

### Important Files

**`server.js`**
Contains the Express application.

**`package.json`**
Contains dependencies and npm scripts.

**`package-lock.json`**
Locks dependency versions used by the project.

**`Dockerfile`**
Defines how the application is packaged into a Docker image.

**`server.test.js`**
Contains automated application tests.

**`ci.yml`**
Defines the GitHub Actions CI/CD pipeline.

---

# 5. Docker Configuration

The application is packaged using Docker.

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### Build the Image

```bash
docker build -t sourabh094/cloudflow:v1 .
```

### Run the Container

```bash
docker run -d \
  --name cloudflow \
  -p 3000:3000 \
  sourabh094/cloudflow:v1
```

The port mapping:

```text
3000:3000
```

means:

```text
Host :3000
    ↓
Container :3000
```

The application listens on `0.0.0.0:3000` so it can receive connections through Docker networking.

---

# 6. Docker Hub

Docker Hub is used to store the application's Docker images.

Repository:

```text
sourabh094/cloudflow
```

Images are versioned:

```text
cloudflow:v1
cloudflow:v2
cloudflow:v3
...
```

The GitHub Actions workflow generates the tag using:

```text
v${{ github.run_number }}
```

For example:

```text
Workflow Run #7
       ↓
cloudflow:v7
```

The same image built during CI is pushed to Docker Hub and later pulled by EC2.

---

# 7. AWS EC2 and Nginx

AWS EC2 is used as the deployment server.

The server runs:

```text
Ubuntu
├── Docker
└── Nginx
```

The container runs the application on port `3000`.

### Security Group

```text
22 → SSH
80 → HTTP
```

Port `3000` does not need to be publicly accessible because Nginx is the public entry point.

### Nginx Configuration

```nginx
server {
    listen 80;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

Request flow:

```text
Internet
   │
   ▼
EC2 :80
   │
   ▼
Nginx
   │
   ▼
localhost:3000
   │
   ▼
Docker Container
```

---

# 8. CI/CD Pipeline

The pipeline is triggered whenever code is pushed to `main`.

```yaml
name: Cloudflow CI

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:

    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20

    - name: Install Dependencies
      run: npm ci

    - name: Run Tests
      run: npm test

    - name: Build Docker Image
      run: docker build -t sourabh094/cloudflow:v${{ github.run_number }} .

    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Push Docker Image
      run: docker push sourabh094/cloudflow:v${{ github.run_number }}

    - name: Deploy to EC2
      uses: appleboy/ssh-action@v1.2.2
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ${{ secrets.EC2_USERNAME }}
        key: ${{ secrets.EC2_SSH_KEY }}
        script: |
          docker pull sourabh094/cloudflow:v${{ github.run_number }}
          docker stop cloudflow || true
          docker rm cloudflow || true
          docker run -d --name cloudflow -p 3000:3000 sourabh094/cloudflow:v${{ github.run_number }}
```

---

# 9. Pipeline Stages

### 1. Checkout

GitHub Actions downloads the latest source code.

### 2. Setup Node.js

Node.js 20 is configured for the CI environment.

### 3. Install Dependencies

```bash
npm ci
```

Installs dependencies according to `package-lock.json`.

### 4. Run Tests

```bash
npm test
```

If the tests fail, the pipeline stops.

### 5. Build Docker Image

```bash
docker build ...
```

Creates the versioned Docker image.

### 6. Push Image

```bash
docker push ...
```

Uploads the image to Docker Hub.

### 7. Deploy

GitHub Actions connects to EC2 through SSH and executes:

```bash
docker pull ...
docker stop cloudflow
docker rm cloudflow
docker run ...
```

The existing container is replaced with the newly built version.

---

# 10. GitHub Secrets

The pipeline uses GitHub Secrets for sensitive information:

```text
DOCKER_USERNAME
DOCKER_PASSWORD
EC2_HOST
EC2_USERNAME
EC2_SSH_KEY
```

They are referenced using:

```text
${{ secrets.SECRET_NAME }}
```

### Configure Secrets

```text
GitHub Repository
→ Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

Values:

```text
DOCKER_USERNAME = Docker Hub username
DOCKER_PASSWORD = Docker Hub access token
EC2_HOST        = EC2 public IP
EC2_USERNAME    = ubuntu
EC2_SSH_KEY     = EC2 private SSH key
```

**Never commit credentials or private keys to the repository.**

---

# 11. Complete Setup / Rebuild Guide

Use this section if the infrastructure is deleted and the project needs to be configured again.

## Step 1 — Clone the Repository

```bash
git clone <your-github-repository-url>
cd cloudflow
```

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run locally:

```bash
npm start
```

---

## Step 2 — Verify Docker Locally

Build:

```bash
docker build -t cloudflow .
```

Run:

```bash
docker run -d \
  --name cloudflow \
  -p 3000:3000 \
  cloudflow
```

Check:

```bash
docker ps
```

Test:

```text
http://localhost:3000
```

---

## Step 3 — Push Image to Docker Hub

Create the repository:

```text
sourabh094/cloudflow
```

Login:

```bash
docker login
```

Build:

```bash
docker build -t sourabh094/cloudflow:v1 .
```

Push:

```bash
docker push sourabh094/cloudflow:v1
```

---

## Step 4 — Create EC2

Create an Ubuntu EC2 instance and configure the Security Group:

```text
22 → SSH
80 → HTTP
```

Connect:

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Update packages:

```bash
sudo apt update
sudo apt upgrade -y
```

---

## Step 5 — Install Docker on EC2

```bash
sudo apt install docker.io -y
```

Enable and start Docker:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

Verify:

```bash
docker --version
```

---

## Step 6 — Authenticate Docker Hub on EC2

```bash
docker login
```

Then test:

```bash
docker pull sourabh094/cloudflow:v1
```

Run:

```bash
docker run -d \
  --name cloudflow \
  -p 3000:3000 \
  sourabh094/cloudflow:v1
```

Verify:

```bash
docker ps
```

Test from EC2:

```bash
curl http://localhost:3000
```

---

## Step 7 — Install and Configure Nginx

Install:

```bash
sudo apt install nginx -y
```

Enable and start:

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

Edit:

```bash
sudo nano /etc/nginx/sites-available/default
```

Configuration:

```nginx
server {
    listen 80;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

Test:

```bash
sudo nginx -t
```

Reload:

```bash
sudo systemctl reload nginx
```

Test:

```text
http://<EC2_PUBLIC_IP>
```

---

## Step 8 — Configure GitHub Actions

Create:

```text
.github/
└── workflows/
    └── ci.yml
```

Add the CI/CD workflow shown in **Section 8**.

Configure the five GitHub Secrets shown in **Section 10**.

Push:

```bash
git add .
git commit -m "Add CI/CD pipeline"
git push origin main
```

GitHub Actions will automatically build and deploy the application.

---

# 12. Deployment Flow

After:

```bash
git push origin main
```

the complete process is:

```text
Git Push
   ↓
GitHub Actions
   ↓
Checkout
   ↓
Install Dependencies
   ↓
Run Tests
   ↓
Build Docker Image
   ↓
Push Image to Docker Hub
   ↓
SSH into EC2
   ↓
Pull New Image
   ↓
Stop Old Container
   ↓
Remove Old Container
   ↓
Start New Container
   ↓
Nginx
   ↓
Application
```

---

# 13. Verification

### Check running container

```bash
docker ps
```

### Check deployed image

```bash
docker inspect cloudflow --format='{{.Config.Image}}'
```

### Test application directly

```bash
curl http://localhost:3000
```

### Test through Nginx

```bash
curl http://localhost
```

### Test Nginx configuration

```bash
sudo nginx -t
```

---

# 14. Troubleshooting Commands

### Container status

```bash
docker ps -a
```

### Container logs

```bash
docker logs cloudflow
```

### Follow logs

```bash
docker logs -f cloudflow
```

### Docker images

```bash
docker images
```

### Nginx status

```bash
sudo systemctl status nginx
```

### Reload Nginx

```bash
sudo systemctl reload nginx
```

### Check listening ports

```bash
sudo ss -tulpn
```

### Test application

```bash
curl http://localhost:3000
```

---

# 15. Important Information for Future Rebuilds

Keep these available:

```text
GitHub repository
Docker Hub repository
Docker Hub username
Docker Hub access token
EC2 SSH key
GitHub Actions workflow
Nginx configuration
```

If a new EC2 instance is created, update:

```text
EC2_HOST = new EC2 public IP
```

---

# 16. Final Architecture

```text
                         ┌──────────────┐
                         │   Developer  │
                         └──────┬───────┘
                                │
                             git push
                                │
                                ▼
                         ┌──────────────┐
                         │    GitHub    │
                         └──────┬───────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ GitHub Actions  │
                       │                 │
                       │ Test            │
                       │ Build           │
                       │ Push            │
                       │ Deploy          │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Docker Hub    │
                       │   cloudflow:vX  │
                       └────────┬────────┘
                                │
                              Pull
                                │
                                ▼
                    ┌────────────────────────┐
                    │        AWS EC2        │
                    │                        │
                    │      Nginx :80        │
                    │          │             │
                    │          ▼             │
                    │    Docker :3000       │
                    │          │             │
                    │          ▼             │
                    │     Application       │
                    └────────────────────────┘
```