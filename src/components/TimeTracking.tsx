import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Play, Pause, Clock, Calendar, TrendingUp } from 'lucide-react';
import type { Task, TimeEntry, User } from '../types';

interface TimeTrackingProps {
  tasks: Task[];
  timeEntries: TimeEntry[];
  currentUser: User;
}

export function TimeTracking({ tasks, timeEntries, currentUser }: TimeTrackingProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedTask, setSelectedTask] = useState<string>('all');

  // Filter tasks for current user
  const myTasks = tasks.filter(
    (task) =>
      currentUser.role === 'Super Admin' ||
      currentUser.role === 'Admin' ||
      task.assignedTo.includes(currentUser.id)
  );

  // Filter time entries
  const myTimeEntries = timeEntries.filter((entry) => entry.userId === currentUser.id);

  // Calculate total time today
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = myTimeEntries.filter((entry) =>
    entry.startTime.startsWith(today)
  );
  const totalTimeToday = todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

  // Calculate total time this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekEntries = myTimeEntries.filter(
    (entry) => new Date(entry.startTime) > weekAgo
  );
  const totalTimeWeek = weekEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

  // Get tasks with time tracking
  const tasksWithTime = myTasks.map((task) => {
    const taskEntries = myTimeEntries.filter((entry) => entry.taskId === task.id);
    const totalTime = taskEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    return {
      ...task,
      actualTimeSpent: totalTime,
      timeProgress: task.estimatedTime ? (totalTime / task.estimatedTime) * 100 : 0,
    };
  });

  const handleStartTimer = (taskId: string) => {
    setActiveTaskId(taskId);
    console.log('Timer started for task:', taskId);
  };

  const handleStopTimer = () => {
    console.log('Timer stopped for task:', activeTaskId);
    setActiveTaskId(null);
  };

  const getTaskStatus = (task: Task) => {
    if (task.status === 'Completed') return 'default';
    if (task.status === 'In Progress') return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Time Tracking</h1>
        <p className="text-gray-500">Track time spent on tasks and projects</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Today's Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalTimeToday.toFixed(1)}h</div>
            <Progress value={(totalTimeToday / 8) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalTimeWeek.toFixed(1)}h</div>
            <p className="text-xs text-gray-500">
              Avg: {(totalTimeWeek / 5).toFixed(1)}h per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Tasks</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {myTasks.filter((t) => t.status === 'In Progress').length}
            </div>
            <p className="text-xs text-gray-500">Being tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Timer */}
      {activeTaskId && (
        <Card className="border-blue-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Timer</CardTitle>
              <Badge variant="default" className="animate-pulse">
                Recording...
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">
                  {myTasks.find((t) => t.id === activeTaskId)?.title}
                </p>
                <p className="text-2xl">00:00:00</p>
              </div>
              <Button variant="destructive" onClick={handleStopTimer}>
                <Pause className="mr-2 h-4 w-4" />
                Stop Timer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="All Tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                {myTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task Time Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Task Time Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time Spent</TableHead>
                <TableHead>Estimated</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasksWithTime.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No tasks with time tracking
                  </TableCell>
                </TableRow>
              ) : (
                tasksWithTime.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.project}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTaskStatus(task)}>{task.status}</Badge>
                    </TableCell>
                    <TableCell>{task.actualTimeSpent.toFixed(1)}h</TableCell>
                    <TableCell>{task.estimatedTime || 0}h</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(task.timeProgress, 100)}
                          className="w-24"
                        />
                        <span className="text-xs text-gray-500">
                          {task.timeProgress.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {activeTaskId === task.id ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleStopTimer}
                        >
                          <Pause className="mr-1 h-3 w-3" />
                          Stop
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartTimer(task.id)}
                          disabled={task.status === 'Completed'}
                        >
                          <Play className="mr-1 h-3 w-3" />
                          Start
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Time Entries Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myTimeEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No time entries recorded
                  </TableCell>
                </TableRow>
              ) : (
                myTimeEntries.slice(0, 10).map((entry) => {
                  const task = myTasks.find((t) => t.id === entry.taskId);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <p className="text-sm">{task?.title || 'Unknown Task'}</p>
                      </TableCell>
                      <TableCell>
                        {new Date(entry.startTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {entry.endTime
                          ? new Date(entry.endTime).toLocaleString()
                          : 'In Progress'}
                      </TableCell>
                      <TableCell>{entry.duration?.toFixed(1) || '-'}h</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {entry.notes || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Timesheet Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Timesheet Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm">Daily Breakdown</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday</span>
                  <span>8.5h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tuesday</span>
                  <span>7.2h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Wednesday</span>
                  <span>8.0h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thursday</span>
                  <span>9.1h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Friday</span>
                  <span>7.8h</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm">Project Breakdown</h3>
              <div className="space-y-1 text-sm">
                {Array.from(new Set(myTasks.map((t) => t.project))).map((project) => {
                  const projectTasks = tasksWithTime.filter((t) => t.project === project);
                  const projectTime = projectTasks.reduce(
                    (sum, t) => sum + t.actualTimeSpent,
                    0
                  );
                  return (
                    <div key={project} className="flex justify-between">
                      <span className="text-gray-600">{project}</span>
                      <span>{projectTime.toFixed(1)}h</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
