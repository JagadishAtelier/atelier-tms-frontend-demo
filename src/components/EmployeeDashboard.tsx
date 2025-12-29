// src/components/EmployeeDashboard.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Info, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { updateTaskApi } from "../components/service/task";
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Alert, AlertDescription } from './ui/alert';
import type { User, Task } from '../types';

import {
  createAttendanceApi,
  getTodayAttendanceApi,
  type Attendance,
  type CheckTime,
} from '../components/service/attendanceService'; // adjust path if necessary

interface EmployeeDashboardProps {
  currentUser: User;
  tasks: Task[];
  attendance: Attendance[]; // historical attendances prop (unchanged)
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
  const [loadingToday, setLoadingToday] = useState(false);

  // --- New state for pending task notes modal ---
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskNotesInput, setTaskNotesInput] = useState('');
  const [taskUpdateLoading, setTaskUpdateLoading] = useState(false);
  const [taskUpdateError, setTaskUpdateError] = useState<string | null>(null);
  const [taskUpdateSuccess, setTaskUpdateSuccess] = useState<string | null>(null);
  const [signOutRetrying, setSignOutRetrying] = useState(false); // ensure single retry

  // ---------- Helpers ----------

  // Normalize API wrapper shapes (some of your APIs return { data } or direct object)
  const normalizeResponseToAttendance = (res: any): Attendance | null => {
    if (!res) return null;
    // If the service already returned the attendance object:
    if (typeof res === 'object' && (res.check_time || res.date || res.employee_id)) return res as Attendance;
    // If wrapper { data: attendance, ... }
    if (res.data && (res.data.check_time || res.data.date || res.data.employee_id)) return res.data as Attendance;
    // Some wrappers use { data: { data: attendance } }
    if (res.data?.data && (res.data.data.check_time || res.data.data.date)) return res.data.data as Attendance;
    return null;
  };

  const todayDateString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Parse a time string returned by backend into a Date instance for today (handles "HH:mm"|"HH:mm:ss" or ISO)
  const parseTimeToDate = (dateOnly: string, timeLike?: string | null): Date | null => {
    if (!timeLike) return null;
    try {
      // ISO-like
      if (timeLike.includes('T')) {
        const maybe = new Date(timeLike);
        if (!isNaN(maybe.getTime())) return maybe;
      }
      // If includes timezone offset (e.g. 2025-12-27T08:30:00+05:30)
      if (/^\d{4}-\d{2}-\d{2}T/.test(timeLike)) {
        const iso = new Date(timeLike);
        if (!isNaN(iso.getTime())) return iso;
      }
      // Otherwise treat as time-only "HH:mm" or "HH:mm:ss" for the provided dateOnly
      const parts = (timeLike || '').split(':').map((p) => parseInt(p, 10) || 0);
      const yyyy = parseInt(dateOnly.slice(0, 4), 10);
      const mm = parseInt(dateOnly.slice(5, 7), 10) - 1;
      const dd = parseInt(dateOnly.slice(8, 10), 10);
      const hh = parts[0] ?? 0;
      const min = parts[1] ?? 0;
      const ss = parts[2] ?? 0;
      const d = new Date(yyyy, mm, dd, hh, min, ss);
      return d;
    } catch {
      return null;
    }
  };

  const computeHoursFromAttendance = (att: Attendance | null): number => {
    if (!att) return 0;
    // Prefer duration_hours if backend calculated
    if (typeof att.duration_hours === 'number') return att.duration_hours;
    // fallback: compute from sign_in / sign_out
    const dateOnly = att.date ?? todayDateString();
    const signIn = parseTimeToDate(dateOnly, att.sign_in ?? (Array.isArray(att.check_time) ? att.check_time[0]?.check_in : undefined));
    // find last check_out
    let lastOut: Date | null = null;
    if (Array.isArray(att.check_time)) {
      for (const e of att.check_time as CheckTime[]) {
        if (e && e.check_out) {
          const d = parseTimeToDate(dateOnly, e.check_out);
          if (d && (!lastOut || d.getTime() > lastOut.getTime())) lastOut = d;
        }
      }
    }
    if (!lastOut && att.sign_out) lastOut = parseTimeToDate(dateOnly, att.sign_out);
    if (signIn && lastOut) {
      return Math.round(((lastOut.getTime() - signIn.getTime()) / (1000 * 60 * 60)) * 100) / 100;
    }
    // if only signIn present, compute hours until now
    if (signIn && !lastOut) {
      return Math.round(((new Date().getTime() - signIn.getTime()) / (1000 * 60 * 60)) * 100) / 100;
    }
    return 0;
  };

  // ---------- Load today's attendance from API ----------
  const loadTodayAttendance = async () => {
    setLoadingToday(true);
    try {
      const res = await getTodayAttendanceApi();
      const att = normalizeResponseToAttendance(res);
      if (!att) {
        // no attendance record found -> reset
        setCheckInTime(null);
        setCheckOutTime(null);
        setIsCheckedIn(false);
        setTotalHours(0);
        setShowCheckoutReminder(false);
        setIsOnBreak(false);
        setBreakStartTime(null);
        return;
      }

      // Parse sign-in / sign-out or check_time
      const dateOnly = att.date ?? todayDateString();

      // Attempt to find the last check_time entry
      const lastEntry: CheckTime | undefined =
        Array.isArray(att.check_time) && att.check_time.length > 0
          ? att.check_time[att.check_time.length - 1]
          : undefined;

      // Default signInDate prefers att.sign_in, fallback to first check_time check_in
      const signInDate = parseTimeToDate(
        dateOnly,
        att.sign_in ?? (Array.isArray(att.check_time) ? att.check_time[0]?.check_in : undefined)
      );

      // New logic:
      // - If att.sign_out exists => user signed out
      // - Else if lastEntry exists:
      //     - if lastEntry has only check_in (no check_out) => user is currently checked in (resumed)
      //     - if lastEntry has check_out (and sign_out is null) => user is on break (break started at that check_out)
      // - Else => fallback (no out time)
      let signOutDate: Date | null = null;
      let onBreak = false;
      let breakStart: Date | null = null;
      let effectiveCheckIn: Date | null = signInDate;

      if (att.sign_out) {
        // explicit sign_out from server -> user fully signed out
        signOutDate = parseTimeToDate(dateOnly, att.sign_out);
        onBreak = false;
        breakStart = null;
        // effectiveCheckIn remains signInDate (server provided)
      } else if (lastEntry) {
        // examine last entry
        if (lastEntry.check_in && !lastEntry.check_out) {
          // last entry is a pure check_in -> treated as current active check_in (resumed)
          const resumed = parseTimeToDate(dateOnly, lastEntry.check_in);
          if (resumed) effectiveCheckIn = resumed;
          signOutDate = null;
          onBreak = false;
          breakStart = null;
        } else if (lastEntry.check_out && !lastEntry.check_in) {
          // last entry is pure check_out (rare) -> treat as break start
          const out = parseTimeToDate(dateOnly, lastEntry.check_out);
          if (out) {
            signOutDate = out;
            onBreak = true;
            breakStart = out;
            // effectiveCheckIn remains signInDate (if available)
          }
        } else if (lastEntry.check_out && lastEntry.check_in) {
          // last entry has both; if it's the final entry with both, user might have closed a session,
          // but since att.sign_out is null, we treat lastEntry.check_out as potential break start only if it's the final moment.
          // We'll treat it as break start (consistent with earlier logic).
          const out = parseTimeToDate(dateOnly, lastEntry.check_out);
          if (out) {
            signOutDate = out;
            onBreak = true;
            breakStart = out;
          }
        } else {
          // fallback: no info
          signOutDate = null;
          onBreak = false;
          breakStart = null;
        }
      } else {
        // no check_time entries: nothing to show
        signOutDate = null;
        onBreak = false;
        breakStart = null;
      }

      // Apply to state:
      setCheckInTime(effectiveCheckIn);
      setCheckOutTime(signOutDate);
      setIsOnBreak(onBreak);
      setBreakStartTime(breakStart);
      // If user has sign_in (or resumed) and no final sign_out and not on break, they are active
      setIsCheckedIn(!!effectiveCheckIn && !signOutDate && !onBreak);
      // compute hours from server-provided data or fallback
      setTotalHours(computeHoursFromAttendance(att));
      // don't show checkout reminder while on break
      setShowCheckoutReminder(!onBreak && !!effectiveCheckIn && !signOutDate && computeHoursFromAttendance(att) > 9);

    } catch (err) {
      console.error('Failed to load today attendance', err);
    } finally {
      setLoadingToday(false);
    }
  };

  // ---------- Effects ----------
  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load today's attendance at mount and when current user changes
  useEffect(() => {
    loadTodayAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Check if user needs checkout reminder (after 9 hours)
  useEffect(() => {
    if (isCheckedIn && checkInTime) {
      const hoursWorked = (currentTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      if (hoursWorked > 9 && !checkOutTime) {
        setShowCheckoutReminder(true);
      } else {
        setShowCheckoutReminder(false);
      }
    } else {
      setShowCheckoutReminder(false);
    }
  }, [currentTime, isCheckedIn, checkInTime, checkOutTime]);

  // Calculate total hours live (if not provided by backend)
  useEffect(() => {
    if (checkInTime && !checkOutTime) {
      const hours = (currentTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      setTotalHours(Math.round(hours * 100) / 100);
    } else if (checkInTime && checkOutTime) {
      const hours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      setTotalHours(Math.round(hours * 100) / 100);
    } else {
      setTotalHours(0);
    }
  }, [currentTime, checkInTime, checkOutTime]);

  // ---------- Error parsing helper ----------
  const extractPendingTaskIdFromError = (err: any): string | null => {
    // many axios/fetch shapes => check multiple places
    try {
      // axios style: err.response.data.pendingTask.id
      if (err?.response?.data?.pendingTask?.id) return String(err.response.data.pendingTask.id);

      // axios style: err.response.data.message includes ID
      const msg1 = err?.response?.data?.message || err?.response?.data?.msg || null;
      if (typeof msg1 === 'string') {
        const m = msg1.match(/Pending Task ID[:\s]*([0-9a-fA-F-]{8,36})/i);
        if (m) return m[1];
      }

      // direct thrown Error with message
      const msg2 = err?.message || err;
      if (typeof msg2 === 'string') {
        const m2 = msg2.match(/Pending Task ID[:\s]*([0-9a-fA-F-]{8,36})/i);
        if (m2) return m2[1];
      }

      // sometimes server returns { message: '...ID: <id>' }
      const msg3 = err?.data?.message || err?.data?.msg;
      if (typeof msg3 === 'string') {
        const m3 = msg3.match(/Pending Task ID[:\s]*([0-9a-fA-F-]{8,36})/i);
        if (m3) return m3[1];
      }
    } catch (e) {
      // ignore parsing errors
    }
    return null;
  };

  // ---------- Action handlers (call API) ----------
  // NOTE: According to your request:
  // - Click "Check In" => send action: "sign_in"
  // - Click "Check Out" => send action: "sign_out"
  // - "Start Break" => send action: "check_out" (marks break start by checking out)
  // - "End Break" => send action: "check_in" (resumes by checking in)
  // Also: do NOT send employee_id; backend will use token to determine the employee.

  const handleCheckIn = async () => {
    try {
      const payload = {
        date: todayDateString(),
        action: 'sign_in' as const, // backend will use token to get employee
      };
      const res = await createAttendanceApi(payload);
      const att = normalizeResponseToAttendance(res);
      if (att) {
        const parsed = parseTimeToDate(att.date ?? todayDateString(), att.sign_in ?? (Array.isArray(att.check_time) ? att.check_time[0]?.check_in : undefined));
        setCheckInTime(parsed);
        setCheckOutTime(att.sign_out ? parseTimeToDate(att.date ?? todayDateString(), att.sign_out) : null);
        setIsCheckedIn(!!parsed && !att.sign_out);
        setTotalHours(computeHoursFromAttendance(att));
        setShowCheckoutReminder(computeHoursFromAttendance(att) > 9 && !att.sign_out);
        // If we signed in after a break end, ensure break state cleared
        setIsOnBreak(false);
        setBreakStartTime(null);
      } else {
        const now = new Date();
        setCheckInTime(now);
        setIsCheckedIn(true);
        setCheckOutTime(null);
        setTotalHours(0);
        setIsOnBreak(false);
        setBreakStartTime(null);
      }
    } catch (err: any) {
      console.error('Check-in failed', err);
      alert(err?.message || 'Failed to check in');
    }
  };

  // central sign-out function with optional modal showing
  const doSignOut = async (allowShowModal = true): Promise<void> => {
    try {
      const payload = {
        date: todayDateString(),
        action: 'sign_out' as const,
      };
      const res = await createAttendanceApi(payload);
      const att = normalizeResponseToAttendance(res);
      if (att) {
        const parsedSignIn = parseTimeToDate(att.date ?? todayDateString(), att.sign_in ?? (Array.isArray(att.check_time) ? att.check_time[0]?.check_in : undefined));
        const parsedSignOut = att.sign_out ? parseTimeToDate(att.date ?? todayDateString(), att.sign_out) : null;
        setCheckInTime(parsedSignIn);
        setCheckOutTime(parsedSignOut);
        setIsCheckedIn(!!parsedSignIn && !parsedSignOut);
        setTotalHours(computeHoursFromAttendance(att));
        setShowCheckoutReminder(false);
        // sign_out ends any break state
        setIsOnBreak(false);
        setBreakStartTime(null);
        // clear any pending modal state
        setPendingTaskId(null);
        setShowTaskModal(false);
        setTaskUpdateError(null);
        setTaskUpdateSuccess(null);
      } else {
        const now = new Date();
        setCheckOutTime(now);
        setIsCheckedIn(false);
        setIsOnBreak(false);
        setShowCheckoutReminder(false);
        setBreakStartTime(null);
      }
    } catch (err: any) {
      console.error('Check-out failed', err);

      // try to extract pending task id
      const id = extractPendingTaskIdFromError(err);

      // if we found a pending task id and allowed to show modal, open modal to update notes
      if (id && allowShowModal && !signOutRetrying) {
        setPendingTaskId(id);
        // try to prefill existing notes from tasks prop if present
        const localTask = tasks?.find((t: any) => String(t.id) === String(id));
        setTaskNotesInput(localTask?.notes ?? '');
        setTaskUpdateError(null);
        setTaskUpdateSuccess(null);
        setShowTaskModal(true);
        return;
      }

      // fallback alert using possible server message
      const serverMsg =
        err?.response?.data?.message || err?.response?.data?.msg || err?.data?.message || err?.message;
      alert(serverMsg || 'Your Task due today is not completed');
    }
  };

  const handleCheckOut = async () => {
    // call central function allowing modal
    await doSignOut(true);
  };

  const handleBreakStart = async () => {
    try {
      // Start break: treat as a check_out action
      const payload = {
        date: todayDateString(),
        action: 'check_out' as const, // backend will use token to get employee
      };
      const res = await createAttendanceApi(payload);
      const att = normalizeResponseToAttendance(res);
      if (att) {
        // On break start we expect a sign_out or a last check_out recorded
        // derive break start time from latest check_out or sign_out
        let breakTime: Date | null = null;
        if (att.sign_out) breakTime = parseTimeToDate(att.date ?? todayDateString(), att.sign_out);
        else if (Array.isArray(att.check_time)) {
          // take last check_out
          for (const e of (att.check_time as CheckTime[])) {
            if (e?.check_out) {
              const d = parseTimeToDate(att.date ?? todayDateString(), e.check_out);
              if (d && (!breakTime || d.getTime() > breakTime.getTime())) breakTime = d;
            }
          }
        }
        setIsOnBreak(true);
        setBreakStartTime(breakTime ?? new Date());
        // update checkOutTime to show user is checked out for break
        setCheckOutTime(breakTime ?? new Date());
        // set checkedIn state accordingly
        setIsCheckedIn(false);
        setTotalHours(computeHoursFromAttendance(att));
        setShowCheckoutReminder(false);
      } else {
        const now = new Date();
        setIsOnBreak(true);
        setBreakStartTime(now);
        setCheckOutTime(now);
        setIsCheckedIn(false);
        setShowCheckoutReminder(false);
      }
    } catch (err: any) {
      console.error('Start break failed', err);
      alert(err?.message || 'Failed to start break');
    }
  };

  const handleBreakEnd = async () => {
    try {
      // End break: treat as a check_in action
      const payload = {
        date: todayDateString(),
        action: 'check_in' as const, // backend will use token to get employee
      };
      const res = await createAttendanceApi(payload);
      const att = normalizeResponseToAttendance(res);
      if (att) {
        // On break end we expect a new sign_in or a last check_in recorded
        let resumedAt: Date | null = null;
        if (att.sign_in) resumedAt = parseTimeToDate(att.date ?? todayDateString(), att.sign_in);
        else if (Array.isArray(att.check_time)) {
          // take last check_in
          for (const e of (att.check_time as CheckTime[])) {
            if (e?.check_in) {
              const d = parseTimeToDate(att.date ?? todayDateString(), e.check_in);
              if (d && (!resumedAt || d.getTime() > resumedAt.getTime())) resumedAt = d;
            }
          }
        }
        setIsOnBreak(false);
        setBreakStartTime(null);
        // update checkInTime if resumedAt exists
        if (resumedAt) setCheckInTime(resumedAt);
        // clear checkOutTime because user resumed
        setCheckOutTime(null);
        setIsCheckedIn(!!resumedAt && true);
        setTotalHours(computeHoursFromAttendance(att));
        setShowCheckoutReminder(computeHoursFromAttendance(att) > 9 && !att.sign_out);
      } else {
        const now = new Date();
        setIsOnBreak(false);
        setBreakStartTime(null);
        setCheckInTime(now);
        setCheckOutTime(null);
        setIsCheckedIn(true);
        setTotalHours(0);
      }
    } catch (err: any) {
      console.error('End break failed', err);
      alert(err?.message || 'Failed to end break');
    }
  };

  // ---------- Task notes update flow ----------
  // Tries to PATCH /api/v1/task/:id with { notes } — adjust endpoint if your backend differs.
  const updateTaskNotes = async (id: string, notes: string) => {
  setTaskUpdateLoading(true);
  setTaskUpdateError(null);
  setTaskUpdateSuccess(null);

  try {
    await updateTaskApi(id, { notes }); // ✅ using task.ts

    setTaskUpdateSuccess("Notes updated successfully.");

    // close modal and retry sign-out
    setTimeout(() => {
      setShowTaskModal(false);
      setPendingTaskId(null);
      setTaskUpdateLoading(false);
      setTaskUpdateError(null);

      // retry sign-out once
      if (!signOutRetrying) {
        setSignOutRetrying(true);
        doSignOut(false).finally(() => setSignOutRetrying(false));
      }
    }, 700);

  } catch (err: any) {
    console.error("Failed to update task notes", err);

    const serverMsg =
      err?.response?.data?.message ||
      err?.response?.data?.msg ||
      err?.message ||
      "Failed to update task notes";

    setTaskUpdateError(serverMsg);
    setTaskUpdateLoading(false);
  }
};


  // ---------- Helper for display time ----------
  const formatTime = (date: Date | null) => {
    if (!date) return '—';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // ---------- Derived task metrics ----------
  const myTasks = tasks.filter((task) => task.assignedTo?.includes(currentUser.id));
  const todayTasks = {
    pending: myTasks.filter((t) => t.status === 'To Do').length,
    inProgress: myTasks.filter((t) => t.status === 'In Progress').length,
    completed: myTasks.filter((t) => t.status === 'Completed').length,
  };
  const overdueTasks = myTasks.filter(
    (t) => new Date(t.dueDate) < new Date() && t.status !== 'Completed'
  );

  // Mock data for performance chart (unchanged)
  const weeklyPerformance = [
    { day: 'Mon', tasks: 5, hours: 7.5 },
    { day: 'Tue', tasks: 6, hours: 8.2 },
    { day: 'Wed', tasks: 4, hours: 7.8 },
    { day: 'Thu', tasks: 7, hours: 8.5 },
    { day: 'Fri', tasks: 5, hours: 7.2 },
    { day: 'Sat', tasks: 2, hours: 4.0 },
    { day: 'Sun', tasks: 1, hours: 2.0 },
  ];

  // Recent activities & notifications (unchanged)
  const recentActivities = [
    { id: 1, action: 'Completed task "API Integration"', time: '10 mins ago', icon: CheckCircle2, color: 'text-gray-900 ' },
    { id: 2, action: 'Started working on "Dashboard UI"', time: '1 hour ago', icon: PlayCircle, color: 'text-[#10b981]' },
    { id: 3, action: 'Submitted timesheet for approval', time: '2 hours ago', icon: Clock, color: 'text-[#f59e0b]' },
    { id: 4, action: 'Joined team meeting', time: '3 hours ago', icon: Activity, color: 'text-[#3b82f6]' },
  ];

  const notifications = [
    { id: 1, message: 'New task assigned: Mobile App Design', type: 'info', time: '5 mins ago' },
    { id: 2, message: 'Team meeting at 3:00 PM', type: 'warning', time: '30 mins ago' },
    { id: 3, message: 'Your leave request was approved', type: 'success', time: '1 hour ago' },
  ];

  // ---------- Render ----------
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
          <AlertTriangle className="h-4 w-4 text-gray-900" />
          <AlertDescription className="text-gray-900">
            You've been working for over 9 hours. Don't forget to check out!
          </AlertDescription>
        </Alert>
      )}

      {/* Attendance Section */}
      <Card className="bg-white border border-gray-200 shadow-sm rounded-xl shadow-[#00B4D8]/10 transition-all duration-300 hover:shadow-[#00B4D8]/20">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-700" />
              Today's Attendance
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${isCheckedIn && !checkOutTime ? 'bg-gray-900 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isOnBreak ? 'On Break' : (isCheckedIn && !checkOutTime ? 'Active' : 'Checked Out')}
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
                  disabled={isCheckedIn || loadingToday}
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
                  disabled={!isCheckedIn || !!checkOutTime || loadingToday}
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

      {/* The rest of your dashboard widgets (unchanged) */}
      {/* ... (everything below remains exactly as you provided) ... */}

      {/* Dashboard Widgets - 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="space-y-4">
              {[
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
              ].map((notification) => {
                const priorityStyles: Record<string, { bg: string; label: string }> = {
                  LOW: { bg: "#6B7280", label: "LOW" },
                  HIGH: { bg: "#F59E0B", label: "HIGH" },
                  URGENT: { bg: "#EF4444", label: "URGENT" },
                };
                return (
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
                );
              })}
            </div>

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

      {/* ---------------- Task Notes Modal ---------------- */}
      {showTaskModal && pendingTaskId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowTaskModal(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-lg p-6 z-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Task — Notes required</h3>
            <p className="text-sm text-gray-600 mb-4">
              You have a pending task that blocks sign-out. Update the task notes to mark progress (Task ID: <span className="font-mono">{pendingTaskId}</span>).
            </p>

            <label className="text-xs text-gray-500">Notes</label>
            <textarea
              value={taskNotesInput}
              onChange={(e) => setTaskNotesInput(e.target.value)}
              rows={6}
              className="w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
              placeholder="Describe work done / reason why it's not completed..."
            />

            {taskUpdateError && <div className="text-sm text-red-600 mt-2">{taskUpdateError}</div>}
            {taskUpdateSuccess && <div className="text-sm text-green-600 mt-2">{taskUpdateSuccess}</div>}

            <div className="flex items-center justify-end gap-3 mt-4">
              <Button
                variant="ghost"
                className="text-gray-700"
                onClick={() => {
                  setShowTaskModal(false);
                  setPendingTaskId(null);
                }}
                disabled={taskUpdateLoading}
              >
                Cancel
              </Button>

              <Button
                onClick={() => updateTaskNotes(pendingTaskId, taskNotesInput)}
                className="bg-[#10b981] hover:bg-[#10b981]/95 text-white"
                disabled={taskUpdateLoading || taskNotesInput.trim().length === 0}
              >
                {taskUpdateLoading ? 'Updating...' : 'Update Notes & Retry Sign Out'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
