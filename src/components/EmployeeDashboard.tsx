import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Info, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Clock,
  LogIn,
  LogOut,
  Coffee,
  CheckCircle2,
  PlayCircle,
  Calendar,
  TrendingUp,
  Activity,
  Bell,
  BarChart3,
  ListTodo,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Alert, AlertDescription } from './ui/alert';
import type { User, Task, AttendanceRecord } from '../types';

interface EmployeeDashboardProps {
  currentUser: User;
  tasks: Task[];
  attendance: AttendanceRecord[];
  onNavigate: (page: string) => void;
}

export function EmployeeDashboard({
  currentUser,
  tasks,
  attendance,
  onNavigate,
}: EmployeeDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [totalHours, setTotalHours] = useState<number>(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [showCheckoutReminder, setShowCheckoutReminder] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if user needs checkout reminder (after 9 hours)
  useEffect(() => {
    if (isCheckedIn && checkInTime) {
      const hoursWorked = (currentTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      if (hoursWorked > 9 && !checkOutTime) {
        setShowCheckoutReminder(true);
      }
    }
  }, [currentTime, isCheckedIn, checkInTime, checkOutTime]);

  // Calculate total hours
  useEffect(() => {
    if (checkInTime && !checkOutTime) {
      const hours = (currentTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      setTotalHours(hours);
    } else if (checkInTime && checkOutTime) {
      const hours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      setTotalHours(hours);
    }
  }, [currentTime, checkInTime, checkOutTime]);

  // Filter tasks for current user
  const myTasks = tasks.filter((task) => task.assignedTo.includes(currentUser.id));

  const todayTasks = {
    pending: myTasks.filter((t) => t.status === 'To Do').length,
    inProgress: myTasks.filter((t) => t.status === 'In Progress').length,
    completed: myTasks.filter((t) => t.status === 'Completed').length,
  };

  const overdueTasks = myTasks.filter(
    (t) => new Date(t.dueDate) < new Date() && t.status !== 'Completed'
  );

  // Mock data for performance chart
  const weeklyPerformance = [
    { day: 'Mon', tasks: 5, hours: 7.5 },
    { day: 'Tue', tasks: 6, hours: 8.2 },
    { day: 'Wed', tasks: 4, hours: 7.8 },
    { day: 'Thu', tasks: 7, hours: 8.5 },
    { day: 'Fri', tasks: 5, hours: 7.2 },
    { day: 'Sat', tasks: 2, hours: 4.0 },
    { day: 'Sun', tasks: 1, hours: 2.0 },
  ];

  // Recent activities
  const recentActivities = [
    { id: 1, action: 'Completed task "API Integration"', time: '10 mins ago', icon: CheckCircle2, color: 'text-gray-900 ' },
    { id: 2, action: 'Started working on "Dashboard UI"', time: '1 hour ago', icon: PlayCircle, color: 'text-[#10b981]' },
    { id: 3, action: 'Submitted timesheet for approval', time: '2 hours ago', icon: Clock, color: 'text-[#f59e0b]' },
    { id: 4, action: 'Joined team meeting', time: '3 hours ago', icon: Activity, color: 'text-[#3b82f6]' },
  ];

  // Notifications
  const notifications = [
    { id: 1, message: 'New task assigned: Mobile App Design', type: 'info', time: '5 mins ago' },
    { id: 2, message: 'Team meeting at 3:00 PM', type: 'warning', time: '30 mins ago' },
    { id: 3, message: 'Your leave request was approved', type: 'success', time: '1 hour ago' },
  ];

  const handleCheckIn = () => {
    const now = new Date();
    setCheckInTime(now);
    setIsCheckedIn(true);
    setCheckOutTime(null);
  };

  const handleCheckOut = () => {
    setCheckOutTime(new Date());
    setIsCheckedIn(false);
    setIsOnBreak(false);
    setShowCheckoutReminder(false);
  };

  const handleBreakStart = () => {
    setIsOnBreak(true);
    setBreakStartTime(new Date());
  };

  const handleBreakEnd = () => {
    setIsOnBreak(false);
    setBreakStartTime(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
<div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Welcome back, {currentUser.username}!</h1>
          <p className="text-gray-400 mt-1">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl text-gray-900">{formatTime(currentTime)}</div>
          <p className="text-gray-400 text-sm mt-1">Current Time</p>
        </div>
      </div>

      {/* Checkout Reminder Alert */}
      {showCheckoutReminder && (
        <Alert className="bg-[#122B57] border-[#00B4D8] border-2 animate-pulse">
          <AlertCircle className="h-4 w-4 text-gray-900" />
          <AlertDescription className="text-gray-900">
            You've been working for over 9 hours. Don't forget to check out!
          </AlertDescription>
        </Alert>
      )}

      {/* Attendance Section - First Priority ""*/}
      <Card className="bg-white border border-gray-200 shadow-sm rounded-xl shadow-[#00B4D8]/10 transition-all duration-300 hover:shadow-[#00B4D8]/20">
      <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-700" />
              Today's Attendance
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${isCheckedIn && !checkOutTime ? 'bg-gray-900   animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isCheckedIn && !checkOutTime ? 'Active' : 'Checked Out'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Check In */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">In Time</span>
                <LogIn className="h-4 w-4 text-[#10b981]" />
              </div>
              {checkInTime ? (
                <div className="text-2xl text-gray-900">{formatTime(checkInTime)}</div>
              ) : (
                <Button
                  onClick={handleCheckIn}
                  className="w-full bg-[#10b981] hover:bg-[#10b981]/90 text-white transition-all duration-300 hover:scale-105 shadow-lg shadow-[#10b981]/30"
                  disabled={isCheckedIn}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Check In
                </Button>

              )}
            </div>

            {/* Check Out */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">Out Time</span>
                <LogOut className="h-4 w-4 text-[#ef4444]" />
              </div>
              {checkOutTime ? (
                <div className="text-2xl text-gray-900">{formatTime(checkOutTime)}</div>
              ) : (
                 <Button
                  onClick={handleCheckOut}
                  className="w-full bg-[#ef4444] hover:bg-[#ef4444]/90 text-white transition-all duration-300 hover:scale-105 shadow-lg shadow-[#ef4444]/30"
                  disabled={!isCheckedIn || !!checkOutTime}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Check Out
                </Button>

              )}
            </div>

            {/* Total Hours */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">Total Hours</span>
                <Clock className="h-4 w-4 text-gray-900" />
              </div>
              <div className="text-2xl text-gray-900">{totalHours.toFixed(1)}h</div>
              <div className="text-xs text-gray-500 mt-1">
                {totalHours >= 8 ? 'Full day completed' : `${(8 - totalHours).toFixed(1)}h remaining`}
              </div>
            </div>

            {/* Status / Break */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">Break</span>
                <Coffee className="h-4 w-4 text-[#f59e0b]" />
              </div>
              {isOnBreak ? (
                <div>
                  <div className="text-sm text-[#f59e0b] mb-2">On Break</div>
                  <Button
                    onClick={handleBreakEnd}
                    size="sm"
                    className="w-full bg-[#00B4D8] hover:bg-[#00B4D8]/90 text-gray-900"
                  >
                    End Break
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleBreakStart}
                  size="sm"
                  className="w-full bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-gray-900"
                  disabled={!isCheckedIn || !!checkOutTime}
                >
                  <Coffee className="mr-2 h-4 w-4" />
                  Start Break
                </Button>
              )}
            </div>
          </div>

          {/* Attendance History Link */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              className="text-gray-900 hover:text-gray-900/80 hover:bg-[#00B4D8]/10"
              onClick={() => onNavigate('attendance')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              View Attendance History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Widgets - 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        {/* Recent Activities */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
  <CardHeader className="border-b border-gray-200 bg-white">
    <CardTitle className="text-gray-900 flex items-center gap-2">
      <Activity className="h-5 w-5 text-gray-700" />
      Recent Activities
    </CardTitle>
  </CardHeader>

  <CardContent className="pt-6">
    <div className="space-y-4">
      {recentActivities.map((activity) => {
        const Icon = activity.icon;
        return (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-all hover:bg-gray-100"
          >
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-gray-700" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 text-sm">
                {activity.action}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {activity.time}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  </CardContent>
</Card>

        {/* Performance Chart */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl transition-all duration-300 hover:shadow-md hover:border-gray-300 overflow-hidden">
        <CardHeader className="border-b border-gray-200 bg-white">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-900 group-hover:scale-110 transition-transform" />
              Weekly Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" opacity={0.1} />
                <XAxis dataKey="day" stroke="#fff" tick={{ fill: '#9ca3af' }} />
                <YAxis stroke="#fff" tick={{ fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    color: '#111827'
                  }}
                  
                />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="#6b7280"

                  strokeWidth={3}
                  dot={{ fill: '#00B4D8', r: 5 }}
                  activeDot={{ r: 7, fill: '#10b981' }}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5 }}
                  activeDot={{ r: 7, fill: '#00B4D8' }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#00B4D8]"></div>
                <span className="text-sm text-gray-400">Tasks Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-900  "></div>
                <span className="text-sm text-gray-400">Hours Worked</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        {/* Today's Tasks */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl transition-all duration-300 hover:shadow-md hover:border-gray-300 overflow-hidden">
        <CardHeader className="border-b border-gray-200 bg-white">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-gray-900 group-hover:scale-110 transition-transform" />
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 transition-all hover:bg-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <div className="text-gray-900">Pending</div>
                    <div className="text-xs text-gray-400">To be started</div>
                  </div>
                </div>
                <div className="text-2xl text-gray-900">{todayTasks.pending}</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 transition-all hover:bg-gray-100">
                <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <PlayCircle className="h-6 w-6 text-gray-900" />
                  </div>
                  <div>
                    <div className="text-gray-900">In Progress</div>
                    <div className="text-xs text-gray-400">Currently working</div>
                  </div>
                </div>
                <div className="text-2xl text-gray-900">{todayTasks.inProgress}</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 transition-all hover:bg-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-900  /10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <div className="text-gray-900">Completed</div>
                    <div className="text-xs text-gray-400">Done today</div>
                  </div>
                </div>
                <div className="text-2xl text-gray-900">{todayTasks.completed}</div>
              </div>

              {overdueTasks.length > 0 && (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 transition-all hover:bg-gray-100">
    <div className="flex items-center gap-3">
      <AlertCircle className="h-6 w-6 text-gray-700" />
      <div className="text-gray-900">Overdue Tasks</div>
    </div>
    <div className="text-2xl text-gray-900">
      {overdueTasks.length}
    </div>
  </div>
)}
            </div>

            <Button
  variant="outline"
  className="
    w-full mt-4
    border-gray-300 text-gray-900
    hover:bg-gray-100
    active:bg-gray-200
    focus:ring-0 focus:ring-offset-0
    transition-all
  "
  onClick={() => onNavigate('tasks')}
>
  View All Tasks
</Button>

          </CardContent>
        </Card>
        {/* Performance Chart */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl transition-all duration-300 hover:shadow-md hover:border-gray-300 overflow-hidden">
        <CardHeader className="border-b border-gray-200 bg-white">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-900 group-hover:scale-110 transition-transform" />
              Weekly Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" opacity={0.1} />
                <XAxis dataKey="day" stroke="#fff" tick={{ fill: '#9ca3af' }} />
                <YAxis stroke="#fff" tick={{ fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    color: '#111827'
                  }}

                />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="#6b7280"

                  strokeWidth={3}
                  dot={{ fill: '#00B4D8', r: 5 }}
                  activeDot={{ r: 7, fill: '#10b981' }}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5 }}
                  activeDot={{ r: 7, fill: '#00B4D8' }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#00B4D8]"></div>
                <span className="text-sm text-gray-400">Tasks Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-900  "></div>
                <span className="text-sm text-gray-400">Hours Worked</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
  <CardHeader className="border-b border-gray-200 bg-white">
    <CardTitle className="text-gray-900 flex items-center gap-2">
      <Activity className="h-5 w-5 text-gray-700" />
      Recent Activities
    </CardTitle>
  </CardHeader>

  <CardContent className="pt-6">
    <div className="space-y-4">
      {recentActivities.map((activity) => {
        const Icon = activity.icon;
        return (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-all hover:bg-gray-100"
          >
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-gray-700" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 text-sm">
                {activity.action}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {activity.time}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  </CardContent>
</Card>

        {/* Notifications */}
<Card className="bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden group">
  <CardHeader className="border-b border-gray-200 bg-white">
    <CardTitle className="text-gray-900 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-gray-900 group-hover:scale-110 transition-transform" />
        Notifications
      </div>
      <Badge className="bg-gray-400 text-white">3</Badge>
    </CardTitle>
  </CardHeader>

  <CardContent className="pt-4">
    {(() => {
      const priorityStyles: Record<string, { bg: string; label: string }> = {
        LOW: { bg: "#6B7280", label: "LOW" },       // Gray
        HIGH: { bg: "#F59E0B", label: "HIGH" },    // Orange
        URGENT: { bg: "#EF4444", label: "URGENT" } // Red
      };

      const notifications = [
        {
          id: 1,
          project: "Website Redesign",
          time: "10:15 AM",
          message: "New task assigned",
          due: "2025-12-30",
          priority: "HIGH",
          icon: <Info className="h-5 w-5 text-black" />
        },
        {
          id: 2,
          project: "Mobile App Launch",
          time: "Yesterday",
          message: "Project deadline approaching",
          due: "2025-12-28",
          priority: "URGENT",
          icon: <AlertTriangle className="h-5 w-5 text-black" />
        },
        {
          id: 3,
          project: "Marketing Campaign",
          time: "2 days ago",
          message: "Meeting rescheduled",
          due: "2026-01-02",
          priority: "LOW",
          icon: <CheckCircle className="h-5 w-5 text-black" />
        }
      ];

      return (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="relative flex justify-between items-start p-4 rounded-xl shadow border border-gray-100 bg-gray-50 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center bg-white p-2 rounded-full shadow-md">
                  {notification.icon}
                </div>

                <div className="flex flex-col">
                  <p className="text-xs uppercase font-semibold text-gray-500">
                    {notification.project}
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {notification.message}
                  </p>

                  <div className="flex gap-4 text-xs text-gray-600 mt-1">
                    <span>Due: {notification.due}</span>
                    <span>{notification.time}</span>
                  </div>
                </div>
              </div>
              <span
                className="absolute top-2 right-2 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow"
                style={{ backgroundColor: priorityStyles[notification.priority].bg }}
              >
                {priorityStyles[notification.priority].label}
              </span>
            </div>
          ))}
        </div>
      );
    })()}

    <Button
  variant="outline"
  className="
    w-full mt-4
    border-gray-300
    bg-white
    text-gray-900
    hover:bg-white
    hover:text-gray-900
    active:bg-white
    focus:bg-white
    focus:ring-0
    transition-all
  "
>
  View All Notifications
</Button>

  </CardContent>
</Card>
      </div>

      {/* Productivity Metrics */}
      <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
  <CardHeader className="border-b border-gray-200">
    <CardTitle className="text-gray-900 flex items-center gap-2">
      <TrendingUp className="h-5 w-5 text-gray-700" />
      Productivity Insights
    </CardTitle>
  </CardHeader>
  <CardContent className="pt-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div
  className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center
    cursor-pointer
    transition-all duration-200
    hover:shadow-md
    hover:scale-[1.02]
    active:scale-[0.97] ">
  <div className="text-3xl text-gray-900 mb-2">92%</div>
  <div className="text-gray-500 text-sm">Task Completion Rate</div>
</div>
<div
  className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center
    cursor-pointer
    transition-all duration-200
    hover:shadow-md
    hover:scale-[1.02]
    active:scale-[0.97] ">
  <div className="text-3xl text-gray-900 mb-2">37.5</div>
  <div className="text-gray-500 text-sm">This Week</div>
</div>
<div
  className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center
    cursor-pointer
    transition-all duration-200
    hover:shadow-md
    hover:scale-[1.02]
    active:scale-[0.97] ">
  <div className="text-3xl text-gray-900 mb-2">4.2h</div>
  <div className="text-gray-500 text-sm">Avg.Task Duration</div>
</div>
<div
  className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center
    cursor-pointer
    transition-all duration-200
    hover:shadow-md
    hover:scale-[1.02]
    active:scale-[0.97] ">
  <div className="text-3xl text-gray-900 mb-2">28</div>
  <div className="text-gray-500 text-sm">Task This Month</div>
</div>
    </div>
  </CardContent>
</Card>
    </div>
  );
}
