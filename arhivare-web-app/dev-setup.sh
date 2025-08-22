#!/bin/bash
# dev-setup.sh - Development Environment Setup Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Docker installation
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        print_status "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        print_status "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Function to check Node.js installation
check_node() {
    print_status "Checking Node.js installation..."
    
    if ! command_exists node; then
        print_warning "Node.js is not installed. You can still run the app with Docker."
        print_status "To install Node.js locally, visit: https://nodejs.org/"
        return 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
    return 0
}

# Function to check Python installation
check_python() {
    print_status "Checking Python installation..."
    
    if ! command_exists python3; then
        print_warning "Python 3 is not installed. You can still run the app with Docker."
        print_status "To install Python, visit: https://python.org/"
        return 1
    fi
    
    PYTHON_VERSION=$(python3 --version)
    print_success "Python is installed: $PYTHON_VERSION"
    return 0
}

# Function to setup environment file
setup_env() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
        else
            print_warning ".env.example not found, creating basic .env file"
            cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql+psycopg2://app:app@localhost:5432/arhivare

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_change_in_production_$(openssl rand -hex 16)
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Admin Bootstrap
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
EOF
            print_success "Created basic .env file"
        fi
    else
        print_success ".env file already exists"
    fi
}

# Function to setup frontend dependencies
setup_frontend() {
    print_status "Setting up frontend dependencies..."
    
    if [ -d "react-frontend" ]; then
        cd react-frontend
        
        if [ -f package.json ]; then
            if command_exists npm; then
                print_status "Installing npm dependencies..."
                npm install
                print_success "Frontend dependencies installed"
            else
                print_warning "npm not available, dependencies will be installed in Docker"
            fi
        else
            print_error "package.json not found in react-frontend directory"
        fi
        
        cd ..
    else
        print_warning "react-frontend directory not found"
    fi
}

# Function to setup backend dependencies
setup_backend() {
    print_status "Setting up backend dependencies..."
    
    if [ -f requirements.txt ]; then
        if command_exists python3 && command_exists pip3; then
            print_status "Creating Python virtual environment..."
            
            if [ ! -d "venv" ]; then
                python3 -m venv venv
                print_success "Virtual environment created"
            fi
            
            print_status "Activating virtual environment and installing dependencies..."
            source venv/bin/activate
            pip install -r requirements.txt
            print_success "Backend dependencies installed"
        else
            print_warning "Python/pip not available, dependencies will be installed in Docker"
        fi
    else
        print_error "requirements.txt not found"
    fi
}

# Function to start services with Docker
start_docker_services() {
    print_status "Starting services with Docker Compose..."
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Build and start services
    docker-compose up --build -d
    
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Services are running!"
        
        print_status "Service URLs:"
        echo "  🌐 Frontend:  http://localhost:3000"
        echo "  🔧 Backend:   http://localhost:8000"
        echo "  📊 API Docs:  http://localhost:8000/docs"
        echo "  🗄️  Adminer:   http://localhost:8080"
        
        print_status "Demo login credentials:"
        echo "  👨‍💼 Admin:     admin / admin123"
        echo "  👁️  Audit:     audit_user / Audit1234"
        echo "  👤 Client:    client_brasov / Client1234"
        
    else
        print_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
}

# Function to show logs
show_logs() {
    print_status "Showing service logs..."
    docker-compose logs -f
}

# Function to stop services
stop_services() {
    print_status "Stopping all services..."
    docker-compose down
    print_success "Services stopped"
}

# Function to reset database
reset_database() {
    print_warning "This will delete all data! Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Resetting database..."
        docker-compose down -v
        docker-compose up -d db
        sleep 5
        docker-compose up -d api
        print_success "Database reset complete"
    else
        print_status "Database reset cancelled"
    fi
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    if [ -f "pytest.ini" ]; then
        docker-compose exec api python -m pytest tests/ -v
    else
        print_warning "No test configuration found"
    fi
}

# Function to show help
show_help() {
    echo "Arhivare Web App - Development Setup Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup      - Setup development environment"
    echo "  start      - Start all services with Docker"
    echo "  stop       - Stop all services"
    echo "  logs       - Show service logs"
    echo "  reset      - Reset database (WARNING: deletes all data)"
    echo "  test       - Run tests"
    echo "  help       - Show this help message"
    echo ""
    echo "If no command is provided, 'setup' and 'start' will be executed."
}

# Main script logic
main() {
    echo ""
    echo "🚀 Arhivare Web App - Development Setup"
    echo "========================================"
    echo ""
    
    case "${1:-setup}" in
        "setup")
            check_docker
            check_node
            check_python
            setup_env
            setup_frontend
            setup_backend
            print_success "Setup complete! Run '$0 start' to start the application."
            ;;
        "start")
            check_docker
            start_docker_services
            ;;
        "stop")
            stop_services
            ;;
        "logs")
            show_logs
            ;;
        "reset")
            reset_database
            ;;
        "test")
            run_tests
            ;;
        "help")
            show_help
            ;;
        *)
            if [ "$1" = "" ]; then
                # Default action: setup and start
                check_docker
                check_node
                check_python
                setup_env
                setup_frontend
                setup_backend
                start_docker_services
            else
                print_error "Unknown command: $1"
                show_help
                exit 1
            fi
            ;;
    esac
}

# Run main function with all arguments
main "$@"
