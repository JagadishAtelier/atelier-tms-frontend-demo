import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { LogIn, LogOut, Clock, Download, FileText, User } from 'lucide-react';
import type { AttendanceRecord, User as UserType } from '../types';

interface AttendanceManagementProps {
  attendance: AttendanceRecord[];
  users: UserType[];
  currentUser: UserType;
}

export function AttendanceManagement({
  attendance,
  users,
  currentUser,
}: AttendanceManagementProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  const today = new Date().toISOString().split('T')[0];
  const myTodayAttendance = attendance.find(
    (a) => a.userId === currentUser.id && a.date === today
  );

  const isCheckedIn = myTodayAttendance && !myTodayAttendance.checkOut;

  // Filter attendance based on view and selection
  let filteredAttendance = attendance.filter((a) => {
    if (currentUser.role === 'Employee' && currentUser.role !== 'Manager') {
      return a.userId === currentUser.id;
    }
    if (selectedUser !== 'all') {
      return a.userId === selectedUser;
    }
    return true;
  });

  // Get today's attendance for display
  const todayAttendance = filteredAttendance.filter((a) => a.date === today);

  const handleCheckIn = () => {
    console.log('Check in at:', new Date().toISOString());
  };

  const handleCheckOut = () => {
    console.log('Check out at:', new Date().toISOString());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge variant="default">Present</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'manual':
        return <Badge variant="outline">Manual Entry</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalWorkingHours = todayAttendance.reduce(
    (sum, a) => sum + (a.totalHours || 0),
    0
  );
  const averageWorkingHours = todayAttendance.length > 0
    ? totalWorkingHours / todayAttendance.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Attendance Management</h1>
          <p className="text-gray-500">Track daily attendance and working hours</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Check In/Out Section */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Check-In/Out</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex-1 space-y-2">
              <p className="text-sm text-gray-600">Current Status</p>
              {myTodayAttendance ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      Checked In: {new Date(myTodayAttendance.checkIn).toLocaleTimeString()}
                    </span>
                  </div>
                  {myTodayAttendance.checkOut && (
                    <div className="flex items-center gap-2">
                      <LogOut className="h-4 w-4 text-red-600" />
                      <span className="text-sm">
                        Checked Out: {new Date(myTodayAttendance.checkOut).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  {myTodayAttendance.totalHours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">
                        Total Hours: {myTodayAttendance.totalHours.toFixed(2)}h
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Not checked in yet</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCheckIn}
                disabled={isCheckedIn}
                variant={isCheckedIn ? 'secondary' : 'default'}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {isCheckedIn ? 'Checked In' : 'Check In'}
              </Button>
              <Button
                onClick={handleCheckOut}
                disabled={!isCheckedIn}
                variant={!isCheckedIn ? 'secondary' : 'destructive'}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Check Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Present Today</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {todayAttendance.filter((a) => a.status === 'present').length}
            </div>
            <p className="text-xs text-gray-500">
              Out of {users.filter((u) => u.isActive && u.role !== 'Client').length} employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Avg Working Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{averageWorkingHours.toFixed(1)}h</div>
            <p className="text-xs text-gray-500">Today's average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pending Check-Out</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {todayAttendance.filter((a) => a.status === 'pending').length}
            </div>
            <p className="text-xs text-gray-500">Still working</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users
                    .filter((u) => u.isActive && u.role !== 'Client')
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.department})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                  {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && (
                    <TableHead>Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  todayAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.userName}</TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {new Date(record.checkIn).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        {record.checkOut
                          ? new Date(record.checkOut).toLocaleTimeString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {record.totalHours ? `${record.totalHours.toFixed(2)}h` : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && (
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Attendance</DialogTitle>
                                <DialogDescription>
                                  Manually edit attendance record for {record.userName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-sm text-gray-500">
                                  Manual attendance editing would be available here
                                </p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
