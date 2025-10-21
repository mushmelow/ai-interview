#!/bin/bash

# AI Interview Backend Environment Setup
# This script sets up the environment variables for the database

echo "🔧 Setting up environment variables for AI Interview Backend..."

# Database Configuration
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=zhenghao
export DB_PASSWORD=
export DB_NAME=ai_interview_db

# Server Configuration
export PORT=4000
export NODE_ENV=development
export FRONTEND_URL=http://localhost:3005

# JWT Configuration
export JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
export JWT_EXPIRE=7d

# Redis Configuration
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=

# Logging
export LOG_LEVEL=info

echo "✅ Environment variables set successfully!"
echo ""
echo "📋 Current database configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   User: $DB_USER"
echo "   Database: $DB_NAME"
echo ""
echo "🚀 You can now run:"
echo "   npm run dev          # Start development server"
echo "   npm run db:migrate   # Run database migrations"
echo "   npm run db:status    # Check migration status"
echo ""




