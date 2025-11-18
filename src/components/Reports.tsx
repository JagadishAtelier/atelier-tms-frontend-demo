import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  CheckCircle,
  Clock,
} from 'lucide-react';
import type { Task, AttendanceRecord, User, Department } from '../types';

interface ReportsProps {
  tasks: Task[];
  attendance: AttendanceRecord[];
  users: User[];
  departments: Department[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Reports({ tasks, attendance, users, departments }: ReportsProps) {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');

  // Filter tasks by department
  const filteredTasks = selectedDepartment === 'All'
    ? tasks
    : tasks.filter((t) => t.department === selectedDepartment);

  // Task Statistics
  const completedTasks = filteredTasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'In Progress').length;
  const overdueTasks = filteredTasks.filter(
    (t) => new Date(t.dueDate) < new Date() && t.status !== 'Completed'
  ).length;
  const totalTasks = filteredTasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Department-wise task distribution
  const departmentTaskData = departments.map((dept) => {
    const deptTasks = tasks.filter((t) => t.department === dept.name);
    return {
      name: dept.name,
      total: deptTasks.length,
      completed: deptTasks.filter((t) => t.status === 'Completed').length,
      inProgress: deptTasks.filter((t) => t.status === 'In Progress').length,
      pending: deptTasks.filter((t) => t.status === 'To Do').length,
    };
  });

  // User performance data
  const userPerformanceData = users
    .filter((u) => u.role === 'Employee' || u.role === 'Manager')
    .map((user) => {
      const userTasks = tasks.filter((t) => t.assignedTo.includes(user.id));
      const userAttendance = attendance.filter((a) => a.userId === user.id);
      const totalHours = userAttendance.reduce((sum, a) => sum + (a.totalHours || 0), 0);
      return {
        name: user.name,
        tasksCompleted: userTasks.filter((t) => t.status === 'Completed').length,
        tasksTotal: userTasks.length,
        hoursWorked: totalHours,
        department: user.department,
      };
    })
    .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
    .slice(0, 10);

  // Task status distribution
  const taskStatusData = [
    { name: 'Completed', value: filteredTasks.filter((t) => t.status === 'Completed').length },
    { name: 'In Progress', value: filteredTasks.filter((t) => t.status === 'In Progress').length },
    { name: 'To Do', value: filteredTasks.filter((t) => t.status === 'To Do').length },
    { name: 'On Hold', value: filteredTasks.filter((t) => t.status === 'On Hold').length },
  ];

  // Priority distribution
  const priorityData = [
    { name: 'Urgent', value: filteredTasks.filter((t) => t.priority === 'Urgent').length },
    { name: 'High', value: filteredTasks.filter((t) => t.priority === 'High').length },
    { name: 'Medium', value: filteredTasks.filter((t) => t.priority === 'Medium').length },
    { name: 'Low', value: filteredTasks.filter((t) => t.priority === 'Low').length },
  ];

  // Weekly trend data
  const weeklyTrendData = [
    { week: 'Week 1', created: 12, completed: 8, hours: 320 },
    { week: 'Week 2', created: 15, completed: 12, hours: 340 },
    { week: 'Week 3', created: 10, completed: 14, hours: 315 },
    { week: 'Week 4', created: 18, completed: 11, hours: 335 },
  ];

  // Monthly trend data
  const monthlyTrendData = [
    { month: 'Jul', created: 48, completed: 42, hours: 1280 },
    { month: 'Aug', created: 52, completed: 48, hours: 1320 },
    { month: 'Sep', created: 45, completed: 50, hours: 1300 },
    { month: 'Oct', created: 60, completed: 52, hours: 1350 },
    { month: 'Nov', created: 55, completed: 45, hours: 1310 },
  ];

  const trendData = reportType === 'weekly' ? weeklyTrendData : monthlyTrendData;

  // Attendance summary
  const totalWorkingHours = attendance.reduce((sum, a) => sum + (a.totalHours || 0), 0);
  const averageWorkingHours = attendance.length > 0 ? totalWorkingHours / attendance.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="text-gray-500">
            Comprehensive performance and productivity insights
          </p>
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalTasks}</div>
            <p className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              {completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{completionRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">
              {completedTasks} of {totalTasks} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Overdue Tasks</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{overdueTasks}</div>
            <p className="text-xs text-red-600">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Avg Working Hours</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{averageWorkingHours.toFixed(1)}h</div>
            <p className="text-xs text-gray-500">Per employee</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>{reportType === 'weekly' ? 'Weekly' : 'Monthly'} Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={reportType === 'weekly' ? 'week' : 'month'} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Created" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentTaskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
                <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" />
                <Bar dataKey="pending" fill="#ef4444" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userPerformanceData.map((user, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-gray-500">Tasks</p>
                    <p className="text-lg">
                      {user.tasksCompleted}/{user.tasksTotal}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Hours</p>
                    <p className="text-lg">{user.hoursWorked.toFixed(0)}h</p>
                  </div>
                  <Badge variant="default">
                    {user.tasksTotal > 0
                      ? ((user.tasksCompleted / user.tasksTotal) * 100).toFixed(0)
                      : 0}
                    % Rate
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Report Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="mb-2">Task Statistics</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="text-lg">{totalTasks}</p>
                </div>
                <div>
                  <p className="text-gray-500">Completed</p>
                  <p className="text-lg text-green-600">{completedTasks}</p>
                </div>
                <div>
                  <p className="text-gray-500">In Progress</p>
                  <p className="text-lg text-blue-600">{inProgressTasks}</p>
                </div>
                <div>
                  <p className="text-gray-500">Overdue</p>
                  <p className="text-lg text-red-600">{overdueTasks}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-2">Attendance & Hours</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Total Records</p>
                  <p className="text-lg">{attendance.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Hours</p>
                  <p className="text-lg">{totalWorkingHours.toFixed(0)}h</p>
                </div>
                <div>
                  <p className="text-gray-500">Average Hours</p>
                  <p className="text-lg">{averageWorkingHours.toFixed(1)}h</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
