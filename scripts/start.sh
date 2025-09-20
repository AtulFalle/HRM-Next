#!/bin/bash

echo "🚀 Starting HRM Application with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build and start the application
echo "📦 Building and starting containers..."
docker-compose up --build

echo "✅ HRM Application is running!"
echo "🌐 Access the application at: http://localhost:3000"
echo ""
echo "📋 Test Accounts:"
echo "   Admin: admin@hrm.com / admin123"
echo "   Manager: manager1@hrm.com / manager123"
echo "   Employee: employee1@hrm.com / employee123"
