#!/bin/bash

echo "🧹 Cleaning up HRM Application..."

# Stop and remove containers, networks, and volumes
docker-compose down -v

# Remove images
docker rmi hrm-app 2>/dev/null || true

echo "✅ Cleanup complete!"
echo "🗑️  All containers, volumes, and images have been removed"
