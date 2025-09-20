#!/bin/bash

echo "🛑 Stopping HRM Application..."

# Stop and remove containers
docker-compose down

echo "✅ HRM Application stopped!"
echo "💾 Database data is preserved in Docker volumes"
