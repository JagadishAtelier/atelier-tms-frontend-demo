// src/components/AttendanceManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { LogIn, LogOut, Clock, Download, FileText, User } from "lucide-react";

import {
  getAttendancesApi,
  getTodayAttendanceApi,
  createAttendanceApi,
  Attendance as APIAttendance,
  CreateAttendancePayload,
} from "../components/service/attendanceService";

type UserType = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  role?: string;
  isActive?: boolean;
};

interface Props {
  /**
   * Optional: pass users & currentUser from parent.
   * If users not passed, the component will render counts based on attendances only.
   */
  users?: UserType[];
  currentUser: UserType;
}

/**
 * Normalized record used by the table/UI
 */
type AttendanceRecord = {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  checkIn?: string | null; // ISO datetime or HH:mm
  checkOut?: string | null;
  totalHours?: number | null;
  status?: "present" | "pending" | "absent" | "manual" | string;
  raw?: APIAttendance;
};

export function AttendanceManagement({ users = [], currentUser }: Props) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchAttendancesForToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAttendancesForToday() {
    setLoading(true);
    setError(null);
    try {
      // Use the service: fetch attendances for today (we pass from_date/to_date)
      const params = { from_date: todayStr, to_date: todayStr, limit: 500 };
      const res = await getAttendancesApi(params);
      // API expected to return paginated { data: rows } or direct array — normalize:
      const rows: APIAttendance[] = Array.isArray(res.data?.data) ? res.data?.data : (res?.data?.data ?? res) as APIAttendance[];

      const normalized = rows.map(toAttendanceRecord);
      setAttendance(normalized);
    } catch (err: any) {
      console.error("Failed to fetch attendances:", err);
      setError(err?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }

  // helper: convert APIAttendance to UI AttendanceRecord
  function toAttendanceRecord(a: APIAttendance): AttendanceRecord {
    const employee = a.employee ?? (a as any).employee ?? null;
    const checkTimes = Array.isArray(a.check_time) ? a.check_time : [];
    // first sign_in or first check_in
    const firstIn = a.sign_in ?? (checkTimes[0]?.check_in ?? null);
    // last sign_out or last check_out
    const lastOut = a.sign_out ?? (checkTimes.length ? checkTimes[checkTimes.length - 1]?.check_out ?? null : null);

    // derive status
    let status: AttendanceRecord["status"] = "absent";
    if (firstIn && !lastOut) status = "pending";
    else if (firstIn && lastOut) status = "present";
    else if (a.is_active === false) status = "manual";

    return {
      id: a.id,
      userId: a.employee_id,
      userName: employee?.name || (a as any).userName || employee?.email || "Unknown",
      date: a.date,
      checkIn: firstIn ?? null,
      checkOut: lastOut ?? null,
      totalHours: typeof a.duration_hours === "number" ? a.duration_hours : (a.duration_hours ? Number(a.duration_hours) : null),
      status,
      raw: a,
    };
  }

  // filtered attendance for UI based on selected user & role
  const filteredAttendance = useMemo(() => {
    let list = attendance;
    // if current user is Employee (and not manager/admin) show only his
    if (currentUser?.role === "Employee" && currentUser?.role !== "Manager") {
      list = list.filter((a) => a.userId === currentUser.id);
    } else if (selectedUser !== "all") {
      list = list.filter((a) => a.userId === selectedUser);
    }
    // viewMode can be used to expand fetching but for now we always display daily
    return list;
  }, [attendance, currentUser, selectedUser, viewMode]);

  const todayAttendance = filteredAttendance.filter((a) => a.date === todayStr);

  const totalWorkingHours = todayAttendance.reduce((sum, a) => sum + (a.totalHours || 0), 0);
  const averageWorkingHours = todayAttendance.length > 0 ? totalWorkingHours / todayAttendance.length : 0;

  // determine if current user has checked in & not checked out
  const myToday = attendance.find((a) => a.userId === currentUser.id && a.date === todayStr);
  const isCheckedIn = !!(myToday && myToday.checkIn && !myToday.checkOut);

  // handle check-in / check-out
  async function handleCheckIn() {
    if (!currentUser?.id) return alert("No current user available");
    try {
      setLoading(true);
      const payload: CreateAttendancePayload = {
        employee_id: currentUser.id,
        date: todayStr,
        action: "check_in",
        time: new Date().toLocaleTimeString("en-GB", { hour12: false }), // HH:mm:ss
      };
      await createAttendanceApi(payload);
      await fetchAttendancesForToday();
    } catch (err: any) {
      console.error("Check-in failed:", err);
      setError(err?.message || "Check-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckOut() {
    if (!currentUser?.id) return alert("No current user available");
    try {
      setLoading(true);
      const payload: CreateAttendancePayload = {
        employee_id: currentUser.id,
        date: todayStr,
        action: "check_out",
        time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      };
      await createAttendanceApi(payload);
      await fetchAttendancesForToday();
    } catch (err: any) {
      console.error("Check-out failed:", err);
      setError(err?.message || "Check-out failed");
    } finally {
      setLoading(false);
    }
  }

  // Export CSV (works in Excel)
  function exportCsv() {
    if (!todayAttendance.length) {
      alert("No records to export");
      return;
    }
    const headers = ["Employee", "Date", "Check In", "Check Out", "Total Hours", "Status"];
    const rows = todayAttendance.map((r) => [
      `"${r.userName.replace(/"/g, '""')}"`,
      r.date,
      r.checkIn ?? "-",
      r.checkOut ?? "-",
      r.totalHours != null ? r.totalHours.toString() : "-",
      r.status ?? "-",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${todayStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export / Print (simple PDF via print)
  function exportPdf() {
    window.print();
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "present":
        return <Badge variant="default">Present</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "manual":
        return <Badge variant="outline">Manual Entry</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Attendance Management</h1>
          <p className="text-gray-500">Track daily attendance and working hours</p>
        </div>
        <div className="flex gap-2">
          
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Present Today</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {todayAttendance.filter((a) => a.status === "present").length}
            </div>
            <p className="text-xs text-gray-500">
              Out of {users.filter((u) => u.isActive !== false && u.role !== "Client").length} employees
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
              {todayAttendance.filter((a) => a.status === "pending").length}
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

            {(currentUser.role === "Super Admin" ||
              currentUser.role === "Admin" ||
              currentUser.role === "Manager") && (
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users
                    .filter((u) => u.isActive !== false && u.role !== "Client")
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
                  {(currentUser.role === "Super Admin" || currentUser.role === "Admin") && (
                    <TableHead>Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      {loading ? "Loading..." : "No attendance records found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  todayAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.userName}</TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {record.checkIn }
                      </TableCell>
                      <TableCell>
                        {record.checkOut }
                      </TableCell>
                      <TableCell>
                        {record.totalHours != null ? `${record.totalHours.toFixed(2)}h` : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      {(currentUser.role === "Super Admin" || currentUser.role === "Admin") && (
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
                                  Manual editing placeholder for {record.userName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-sm text-gray-500">
                                  Manual attendance editing would be available here.
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

      {error && (
        <div className="text-sm text-red-600">
          Error: {error}
        </div>
      )}
    </div>
  );
}

export default AttendanceManagement;
