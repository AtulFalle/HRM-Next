'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Navigation
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

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
}

export function AttendanceCheckin() {
  const [attendance, setAttendance] = useState<AttendanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Get current location
  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }

          // Try to get address from coordinates
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${locationData.latitude}&longitude=${locationData.longitude}&localityLanguage=en`
            )
            const data = await response.json()
            locationData.address = data.localityInfo?.administrative?.[0]?.name || 'Unknown location'
          } catch (error) {
            console.warn('Could not fetch address:', error)
            locationData.address = 'Location captured'
          }

          resolve(locationData)
        },
        (error) => {
          let errorMessage = 'Unable to get location'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
          }
          reject(new Error(errorMessage))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  // Fetch today's attendance
  const fetchTodayAttendance = async () => {
    try {
      const response = await fetch('/api/attendance')
      const result = await response.json()
      
      if (result.success) {
        const today = new Date().toISOString().split('T')[0]
        const todayAttendance = result.data.find((record: AttendanceData) => 
          record.date.startsWith(today)
        )
        setAttendance(todayAttendance || null)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      toast.error('Failed to fetch attendance data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodayAttendance()
  }, [])

  // Handle check-in/checkout
  const handleAttendanceAction = async (action: 'checkin' | 'checkout') => {
    setActionLoading(true)
    setLocationError(null)

    try {
      // Get current location
      const currentLocation = await getCurrentLocation()
      setLocation(currentLocation)

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          location: currentLocation,
          notes: notes.trim() || null
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`${action === 'checkin' ? 'Checked in' : 'Checked out'} successfully`)
        setNotes('')
        await fetchTodayAttendance()
      } else {
        toast.error(result.error || 'Failed to update attendance')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('location')) {
        setLocationError(error.message)
        toast.error(error.message)
      } else {
        console.error('Error updating attendance:', error)
        toast.error('Failed to update attendance')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
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
      </Badge>
    )
  }

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
      {/* Current Time Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-mono font-bold text-center">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <div className="text-center text-gray-600 mt-2">
            {format(currentTime, 'EEEE, MMMM do, yyyy')}
          </div>
        </CardContent>
      </Card>

      {/* Check-in/Checkout Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Daily Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Status */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <MapPin className="h-4 w-4 text-gray-600" />
            <div className="flex-1">
              {location ? (
                <div>
                  <div className="text-sm font-medium">Location Captured</div>
                  <div className="text-xs text-gray-600">{location.address}</div>
                </div>
              ) : locationError ? (
                <div className="text-sm text-red-600">{locationError}</div>
              ) : (
                <div className="text-sm text-gray-600">Location will be captured when you check in/out</div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about your attendance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => handleAttendanceAction('checkin')}
              disabled={actionLoading || !!attendance?.checkIn}
              className="flex-1"
              size="lg"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {attendance?.checkIn ? 'Already Checked In' : 'Check In'}
            </Button>
            
            <Button
              onClick={() => handleAttendanceAction('checkout')}
              disabled={actionLoading || !attendance?.checkIn || !!attendance?.checkOut}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {attendance?.checkOut ? 'Already Checked Out' : 'Check Out'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Attendance Status */}
      {attendance && (
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Check In</div>
                <div className="text-lg font-bold">
                  {attendance.checkIn ? format(new Date(attendance.checkIn), 'HH:mm') : 'Not checked in'}
                </div>
                {attendance.checkInLocation && (
                  <div className="text-xs text-green-600 mt-1">
                    {attendance.checkInLocation.address}
                  </div>
                )}
              </div>
              
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Check Out</div>
                <div className="text-lg font-bold">
                  {attendance.checkOut ? format(new Date(attendance.checkOut), 'HH:mm') : 'Not checked out'}
                </div>
                {attendance.checkOutLocation && (
                  <div className="text-xs text-blue-600 mt-1">
                    {attendance.checkOutLocation.address}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              {getStatusBadge(attendance.status)}
            </div>

            {attendance.notes && (
              <div>
                <span className="text-sm font-medium">Notes:</span>
                <p className="text-sm text-gray-600 mt-1">{attendance.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
