'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isWeekend } from 'date-fns'

interface LocationData {
  latitude: number
  longitude: number
  address?: string
  accuracy?: number
}

interface AttendanceData {
  id: string
  date: string
  checkIn: string | null
  checkOut: string | null
  checkInLocation: LocationData | null
  checkOutLocation: LocationData | null
  status: string
  notes: string | null
  isRegularized: boolean
  regularizedBy: string | null
  regularizedAt: string | null
  employee?: {
    department: {
      name: string
    }
    id: string
    employeeId: string
    firstName: string
    lastName: string
    user: {
      name: string
      email: string
    }
  }
}

interface RegularizationRequest {
  id: string
  date: string
  reason: string
  status: string
  requestedAt: string
  reviewedBy: string | null
  reviewedAt: string | null
  reviewComments: string | null
}

interface AttendanceTableProps {
  employeeId?: string // If provided, show specific employee's attendance
  isAdminView?: boolean // If true, show admin-specific features
}

export function AttendanceTable({ employeeId, isAdminView = false }: AttendanceTableProps) {
  const [attendance, setAttendance] = useState<AttendanceData[]>([])
  const [regularizationRequests, setRegularizationRequests] = useState<RegularizationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [regularizationDialogOpen, setRegularizationDialogOpen] = useState(false)
  const [regularizationReason, setRegularizationReason] = useState('')
  const [submittingRegularization, setSubmittingRegularization] = useState(false)

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    try {
      const month = currentMonth.getMonth() + 1
      const year = currentMonth.getFullYear()
      
      let url = `/api/attendance?month=${month}&year=${year}`
      if (employeeId) {
        url += `&employeeId=${employeeId}`
      }
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success) {
        setAttendance(result.data)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      toast.error('Failed to fetch attendance data')
    } finally {
      setLoading(false)
    }
  }, [currentMonth, employeeId])

  // Fetch regularization requests
  const fetchRegularizationRequests = async () => {
    try {
      const response = await fetch('/api/attendance/regularization')
      const result = await response.json()
      
      if (result.success) {
        setRegularizationRequests(result.data)
      }
    } catch (error) {
      console.error('Error fetching regularization requests:', error)
    }
  }

  useEffect(() => {
    fetchAttendance()
    fetchRegularizationRequests()
  }, [fetchAttendance])

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  // Get attendance for specific date
  const getAttendanceForDate = (date: Date) => {
    return attendance.find(record => 
      isSameDay(new Date(record.date), date)
    )
  }

  // Get regularization request for specific date
  const getRegularizationRequestForDate = (date: Date) => {
    return regularizationRequests.find(request => 
      isSameDay(new Date(request.date), date)
    )
  }

  // Submit regularization request
  const handleRegularizationRequest = async () => {
    if (!selectedDate || !regularizationReason.trim()) {
      toast.error('Please provide a reason for regularization')
      return
    }

    setSubmittingRegularization(true)
    try {
      const response = await fetch('/api/attendance/regularization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          reason: regularizationReason.trim()
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Regularization request submitted successfully')
        setRegularizationDialogOpen(false)
        setRegularizationReason('')
        setSelectedDate(null)
        await fetchRegularizationRequests()
      } else {
        toast.error(result.error || 'Failed to submit regularization request')
      }
    } catch (error) {
      console.error('Error submitting regularization request:', error)
      toast.error('Failed to submit regularization request')
    } finally {
      setSubmittingRegularization(false)
    }
  }

  // Get status badge
  const getStatusBadge = (status: string, isRegularized: boolean = false) => {
    const statusConfig = {
      PRESENT: { label: 'Present', variant: 'default' as const, icon: CheckCircle },
      ABSENT: { label: 'Absent', variant: 'destructive' as const, icon: XCircle },
      LATE: { label: 'Late', variant: 'secondary' as const, icon: AlertCircle },
      HALF_DAY: { label: 'Half Day', variant: 'outline' as const, icon: Clock },
      HOLIDAY: { label: 'Holiday', variant: 'outline' as const, icon: Clock }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PRESENT
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
        {isRegularized && <span className="text-xs">(R)</span>}
      </Badge>
    )
  }

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Group attendance by employee for admin view
  const attendanceByEmployee = isAdminView ? 
    attendance.reduce((acc, record) => {
      if (record.employee) {
        const empId = record.employee.id
        if (!acc[empId]) {
          acc[empId] = {
            employee: {
              id: record.employee.id,
              name: `${record.employee.firstName} ${record.employee.lastName}`,
              email: record.employee.user.email,
              department: record.employee.department
                ? { name: record.employee.department.name }
                : undefined,
              firstName: undefined,
              lastName: record.employee.lastName,
              employeeId: record.employee.employeeId,
              user: {
                name: record.employee.user.name,
                email: record.employee.user.email
              }
            },
            records: []
          }
        }
        acc[empId].records.push(record)
      }
      return acc
    }, {} as Record<string, { 
      employee: {
        firstName: ReactNode
        lastName: ReactNode
        employeeId: ReactNode
        user: {
          name: string
          email: string
        } 
        id: string; 
        name: string; 
        email: string; 
        department?: { name: string }; 
      }, 
      records: AttendanceData[] 
    }>) : 
    null

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading attendance...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Attendance
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[120px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isAdminView && attendanceByEmployee ? (
            /* Admin View - Employee List with Monthly Summary */
            <div className="space-y-4">
              {Object.values(attendanceByEmployee).map(({ employee, records }) => (
                <div key={employee.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{employee.firstName} {employee.lastName}</h3>
                      <p className="text-sm text-gray-600">{employee.employeeId} • {employee.user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {records.filter(r => r.status === 'PRESENT').length} Present
                      </Badge>
                      <Badge variant="outline">
                        {records.filter(r => r.status === 'ABSENT').length} Absent
                      </Badge>
                      <Badge variant="outline">
                        {records.filter(r => r.status === 'LATE').length} Late
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Mini Calendar for Employee */}
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                      <div key={day} className="p-1 text-center font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                    {calendarDays.map(date => {
                      const attendanceRecord = records.find(record => 
                        isSameDay(new Date(record.date), date)
                      )
                      const isCurrentDay = isToday(date)
                      const isWeekendDay = isWeekend(date)

                      return (
                        <div
                          key={date.toISOString()}
                          className={`
                            p-1 min-h-[30px] border rounded text-center
                            ${isCurrentDay ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
                            ${isWeekendDay ? 'bg-gray-50' : ''}
                          `}
                        >
                          <div className="text-xs font-medium">
                            {format(date, 'd')}
                          </div>
                          {attendanceRecord && (
                            <div className="text-xs">
                              {attendanceRecord.checkIn && (
                                <div className="text-green-600">
                                  {format(new Date(attendanceRecord.checkIn), 'HH:mm')}
                                </div>
                              )}
                              {attendanceRecord.checkOut && (
                                <div className="text-blue-600">
                                  {format(new Date(attendanceRecord.checkOut), 'HH:mm')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Employee View - Full Calendar */
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
              {calendarDays.map(date => {
                const attendanceRecord = getAttendanceForDate(date)
                const regularizationRequest = getRegularizationRequestForDate(date)
                const isCurrentDay = isToday(date)
                const isWeekendDay = isWeekend(date)

                return (
                  <div
                    key={date.toISOString()}
                    className={`
                      p-2 min-h-[80px] border rounded-lg cursor-pointer transition-colors
                      ${isCurrentDay ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
                      ${isWeekendDay ? 'bg-gray-50' : ''}
                      hover:bg-gray-50
                    `}
                    onClick={() => {
                      if (attendanceRecord && !attendanceRecord.isRegularized && !isAdminView) {
                        setSelectedDate(date)
                        setRegularizationDialogOpen(true)
                      }
                    }}
                  >
                    <div className="text-sm font-medium mb-1">
                      {format(date, 'd')}
                    </div>
                    
                    {attendanceRecord ? (
                      <div className="space-y-1">
                        <div className="text-xs">
                          {attendanceRecord.checkIn && (
                            <div className="text-green-600">
                              In: {format(new Date(attendanceRecord.checkIn), 'HH:mm')}
                            </div>
                          )}
                          {attendanceRecord.checkOut && (
                            <div className="text-blue-600">
                              Out: {format(new Date(attendanceRecord.checkOut), 'HH:mm')}
                            </div>
                          )}
                        </div>
                        <div className="text-xs">
                          {getStatusBadge(attendanceRecord.status, attendanceRecord.isRegularized)}
                        </div>
                        {regularizationRequest && (
                          <div className="text-xs">
                            <Badge variant="outline" className="text-xs">
                              <FileText className="h-2 w-2 mr-1" />
                              {regularizationRequest.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">
                        {isWeekendDay ? 'Weekend' : 'No record'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Summary */}
          {!isAdminView && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {attendance.filter(a => a.status === 'PRESENT').length}
                </div>
                <div className="text-sm text-green-600">Present</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {attendance.filter(a => a.status === 'ABSENT').length}
                </div>
                <div className="text-sm text-red-600">Absent</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {attendance.filter(a => a.status === 'LATE').length}
                </div>
                <div className="text-sm text-yellow-600">Late</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {attendance.filter(a => a.isRegularized).length}
                </div>
                <div className="text-sm text-blue-600">Regularized</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regularization Request Dialog */}
      <Dialog open={regularizationDialogOpen} onOpenChange={setRegularizationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Attendance Regularization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input
                value={selectedDate ? format(selectedDate, 'MMMM do, yyyy') : ''}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason for Regularization *</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a detailed reason for requesting attendance regularization..."
                value={regularizationReason}
                onChange={(e) => setRegularizationReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRegularizationDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRegularizationRequest}
                disabled={submittingRegularization || !regularizationReason.trim()}
              >
                {submittingRegularization ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
