#!/bin/bash

# AI Interview Platform - Complete Startup Script
# This script starts all services: Database, Backend, and Frontend

set -e  # Exit on any error

echo "🚀 Starting AI Interview Platform..."
echo "=================================="

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

# Check if PostgreSQL is running
check_postgres() {
    print_status "Checking PostgreSQL status..."
    if pg_isready -q; then
        print_success "PostgreSQL is running"
    else
        print_warning "PostgreSQL is not running. Starting it..."
        if command -v brew &> /dev/null; then
            brew services start postgresql
        elif command -v systemctl &> /dev/null; then
            sudo systemctl start postgresql
        else
            print_error "Please start PostgreSQL manually"
            exit 1
        fi
        sleep 3
    fi
}

# Check if Redis is running (optional)
check_redis() {
    print_status "Checking Redis status..."
    if redis-cli ping &> /dev/null; then
        print_success "Redis is running"
    else
        print_warning "Redis is not running (optional for development)"
    fi
}

# Setup environment
setup_environment() {
    print_status "Setting up environment variables..."
    cd backend
    if [ -f setup-env.sh ]; then
        source setup-env.sh
        print_success "Environment variables loaded"
    else
        print_warning "setup-env.sh not found, using default environment"
    fi
    cd ..
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    cd backend
    npm run db:migrate
    print_success "Database migrations completed"
    cd ..
}

# Start backend server
start_backend() {
    print_status "Starting backend server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    print_success "Backend server started (PID: $BACKEND_PID)"
    cd ..
}

# Start frontend server
start_frontend() {
    print_status "Starting frontend server..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    print_success "Frontend server started (PID: $FRONTEND_PID)"
    cd ..
}

# Cleanup function
cleanup() {
    print_status "Shutting down services..."
    if [ -f backend.pid ]; then
        kill $(cat backend.pid) 2>/dev/null || true
        rm backend.pid
    fi
    if [ -f frontend.pid ]; then
        kill $(cat frontend.pid) 2>/dev/null || true
        rm frontend.pid
    fi
    print_success "All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    # Check prerequisites
    check_postgres
    check_redis
    
    # Setup and start services
    setup_environment
    run_migrations
    start_backend
    
    # Wait a moment for backend to start
    sleep 3
    
    start_frontend
    
    # Display status
    echo ""
    print_success "🎉 All services started successfully!"
    echo ""
    echo "📱 Frontend: http://localhost:3005"
    echo "🔧 Backend:  http://localhost:5000"
    echo "🗄️  Database: localhost:5432"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo ""
    
    # Wait for user to stop
    wait
}

# Run main function
main "$@"




