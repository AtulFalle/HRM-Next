# HRM App - Human Resource Management System

A comprehensive Human Resource Management (HRM) SaaS application built with Next.js, featuring role-based access control, employee management, attendance tracking, leave management, and payroll processing.

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with role-based access control
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

## ✨ Features

### Core Modules
- **Authentication & Authorization**: Secure login with role-based access (Admin, Manager, Employee)
- **User Management**: Complete employee profiles with personal information, roles, and departments
- **Attendance Management**: Daily check-in/out tracking with status monitoring
- **Leave Management**: Request and approval workflow for various leave types
- **Payroll Management**: Basic salary management and payslip generation
- **Dashboard**: Role-specific dashboards with statistics and quick actions

### User Roles
- **Admin**: Full system access, user management, all approvals
- **Manager**: Team management, leave approvals, attendance monitoring
- **Employee**: Personal dashboard, leave requests, attendance tracking

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- pnpm (recommended) or npm

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd hrm-app
pnpm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hrm_db?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
```

### 3. Database Setup
```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (for development)
pnpm db:push

# Or run migrations (for production)
pnpm db:migrate

# Seed the database with initial data
pnpm db:seed
```

### 4. Start Development Server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔐 Test Accounts

After running the seed script, you can use these test accounts:

- **Admin**: `admin@hrm.com` / `admin123`
- **Manager**: `manager1@hrm.com` / `manager123`
- **Employee**: `employee1@hrm.com` / `employee123`

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn/ui components
│   └── forms/            # Form components
├── lib/                  # Utilities and configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Utility functions
├── types/                # TypeScript type definitions
└── middleware.ts         # Route protection middleware

prisma/
├── schema.prisma         # Database schema
└── seed.ts              # Database seeding script
```

## 🚀 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema changes to database
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with initial data
- `pnpm db:studio` - Open Prisma Studio

## 🎯 Next Steps

This is the initial MVP implementation. Future enhancements could include:

- Advanced reporting and analytics
- Email notifications
- File upload for documents
- Advanced payroll calculations
- Performance management
- Training and development tracking
- Mobile app support

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Role	    Email	            Password
Admin	    admin@hrm.com	    admin123
Manager	    manager1@hrm.com	manager123
Employee	employee1@hrm.com	employee123

