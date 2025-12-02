#!/bin/bash

# Start the server with correct environment variables
export DB_USER=zhenghao
export DB_HOST=localhost
export DB_PORT=5432
export DB_PASSWORD=
export DB_NAME=ai_interview_db
export PORT=5005
export JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
export JWT_EXPIRE=7d

echo "🚀 Starting AI Interview Backend Server..."
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Port: $PORT"

node src/app.js






