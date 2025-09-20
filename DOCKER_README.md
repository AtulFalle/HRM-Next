# 🐳 HRM Application - Docker Setup

This guide will help you run the HRM application using Docker containers, without installing anything locally.

## 📋 Prerequisites

- **Docker Desktop** installed and running
- **Git** (to clone the repository)

## 🚀 Quick Start

### Option 1: Using Scripts (Recommended)

```bash
# Start the application
./scripts/start.sh

# Or for development mode with hot reload
./scripts/start-dev.sh

# Stop the application
./scripts/stop.sh

# Clean up everything (removes data)
./scripts/clean.sh
```

### Option 2: Using Docker Compose Directly

```bash
# Production mode
docker-compose up --build

# Development mode
docker-compose -f docker-compose.dev.yml up --build

# Stop
docker-compose down
```

## 🌐 Access the Application

Once the containers are running:

- **Application**: http://localhost:3000
- **Database**: localhost:5432 (PostgreSQL)

## 👤 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hrm.com | admin123 |
| Manager | manager1@hrm.com | manager123 |
| Employee | employee1@hrm.com | employee123 |

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   HRM App       │    │   PostgreSQL    │
│   (Port 3000)   │◄──►│   (Port 5432)   │
│   Next.js       │    │   Database      │
└─────────────────┘    └─────────────────┘
```

## 📁 Docker Files

- `Dockerfile` - Application container configuration
- `docker-compose.yml` - Production setup
- `docker-compose.dev.yml` - Development setup
- `.dockerignore` - Files to exclude from Docker build

## 🔧 Environment Variables

The application uses these environment variables (configured in docker-compose.yml):

```env
DATABASE_URL=postgresql://hrm_user:hrm_password@postgres:5432/hrm_db?schema=public
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## 🗄️ Database

- **Database**: PostgreSQL 15
- **Database Name**: hrm_db
- **Username**: hrm_user
- **Password**: hrm_password
- **Port**: 5432

The database is automatically:
- Created on first run
- Migrated with Prisma
- Seeded with test data

## 🔄 Development vs Production

### Development Mode
- Hot reload enabled
- Source code mounted as volume
- Faster rebuilds
- Debug-friendly

### Production Mode
- Optimized build
- No source code mounting
- Better performance
- Production-ready

## 🛠️ Troubleshooting

### Container won't start
```bash
# Check Docker is running
docker info

# Check logs
docker-compose logs app
docker-compose logs postgres
```

### Database connection issues
```bash
# Check if database is healthy
docker-compose ps

# Restart database
docker-compose restart postgres
```

### Port conflicts
If ports 3000 or 5432 are already in use, modify the ports in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change 3000 to 3001
  - "5433:5432"  # Change 5432 to 5433
```

### Reset everything
```bash
# Stop and remove everything
./scripts/clean.sh

# Start fresh
./scripts/start.sh
```

## 📊 Monitoring

### View logs
```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f postgres

# All logs
docker-compose logs -f
```

### Check container status
```bash
docker-compose ps
```

### Access database directly
```bash
# Connect to PostgreSQL
docker exec -it hrm-postgres psql -U hrm_user -d hrm_db
```

## 🔒 Security Notes

- Change the `NEXTAUTH_SECRET` in production
- Use strong database passwords
- Configure proper firewall rules
- Use HTTPS in production

## 🚀 Deployment

For production deployment:

1. Update environment variables
2. Use production Docker Compose
3. Configure reverse proxy (nginx)
4. Set up SSL certificates
5. Configure monitoring and logging

## 📞 Support

If you encounter any issues:

1. Check the logs: `docker-compose logs`
2. Verify Docker is running: `docker info`
3. Try a clean restart: `./scripts/clean.sh && ./scripts/start.sh`
4. Check the troubleshooting section above

---

**Happy HRM Management! 🎉**
