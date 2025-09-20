'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Eye, Edit, Trash2, Mail } from 'lucide-react'

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: {
    id: string
    name: string
  }
  user: {
    role: string
    email: string
  }
  status: string
  hireDate: string
  salary: number
}

interface Department {
  id: string
  name: string
  _count: {
    employees: number
  }
}

interface EmployeeTableProps {
  employees: Employee[]
  departments: Department[]
  loading?: boolean
  onDelete?: (id: string) => Promise<void>
  onRefresh?: () => void
}

export function EmployeeTable({ 
  employees, 
  departments, 
  loading = false, 
  onDelete,
  onRefresh 
}: EmployeeTableProps) {
  const router = useRouter()
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    employee: Employee | null
  }>({ open: false, employee: null })
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const handleDelete = async (employee: Employee) => {
    setDeleteDialog({ open: true, employee })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.employee || !onDelete) return

    try {
      await onDelete(deleteDialog.employee.id)
      toast.success('Employee deleted successfully')
      setDeleteDialog({ open: false, employee: null })
      onRefresh?.()
    } catch {
      toast.error('Failed to delete employee')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'default',
      INACTIVE: 'secondary',
      TERMINATED: 'destructive',
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      ADMIN: 'destructive',
      MANAGER: 'default',
      EMPLOYEE: 'secondary',
    } as const

    return (
      <Badge variant={variants[role as keyof typeof variants] || 'secondary'}>
        {role}
      </Badge>
    )
  }

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(salary)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Filter employees
  const filteredEmployees = employees.filter((employee) => {
    const departmentMatch = departmentFilter === 'all' || employee.department.id === departmentFilter
    const statusMatch = statusFilter === 'all' || employee.status === statusFilter
    return departmentMatch && statusMatch
  })

  const columns = [
    {
      key: 'name',
      label: 'Employee',
      render: (value: any, row: Employee) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {row.firstName[0]}{row.lastName[0]}
            </span>
          </div>
          <div>
            <div className="font-medium">{row.firstName} {row.lastName}</div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {row.email}
            </div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'position',
      label: 'Position',
      render: (value: any, row: Employee) => (
        <div>
          <div className="font-medium">{row.position}</div>
          <div className="text-sm text-gray-500">{row.department.name}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'user.role',
      label: 'Role',
      render: (value: any) => getRoleBadge(value),
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: any) => getStatusBadge(value),
      sortable: true,
    },
    {
      key: 'salary',
      label: 'Salary',
      render: (value: any) => (
        <span className="font-medium">{formatSalary(value)}</span>
      ),
      sortable: true,
    },
    {
      key: 'hireDate',
      label: 'Hire Date',
      render: (value: any) => formatDate(value),
      sortable: true,
    },
  ]

  const actions = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: (employee: Employee) => router.push(`/dashboard/employees/${employee.id}`),
    },
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (employee: Employee) => router.push(`/dashboard/employees/${employee.id}/edit`),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDelete,
      variant: 'destructive' as const,
    },
  ]

  const filters = (
    <div className="flex gap-2">
      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Departments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.name} ({dept._count.employees})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
          <SelectItem value="TERMINATED">Terminated</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <>
      <DataTable
        data={filteredEmployees}
        columns={columns}
        actions={actions}
        searchable={true}
        searchPlaceholder="Search employees..."
        filters={filters}
        loading={loading}
        emptyMessage="No employees found"
        exportable={true}
        onExport={() => toast.info('Export functionality coming soon')}
      />

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, employee: null })}
        title="Delete Employee"
        description={`Are you sure you want to delete ${deleteDialog.employee?.firstName} ${deleteDialog.employee?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </>
  )
}
