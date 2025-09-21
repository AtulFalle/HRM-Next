'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Building, 
  Clock,
  TrendingUp,
  FileText,
  Edit
} from 'lucide-react'

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
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
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
}

interface EmployeeProfileProps {
  employee: Employee
  onEdit?: () => void
}

export function EmployeeProfile({ employee, onEdit }: EmployeeProfileProps) {
  const [activeTab, setActiveTab] = useState('overview')

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
      month: 'long',
      day: 'numeric',
    })
  }

  const calculateYearsOfService = (hireDate: string) => {
    const hire = new Date(hireDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - hire.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)
    return `${years}y ${months}m`
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-2xl">
                  {employee.firstName?.[0] || 'E'}{employee.lastName?.[0] || 'M'}
                </span>
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {employee.firstName} {employee.lastName}
                </CardTitle>
                <CardDescription className="text-lg">
                  {employee.position} • {employee.department?.name || 'No Department'}
                </CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  {getRoleBadge(employee.user.role)}
                  {getStatusBadge(employee.status)}
                </div>
              </div>
            </div>
            {onEdit && (
              <Button onClick={onEdit} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium">{employee.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Phone</div>
                    <div className="font-medium">{employee.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Address</div>
                    <div className="font-medium">{employee.address}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Employment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Hire Date</div>
                    <div className="font-medium">{formatDate(employee.hireDate)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Years of Service</div>
                    <div className="font-medium">{calculateYearsOfService(employee.hireDate)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Salary</div>
                    <div className="font-medium">{formatSalary(employee.salary)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Emergency Contact</div>
                    <div className="font-medium">
                      {employee.emergencyContact 
                        ? `${employee.emergencyContact.name} (${employee.emergencyContact.relationship})`
                        : 'N/A'
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Emergency Phone</div>
                    <div className="font-medium">
                      {employee.emergencyContact?.phone || 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Attendance Records
              </CardTitle>
              <CardDescription>
                Recent attendance history and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Attendance data will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaves Tab */}
        <TabsContent value="leaves">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Leave Requests
              </CardTitle>
              <CardDescription>
                Leave history and current requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Leave data will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payroll History
              </CardTitle>
              <CardDescription>
                Salary history and payment records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Payroll data will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
