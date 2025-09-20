'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AttendanceTable } from '@/components/attendance/attendance-table'
import { RegularizationRequests } from '@/components/attendance/regularization-requests'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, FileText, Users, Loader2 } from 'lucide-react'

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  user: {
    email: string
  }
}

export default function AdminAttendancePage() {
  const [activeTab, setActiveTab] = useState('attendance')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // Fetch employees for selection
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const result = await response.json()
      
      if (result.success && result.data && result.data.employees) {
        setEmployees(result.data.employees)
      } else {
        console.error('Invalid response structure:', result)
        setEmployees([])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading employees...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-gray-600 mt-1">
            Manage employee attendance and review regularization requests
          </p>
        </div>
      </div>

      {/* Employee Selection */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Employee:</span>
        </div>
        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees && employees.length > 0 ? (
              employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName} ({employee.employeeId})
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-employees" disabled>
                No employees found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Attendance Records
          </TabsTrigger>
          <TabsTrigger value="regularization" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Regularization Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6">
          <AttendanceTable 
            employeeId={selectedEmployeeId === 'all' ? undefined : selectedEmployeeId}
            isAdminView={true}
          />
        </TabsContent>

        <TabsContent value="regularization" className="mt-6">
          <RegularizationRequests />
        </TabsContent>
      </Tabs>
    </div>
  )
}
