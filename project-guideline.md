# HRM App - Best Practices & To-Do

## Tech Stack
- Framework: Next.js (App Router, TypeScript)
- UI: Shadcn/ui + TailwindCSS
- DB: PostgreSQL (via Prisma ORM)
- Auth: NextAuth.js with RBAC
- State Mgmt: React Query / TanStack Query
- Forms: React Hook Form + Zod
- Deployment: Vercel (Frontend) + Supabase/NeonDB (Postgres) OR Railway

## Folder Structure
src/
├── app/ # Next.js routes
│ ├── (auth)/ # login, signup, forgot-password
│ ├── dashboard/ # role-based dashboard
│ ├── api/ # REST endpoints (Next.js handlers)
│ └── layout.tsx
├── components/ # Reusable UI components
├── lib/ # Helpers (auth, db, utils)
├── prisma/ # Prisma schema + migrations
├── styles/ # Tailwind globals
└── types/ # Shared TS types

markdown
Copy code

## Core Modules
1. **Auth & RBAC**
   - NextAuth with JWT & session
   - Roles: Admin, Manager, Employee
   - Middleware to protect routes

2. **User Management**
   - Employee Profile (name, email, role, dept, join date, contact info)
   - CRUD for employees

3. **Attendance & Leave**
   - Daily attendance log
   - Leave request/approval workflow
   - Holidays calendar

4. **Payroll (basic)**
   - Salary structure per employee
   - Payslip generation

5. **Dashboard**
   - Stats: total employees, leaves, upcoming birthdays
   - Quick actions (add employee, approve leave)

## To-Do (MVP Phase)
- [ ] Setup Next.js + Tailwind + Shadcn + Prisma + NextAuth
- [ ] Create DB schema (User, Role, Department, Attendance, Leave, Payroll)
- [ ] Implement Authentication pages
- [ ] Build Admin Dashboard
- [ ] Implement Employee CRUD
- [ ] Setup Attendance & Leave Management
- [ ] Create Payroll module
- [ ] Role-based navigation/dashboard