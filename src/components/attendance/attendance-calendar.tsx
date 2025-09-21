'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Coffee,
  Home
} from 'lucide-react'
import { format } from 'date-fns'

interface AttendanceRecord {
  id: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'HOLIDAY'
  checkIn?: string
  checkOut?: string
  hoursWorked?: number
  notes?: string
}

interface AttendanceCalendarProps {
  employeeId?: string
  month?: number
  year?: number
  onDateClick?: (date: string) => void
  onMarkAttendance?: (date: string, status: string) => void
}

export function AttendanceCalendar({
  employeeId,
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear(),
  onDateClick
}: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(month)
  const [currentYear, setCurrentYear] = useState(year)
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAttendanceData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        month: currentMonth.toString(),
        year: currentYear.toString(),
        ...(employeeId && { employeeId })
      })
      
      const response = await fetch(`/api/attendance?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setAttendanceData(data.data.attendance || [])
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentMonth, currentYear, employeeId])

  useEffect(() => {
    fetchAttendanceData()
  }, [fetchAttendanceData])

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay()
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
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="text-xs">
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const getAttendanceForDate = (date: number) => {
    const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`
    return attendanceData.find(record => record.date === dateStr)
  }


  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
  const days = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  // Calculate attendance summary
  const summary = attendanceData.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalDays = daysInMonth
  const presentDays = summary.PRESENT || 0
  const absentDays = summary.ABSENT || 0
  const lateDays = summary.LATE || 0
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{presentDays}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{absentDays}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{lateDays}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-blue-600">{attendanceRate}%</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Attendance Calendar
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(new Date(currentYear, currentMonth - 1, 1), 'MMMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={new Date(currentYear, currentMonth - 1, 1)}
                  onSelect={(date) => {
                    if (date) {
                      setCurrentMonth(date.getMonth() + 1)
                      setCurrentYear(date.getFullYear())
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  if (day === null) {
                    return <div key={index} className="h-16"></div>
                  }

                  const attendance = getAttendanceForDate(day)
                  const isToday = new Date().getDate() === day && 
                                 new Date().getMonth() + 1 === currentMonth && 
                                 new Date().getFullYear() === currentYear

                  return (
                    <div
                      key={day}
                      className={`h-16 border rounded-lg p-2 cursor-pointer transition-colors ${
                        isToday 
                          ? 'bg-blue-50 border-blue-200' 
                          : attendance 
                            ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' 
                            : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => onDateClick?.(`${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`)}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                            {day}
                          </span>
                          {attendance && getStatusIcon(attendance.status)}
                        </div>
                        {attendance && (
                          <div className="mt-1">
                            {getStatusBadge(attendance.status)}
                          </div>
                        )}
                        {attendance?.checkIn && (
                          <div className="text-xs text-gray-500 mt-1">
                            {attendance.checkIn}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
