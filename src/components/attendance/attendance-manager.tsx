'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AttendanceCalendar } from './attendance-calendar'
import { DataTable } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Coffee, 
  Home,
  User,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

interface AttendanceRecord {
  id: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'HOLIDAY'
  checkIn?: string
  checkOut?: string
  hoursWorked?: number
  notes?: string
  employee: {
    id: string
    firstName: string
    lastName: string
    employeeId: string
    department: {
      name: string
    }
  }
}

interface AttendanceManagerProps {
  employeeId?: string
  view?: 'calendar' | 'table'
}

export function AttendanceManager({ employeeId, view = 'calendar' }: AttendanceManagerProps) {
  const { data: session } = useSession()
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [showMarkDialog, setShowMarkDialog] = useState(false)
  const [currentView, setCurrentView] = useState<'calendar' | 'table'>(view)

  useEffect(() => {
    fetchAttendanceRecords()
  }, [employeeId])

  const fetchAttendanceRecords = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (employeeId) params.append('employeeId', employeeId)
      
      const response = await fetch(`/api/attendance?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setAttendanceRecords(data.data.attendance || [])
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      toast.error('Failed to fetch attendance records')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAttendance = async (date: string, status: string) => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          status,
          employeeId: employeeId || session?.user?.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Attendance marked successfully')
        fetchAttendanceRecords()
      } else {
        toast.error(data.message || 'Failed to mark attendance')
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
      toast.error('Failed to mark attendance')
    }
  }

  const handleDateClick = (date: string) => {
    setSelectedDate(date)
    setShowMarkDialog(true)
  }

  const confirmMarkAttendance = () => {
    if (selectedDate && selectedStatus) {
      handleMarkAttendance(selectedDate, selectedStatus)
      setShowMarkDialog(false)
      setSelectedDate('')
      setSelectedStatus('')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'ABSENT':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'LATE':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'HALF_DAY':
        return <Coffee className="h-4 w-4 text-orange-500" />
      case 'HOLIDAY':
        return <Home className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      PRESENT: 'default',
      ABSENT: 'destructive',
      LATE: 'secondary',
      HALF_DAY: 'outline',
      HOLIDAY: 'secondary',
    } as const

    const labels = {
      PRESENT: 'Present',
      ABSENT: 'Absent',
      LATE: 'Late',
      HALF_DAY: 'Half Day',
      HOLIDAY: 'Holiday',
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Table columns for DataTable
  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (value: any) => formatDate(value),
      sortable: true,
    },
    {
      key: 'employee',
      label: 'Employee',
      render: (value: any, row: AttendanceRecord) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {row.employee.firstName[0]}{row.employee.lastName[0]}
            </span>
          </div>
          <div>
            <div className="font-medium">{row.employee.firstName} {row.employee.lastName}</div>
            <div className="text-sm text-gray-500">{row.employee.employeeId}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'department',
      label: 'Department',
      render: (value: any, row: AttendanceRecord) => row.employee.department.name,
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: any) => getStatusBadge(value),
      sortable: true,
    },
    {
      key: 'checkIn',
      label: 'Check In',
      render: (value: any) => value ? formatTime(value) : '-',
      sortable: true,
    },
    {
      key: 'checkOut',
      label: 'Check Out',
      render: (value: any) => value ? formatTime(value) : '-',
      sortable: true,
    },
    {
      key: 'hoursWorked',
      label: 'Hours',
      render: (value: any) => value ? `${value}h` : '-',
      sortable: true,
    },
  ]

  const canMarkAttendance = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600">Track and manage employee attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={currentView === 'calendar' ? 'default' : 'outline'}
            onClick={() => setCurrentView('calendar')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
          <Button
            variant={currentView === 'table' ? 'default' : 'outline'}
            onClick={() => setCurrentView('table')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Table View
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {currentView === 'calendar' && (
        <AttendanceCalendar
          employeeId={employeeId}
          onDateClick={canMarkAttendance ? handleDateClick : undefined}
          onMarkAttendance={handleMarkAttendance}
        />
      )}

      {/* Table View */}
      {currentView === 'table' && (
        <DataTable
          data={attendanceRecords}
          columns={columns}
          searchable={true}
          searchPlaceholder="Search attendance records..."
          loading={loading}
          emptyMessage="No attendance records found"
        />
      )}

      {/* Mark Attendance Dialog */}
      <ConfirmationDialog
        open={showMarkDialog}
        onOpenChange={setShowMarkDialog}
        title="Mark Attendance"
        description={`Mark attendance for ${selectedDate ? formatDate(selectedDate) : ''}`}
        confirmText="Mark"
        cancelText="Cancel"
        onConfirm={confirmMarkAttendance}
      />
    </div>
  )
}
