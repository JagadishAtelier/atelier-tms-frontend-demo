import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  FolderKanban,
  Calendar,
  ArrowRight,
} from 'lucide-react';
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
import type { User, Task, AttendanceRecord } from '../types';

interface DashboardProps {
  currentUser: User;
  tasks: Task[];
  attendance: AttendanceRecord[];
  onNavigate: (page: string) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function Dashboard({ currentUser, tasks, attendance, onNavigate }: DashboardProps) {
  // Filter tasks relevant to current user
  const myTasks = tasks.filter((task) =>
    currentUser.role === 'Super Admin' || currentUser.role === 'Admin'
      ? true
      : currentUser.role === 'Manager'
      ? task.department === currentUser.department
      : task.assignedTo.includes(currentUser.id)
  );

  const tasksByStatus = {
    'To Do': myTasks.filter((t) => t.status === 'To Do').length,
    'In Progress': myTasks.filter((t) => t.status === 'In Progress').length,
    'Completed': myTasks.filter((t) => t.status === 'Completed').length,
    'On Hold': myTasks.filter((t) => t.status === 'On Hold').length,
  };

  const overdueTasks = myTasks.filter(
    (t) => new Date(t.dueDate) < new Date() && t.status !== 'Completed'
  );

  // Today's attendance
  const todayAttendance = attendance.filter((a) => {
    const today = new Date().toISOString().split('T')[0];
    return a.date === today;
  });

  const myAttendance = todayAttendance.find((a) => a.userId === currentUser.id);

  // Chart data
  const taskStatusData = Object.entries(tasksByStatus).map(([name, value]) => ({
    name,
    value,
  }));

  const weeklyTaskData = [
    { day: 'Mon', completed: 3, created: 2 },
    { day: 'Tue', completed: 5, created: 4 },
    { day: 'Wed', completed: 4, created: 3 },
    { day: 'Thu', completed: 6, created: 5 },
    { day: 'Fri', completed: 4, created: 6 },
    { day: 'Sat', completed: 2, created: 1 },
    { day: 'Sun', completed: 1, created: 0 },
  ];

  const departmentData = [
    { name: 'Development', tasks: 15 },
    { name: 'Design', tasks: 8 },
    { name: 'Marketing', tasks: 5 },
    { name: 'HR', tasks: 3 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1>Welcome back, {currentUser.name}!</h1>
        <p className="text-gray-500">
          Here's what's happening with your tasks today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{myTasks.length}</div>
            <p className="text-xs text-gray-500">
              {tasksByStatus['Completed']} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{tasksByStatus['In Progress']}</div>
            <p className="text-xs text-gray-500">
              {tasksByStatus['To Do']} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{overdueTasks.length}</div>
            <p className="text-xs text-gray-500">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Today's Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {myAttendance?.totalHours?.toFixed(1) || '0.0'}h
            </div>
            <p className="text-xs text-gray-500">
              {myAttendance ? 'Checked in' : 'Not checked in'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
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
                  outerRadius={80}
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

        {/* Weekly Task Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Task Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyTaskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
                <Bar dataKey="created" fill="#3b82f6" name="Created" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Tasks</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('tasks')}
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between border-b pb-4 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm">{task.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={
                        task.status === 'Completed' ? 'default' :
                        task.status === 'In Progress' ? 'secondary' :
                        task.status === 'On Hold' ? 'outline' :
                        'destructive'
                      } className="text-xs">
                        {task.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      task.priority === 'Urgent' ? 'destructive' :
                      task.priority === 'High' ? 'default' :
                      'outline'
                    }
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Performance (Admin/Manager view) */}
        {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button
              variant="outline"
              className="flex items-center justify-start"
              onClick={() => onNavigate('tasks')}
            >
              <FolderKanban className="mr-2 h-4 w-4" />
              View All Tasks
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-start"
              onClick={() => onNavigate('attendance')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Check Attendance
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-start"
              onClick={() => onNavigate('timetracking')}
            >
              <Clock className="mr-2 h-4 w-4" />
              Track Time
            </Button>
            {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && (
              <Button
                variant="outline"
                className="flex items-center justify-start"
                onClick={() => onNavigate('users')}
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
