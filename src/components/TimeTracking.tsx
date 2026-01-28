// src/components/TimeTracking.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Play, Pause, Clock, Calendar, TrendingUp } from "lucide-react";

import type { Task, TimeEntry, User } from "../types";
import {
  getAttendancesApi,
  getAttendancesByEmployeeApi,
  getTodayAttendanceApi,
  createAttendanceApi,
  Attendance as APIAttendance,
} from "../components/service/attendanceService";

/**
 * Props expected by the component
 */
interface TimeTrackingProps {
  tasks: Task[];
  timeEntries: TimeEntry[]; // existing time entries (taskId, startTime, endTime, duration, notes)
  currentUser: User;
}

/**
 * Helper: normalize various backend shapes to an attendance array
 */
function normalizeAttendanceResponse(res: any): APIAttendance[] {
  // patterns seen:
  // 1) res  === array
  // 2) res.data === array
  // 3) res.data.data === array
  // 4) res.data.rows === array
  if (!res) return [];

  if (Array.isArray(res.data?.data)) return res.data.data;
  
  return [];
}

/**
 * Parse a single attendance row into a friendly shape
 */
function parseAttendance(a: APIAttendance) {
  const checkTimes = Array.isArray(a.check_time) ? a.check_time : [];
  const signIn = a.sign_in ?? (checkTimes[0]?.check_in ?? null);
  const signOut = a.sign_out ?? (checkTimes.length ? checkTimes[checkTimes.length - 1]?.check_out ?? null : null);
  return {
    id: a.id,
    employee_id: a.employee_id,
    date: a.date,
    sign_in: signIn,
    sign_out: signOut,
    duration_hours: typeof a.duration_hours === "number" ? a.duration_hours : (a.duration_hours ? Number(a.duration_hours) : 0),
    check_time: checkTimes,
    raw: a,
  };
}

export function TimeTracking({ tasks, timeEntries, currentUser }: TimeTrackingProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedTask, setSelectedTask] = useState<string>("all");

  const [attToday, setAttToday] = useState<any[]>([]);
  const [attWeek, setAttWeek] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  // compute week range (7 days back inclusive)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6); // last 7 days (including today)
  const weekStartStr = weekStart.toISOString().split("T")[0];

  useEffect(() => {
    fetchAttendanceForUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  async function fetchAttendanceForUser() {
    if (!currentUser?.id) return;
    setLoading(true);
    setError(null);

    try {
      // fetch today's attendance WITHOUT employee filter
      const todayRes = await getAttendancesApi({ from_date: today, to_date: today, limit: 50 });
      const todayArr = normalizeAttendanceResponse(todayRes);
      setAttToday(todayArr.map(parseAttendance));

      // fetch week range (from weekStartStr to today) WITHOUT employee filter
      const weekRes = await getAttendancesApi({ from_date: weekStartStr, to_date: today, limit: 500 });
      const weekArr = normalizeAttendanceResponse(weekRes);
      setAttWeek(weekArr.map(parseAttendance));
    } catch (err: any) {
      console.error("Failed to fetch attendance:", err);
      setError(err?.message || "Failed to fetch attendance");
      setAttToday([]);
      setAttWeek([]);
    } finally {
      setLoading(false);
    }
  }

  // Total attendance hours for today using attendanceService result
  const attendanceHoursToday = useMemo(() => {
    if (!attToday || attToday.length === 0) {
      // fallback to summing timeEntries for today
      const todayEntries = timeEntries.filter((e) => e.startTime.startsWith(today));
      return todayEntries.reduce((s, e) => s + (e.duration || 0), 0);
    }
    return attToday.reduce((s, a) => s + (a.duration_hours || 0), 0);
  }, [attToday, timeEntries, today]);

  // Total attendance hours for week
  const attendanceHoursWeek = useMemo(() => {
    if (!attWeek || attWeek.length === 0) {
      // fallback to timeEntries in last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      const weekEntries = timeEntries.filter((e) => new Date(e.startTime) >= weekAgo);
      return weekEntries.reduce((s, e) => s + (e.duration || 0), 0);
    }
    return attWeek.reduce((s, a) => s + (a.duration_hours || 0), 0);
  }, [attWeek, timeEntries]);

  // Tasks filtered for the current user (same logic you had)
  const myTasks = tasks.filter(
    (task) =>
      currentUser.role === "Super Admin" ||
      currentUser.role === "Admin" ||
      (Array.isArray(task.assignedTo) && task.assignedTo.includes(currentUser.id))
  );

  // Build tasksWithTime from timeEntries (task-specific)
  const tasksWithTime = myTasks.map((task) => {
    const taskEntries = timeEntries.filter((te) => te.taskId === task.id && te.userId === currentUser.id);
    const totalTime = taskEntries.reduce((s, e) => s + (e.duration || 0), 0);
    const estimated = (task.estimatedTime ?? 0);
    const progress = estimated > 0 ? (totalTime / estimated) * 100 : 0;
    return {
      ...task,
      actualTimeSpent: totalTime,
      timeProgress: progress,
    };
  });

  // Timer control (local)
  const handleStartTimer = (taskId: string) => {
    setActiveTaskId(taskId);
    console.log("Timer started for task:", taskId);
    // optionally integrate with your backend time-entry API here
  };

  const handleStopTimer = () => {
    console.log("Timer stopped for task:", activeTaskId);
    setActiveTaskId(null);
    // optionally create time entry on backend here
  };

  const getTaskStatus = (task: Task) => {
    if (task.status === "Completed") return "default";
    if (task.status === "In Progress") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Time Tracking</h1>
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
            <div className="text-2xl">{attendanceHoursToday.toFixed(1)}h</div>
            <Progress value={Math.min((attendanceHoursToday / 8) * 100, 100)} className="mt-2" />
            <p className="text-xs text-gray-500 mt-2">From attendance records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{attendanceHoursWeek.toFixed(1)}h</div>
            <p className="text-xs text-gray-500">Last 7 days (attendance)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Tasks</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{myTasks.filter((t) => t.status === "In Progress").length}</div>
            <p className="text-xs text-gray-500">Being tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Timer (local) */}
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
                <p className="text-sm">{myTasks.find((t) => t.id === activeTaskId)?.title}</p>
                <p className="text-2xl">00:00:00</p>
              </div>
              <Button variant="destructive" onClick={handleStopTimer}>
                <Pause className="mr-2 h-4 w-4" />
                Stop Timer
              </Button>
            </div>

            {/* show today's attendance sessions (if any) */}
            {attToday.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium">Today's Attendance Sessions</h4>
                <div className="mt-2">
                  {attToday[0].check_time && attToday[0].check_time.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left">Check In</th>
                          <th className="text-left">Check Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attToday[0].check_time.map((s: any, i: number) => (
                          <tr key={i}>
                            <td className="py-1">{s.check_in ?? "-"}</td>
                            <td className="py-1">{s.check_out ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-sm text-gray-500">No sessions recorded</div>
                  )}
                </div>
              </div>
            )}
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
                {/* Example: render last 5 days from attWeek */}
                {attWeek.slice(-5).map((d: any) => (
                  <div key={d.date} className="flex justify-between">
                    <span className="text-gray-600">{d.date}</span>
                    <span>{(d.duration_hours || 0).toFixed(1)}h</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm">Project Breakdown</h3>
              <div className="space-y-1 text-sm">
                {Array.from(new Set(myTasks.map((t) => t.project))).map((project) => {
                  const projectTasks = tasksWithTime.filter((t) => t.project === project);
                  const projectTime = projectTasks.reduce((sum, t) => sum + t.actualTimeSpent, 0);
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

      {loading && <div className="text-sm text-gray-500">Loading attendance...</div>}
      {error && <div className="text-sm text-red-600">Error: {error}</div>}
    </div>
  );
}

export default TimeTracking;
