import { useState, useEffect } from 'react';
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
  Loader2,
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
import type { User } from '../types';
import { getAdminDashboardApi } from './service/dashboardService';
import Loading from './loading';

interface DashboardProps {
  currentUser: User;
  onNavigate: (page: string) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function Dashboard({ currentUser, onNavigate }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminDashboardApi();
      const data = response.data?.data || response.data;
      setDashboardData(data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return Loading();
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600">No dashboard data available</p>
      </div>
    );
  }

  const { tasks, projects, employees, recentTasks } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1>Welcome back, {currentUser.username}!</h1>
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
            <div className="text-2xl font-bold">{tasks?.total || 0}</div>
            <p className="text-xs text-gray-500">
              {tasks?.completed || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks?.inProgress || 0}</div>
            <p className="text-xs text-gray-500">
              {tasks?.notStarted || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks?.overdue || 0}</div>
            <p className="text-xs text-gray-500">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects?.active || 0}</div>
            <p className="text-xs text-gray-500">
              {projects?.total || 0} total projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
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
              {(recentTasks || []).slice(0, 5).map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between border-b pb-4 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant={
                          task.status === 'Completed' ? 'default' :
                            task.status === 'In Progress' ? 'secondary' :
                              task.status === 'On Hold' ? 'outline' :
                                'destructive'
                        }
                        className="text-xs"
                      >
                        {task.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {task.project?.name || 'No project'}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      task.priority === 'Urgent' || task.priority === 'High' ? 'destructive' :
                        task.priority === 'Medium' ? 'default' :
                          'outline'
                    }
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
              {(!recentTasks || recentTasks.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent tasks
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Task Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Task Completion Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tasks?.completionTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  name="Completed Tasks"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>



        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tasks?.byStatus || []}
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
                  {(tasks?.byStatus || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Task Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tasks?.byPriority || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Team Overview (Admin/Manager view) */}
      {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees?.total || 0}</div>
              <p className="text-xs text-gray-500">
                {employees?.active || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Present Today</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees?.presentToday || 0}</div>
              <p className="text-xs text-gray-500">
                Attendance marked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Tasks Created Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks?.createdToday || 0}</div>
              <p className="text-xs text-gray-500">
                {tasks?.createdThisWeek || 0} this week
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
