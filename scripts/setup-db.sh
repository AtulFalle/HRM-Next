#!/bin/bash

echo "🚀 Setting up HRM Database..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Seed the database
echo "🌱 Seeding database with initial data..."
npx prisma db seed

echo "✅ Database setup complete!"
echo "🎉 HRM application is ready to use!"
echo ""
echo "📋 Test Accounts:"
echo "   Admin: admin@hrm.com / admin123"
echo "   Manager: manager1@hrm.com / manager123"
echo "   Employee: employee1@hrm.com / employee123"
echo ""
echo "🌐 Application URL: http://localhost:3000"
