# Hello World Docker Web App

## 📋 Description
A simple Python web server that demonstrates basic Docker containerization concepts. The application runs a lightweight HTTP server that serves a "Hello World" message.

## 🎯 Learning Objectives
- Understanding Docker images and containers
- Creating custom Dockerfiles
- Port mapping and container networking
- Basic web server deployment in containers

## 🏗️ Architecture
Browser → localhost:8080 → Docker Container (Python HTTP Server)

## 🚀 Quick Start

### Prerequisites
- Docker installed and running
- Git for cloning the repository

### Running the Application
```bash
# Clone the repository
git clone git@github.com:tonygheorghe/DevOps-Portfolio.git
cd DevOps-Portfolio/hello-web-app

# Build the Docker image
docker build -t hello-web-app .

# Run the container
docker run -p 8080:8080 hello-web-app

# Access the application
# Open http://localhost:8080 in your browser
📁 Project Structure
hello-web-app/
├── app.py          # Python web server
├── Dockerfile      # Container build instructions
└── README.md       # This file
🐳 Dockerfile Explanation
dockerfileFROM python:3.9-slim    # Base image with Python
WORKDIR /app            # Working directory in container
COPY app.py .           # Copy application file
EXPOSE 8080             # Document the port used
CMD ["python", "app.py"] # Command to run the application
💡 Key Concepts Demonstrated

Containerization: Application runs in isolated environment
Reproducibility: Same behavior across different systems
Port Mapping: Container port 8080 mapped to host port 8080
No Dependencies: No need to install Python on host system

🔧 Useful Commands
bash# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View container logs
docker logs <container-name>

# Stop running container
docker stop <container-name>

# Remove container
docker rm <container-name>

# Remove image
docker rmi hello-web-app
🎓 What's Next?
This basic containerization sets the foundation for:

Multi-container applications with Docker Compose
CI/CD pipelines for automated builds
Container orchestration with Kubernetes
Cloud deployment strategies


Part of DevOps Portfolio - Building expertise one container at a time 
