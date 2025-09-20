import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, User, CheckCircle, DollarSign, FileText } from 'lucide-react'
import Link from 'next/link'

// Mock data for employee dashboard
const employeeStats = {
  totalLeaves: 20,
  usedLeaves: 8,
  remainingLeaves: 12,
  attendanceRate: 95,
  currentStreak: 5,
}

const recentAttendance = [
  { date: 'Dec 13, 2024', checkIn: '09:15 AM', checkOut: '06:30 PM', status: 'Present' },
  { date: 'Dec 12, 2024', checkIn: '09:00 AM', checkOut: '06:00 PM', status: 'Present' },
  { date: 'Dec 11, 2024', checkIn: '09:30 AM', checkOut: '06:45 PM', status: 'Late' },
  { date: 'Dec 10, 2024', checkIn: '09:10 AM', checkOut: '06:20 PM', status: 'Present' },
]

const leaveRequests = [
  { id: 1, type: 'Vacation', startDate: 'Dec 20, 2024', endDate: 'Dec 25, 2024', status: 'Approved' },
  { id: 2, type: 'Sick Leave', startDate: 'Dec 15, 2024', endDate: 'Dec 15, 2024', status: 'Pending' },
  { id: 3, type: 'Personal', startDate: 'Dec 10, 2024', endDate: 'Dec 10, 2024', status: 'Approved' },
]

export default function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here&apos;s your personal overview.</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link href="/dashboard/attendance">
          <Button>
            <Clock className="mr-2 h-4 w-4" />
            Check In/Out
          </Button>
        </Link>
        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Request Leave
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leaves</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeStats.totalLeaves}</div>
            <p className="text-xs text-muted-foreground">
              Annual allocation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used Leaves</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeStats.usedLeaves}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((employeeStats.usedLeaves / employeeStats.totalLeaves) * 100)}% used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Leaves</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeStats.remainingLeaves}</div>
            <p className="text-xs text-muted-foreground">
              Available for use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeStats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Current streak: {employeeStats.currentStreak} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance and Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Your recent check-in/out records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAttendance.map((record, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{record.date}</p>
                    <p className="text-xs text-gray-500">{record.checkIn} - {record.checkOut}</p>
                  </div>
                  <Badge variant={record.status === 'Present' ? 'default' : 'secondary'}>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>Your recent leave applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{request.type}</p>
                    <p className="text-xs text-gray-500">{request.startDate} - {request.endDate}</p>
                  </div>
                  <Badge 
                    variant={
                      request.status === 'Approved' ? 'default' : 
                      request.status === 'Pending' ? 'secondary' : 'destructive'
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payroll Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payroll & Payslips
            </CardTitle>
            <CardDescription>
              Access your payslips and manage payroll-related requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard/payslips">
                <Button className="w-full h-16 flex flex-col items-center justify-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span>View Payslips</span>
                </Button>
              </Link>
              <Link href="/dashboard/payroll">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Payroll History</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
