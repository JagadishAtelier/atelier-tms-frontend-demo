import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  FileText,
  MessageSquare,
  CheckCircle2,
  Circle,
  Paperclip,
  Edit2,
} from "lucide-react";
import type { Task, User as UserType, TaskStatus, TaskPriority } from "../types";
import { getTaskByIdApi, updateTaskApi } from "./service/task";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

interface TaskDetailsProps {
  task?: Task;
  taskId?: string;
  users: UserType[]; // used for lookup and assigned_to options
  currentUser: UserType;
  onBack: () => void;
}

export function TaskDetails({
  task: propTask,
  taskId,
  users,
  currentUser,
  onBack,
}: TaskDetailsProps) {
  const [task, setTask] = useState<Task | null>(propTask || null);
  const [loading, setLoading] = useState(!propTask);
  const [newComment, setNewComment] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Status-only edit dialog state
  const [isStatusEditOpen, setIsStatusEditOpen] = useState(false);
  const [editStatusValue, setEditStatusValue] = useState<TaskStatus>("Not Started");
  const [savingStatus, setSavingStatus] = useState(false);

  // Fetch task if only taskId is provided
  useEffect(() => {
    if (taskId && !propTask) {
      fetchTask();
    } else if (propTask) {
      setTask(propTask);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, propTask]);

  // Robust response extractor (handles res.data, res.data.data, nested)
  function extractResponseData(res: any) {
    if (!res) return undefined;
    if (res.data === undefined) return res;
    const d = res.data;
    if (d && d.data !== undefined) {
      const d2 = d.data;
      if (d2 && d2.data !== undefined) return d2.data;
      return d2;
    }
    return d;
  }

  async function fetchTask(silentBackground = false) {
    if (!taskId) return;
    if (!silentBackground) setLoading(true);
    try {
      const res = await getTaskByIdApi(taskId);
      const taskData = extractResponseData(res) || (res as any).data || res;

      const mappedTask: Task = {
        ...taskData,
        id: taskData.id,
        title: taskData.title ?? "",
        description: taskData.description ?? "",
        status: (taskData.status as TaskStatus) ?? "Not Started",
        priority: (taskData.priority as TaskPriority) ?? "Medium",
        assignedTo: taskData.assigned_to ?? taskData.assignee?.id ?? "",
        assignedBy: taskData.created_by ?? undefined,
        createdAt: taskData.createdAt ?? taskData.created_at ?? new Date().toISOString(),
        dueDate: taskData.due_date_and_time ?? null,
        project: taskData.project?.name ?? taskData.project_id ?? "",
        department: (taskData as any).department ?? null,
        tags: taskData.tags ?? [],
        timeSpent: typeof taskData.timeSpent !== "undefined" ? taskData.timeSpent : undefined,
        estimatedTime: typeof taskData.estimatedTime !== "undefined" ? taskData.estimatedTime : undefined,
        subtasks: taskData.subtasks ?? [],
        attachments: taskData.attachments ?? [],
        comments: taskData.comments ?? [],
        total_hours: typeof taskData.total_hours !== "undefined" ? taskData.total_hours : null,
        timetaken: taskData.timetaken ?? null,
        assignee: taskData.assignee ?? null,
        created_by_name: taskData.created_by_name ?? null,
        project_obj: taskData.project ?? null,
      };

      setTask(mappedTask);
    } catch (error) {
      console.error("Failed to fetch task:", error);
    } finally {
      if (!silentBackground) setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading task details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Task not found</p>
        </div>
      </div>
    );
  }

  // lookups
  const assignedUserName =
    task.assignee?.name ??
    (() => {
      const u = users.find((u) => String(u.id) === String(task.assignedTo));
      return u ? u.username || u.email : "Unassigned";
    })();

  const createdByName = (task as any).created_by_name ?? "Unknown";

  const completedSubtasks = task.subtasks?.filter((st: any) => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const timeProgress = task.estimatedTime ? ((task.total_hours ?? 0) / task.estimatedTime) * 100 : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "destructive";
      case "Medium":
        return "secondary";
      case "Low":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "default";
      case "In Progress":
        return "secondary";
      case "On Hold":
        return "outline";
      case "Not Started":
        return "destructive";
      case "Cancelled":
        return "outline";
      default:
        return "secondary";
    }
  };

  // inline status update handler (keeps existing behavior)
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    if (newStatus === task.status) return;

    // Optimistic update
    const previousStatus = task.status;
    setTask(prev => prev ? { ...prev, status: newStatus } : null);
    setStatusUpdating(true);

    try {
      await updateTaskApi(task.id, { status: newStatus });
      // Silent refresh to get server-calculated fields like time tracking logic if needed,
      // but without showing the full page loading spinner.
      await fetchTask(true);
    } catch (err: any) {
      console.error("Failed to update task status:", err);
      // Revert optimization on failure
      setTask(prev => prev ? { ...prev, status: previousStatus } : null);
      alert(err?.response?.data?.message || "Failed to update task status");
    } finally {
      setStatusUpdating(false);
    }
  };

  // --- Status-only edit dialog handlers ---
  const openStatusEditDialog = () => {
    setEditStatusValue((task.status as TaskStatus) ?? "Not Started");
    setIsStatusEditOpen(true);
  };

  const handleSaveStatusOnly = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!task) return;
    if (editStatusValue === task.status) {
      setIsStatusEditOpen(false);
      return;
    }
    setSavingStatus(true);
    try {
      await updateTaskApi(task.id, { status: editStatusValue });
      await fetchTask(true);
      setIsStatusEditOpen(false);
    } catch (err: any) {
      console.error("Failed to save status:", err);
      alert(err?.response?.data?.message || "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1>{task.title}</h1>
          <p className="text-gray-500">{task.project_obj?.name ?? task.project}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">

            {/* Display Current Status Badge */}
            <div className="capitalize">
              <Badge variant={getStatusColor(task.status)}>{task.status}</Badge>
            </div>
          </div>

          <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{task.description ?? "—"}</p>
            </CardContent>
          </Card>

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Subtasks</CardTitle>
                <span className="text-sm text-gray-500">
                  {completedSubtasks} of {totalSubtasks} completed
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progress} />
                <div className="space-y-2">
                  {task.subtasks.map((subtask: any) => (
                    <div key={subtask.id} className="flex items-center gap-3 rounded-lg border p-3">
                      {subtask.completed ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-gray-400" />}
                      <span className={subtask.completed ? "flex-1 text-gray-500 line-through" : "flex-1"}>{subtask.title}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {task.comments?.length ? task.comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar><AvatarFallback>{(comment.userName || "U").split(" ").map((n: string) => n[0]).join("")}</AvatarFallback></Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{comment.userName}</span>
                        <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                )) : <p className="text-sm text-gray-500">No comments yet</p>}
              </div>

              <Separator />

              {/* New Comment (UI only) */}
              <div className="space-y-2">
                <Textarea placeholder="Add a comment... (Use @name to mention someone)" value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={3} />
                <div className="flex justify-end">
                  <Button onClick={() => setNewComment("")}><MessageSquare className="mr-2 h-4 w-4" />Add Comment</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Attachments</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.attachments.map((attachment: any) => (
                    <div key={attachment.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm">{attachment.name}</p>
                          <p className="text-xs text-gray-500">Uploaded by {attachment.uploadedBy} on {new Date(attachment.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Download</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Time Tracking / Totals */}
          <Card>
            <CardHeader><CardTitle>Time Tracking</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Hours</span>
                <span className="text-sm">{(task.total_hours ?? 0).toFixed(3)}h</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Time (HH:mm:ss)</span>
                <span className="text-sm">{task.timetaken ?? "00:00:00"}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estimated</span>
                <span className="text-sm">{task.estimatedTime ?? 0}h</span>
              </div>

              <Progress value={Math.min(100, Math.round(timeProgress))} />

              {/* Status Action Buttons */}
              {(currentUser.role === "employee" ||
                currentUser.role === "Manager") && (
                  <div className="mt-4">
                    {task.status === "Not Started" && (
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleStatusChange("In Progress")}
                        disabled={statusUpdating}
                      >
                        Start Now
                      </Button>
                    )}

                    {task.status === "In Progress" && (
                      <div className="flex gap-2 w-full">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleStatusChange("On Hold")}
                          disabled={statusUpdating}
                        >
                          Pause
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-black hover:bg-black text-white"
                          onClick={() => handleStatusChange("Completed")}
                          disabled={statusUpdating}
                        >
                          Complete
                        </Button>
                      </div>
                    )}

                    {task.status === "On Hold" && (
                      <Button
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleStatusChange("In Progress")}
                        disabled={statusUpdating}
                      >
                        Resume
                      </Button>
                    )}

                    {task.status === "Completed" && (
                      <div className="flex gap-2 w-full">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleStatusChange("Cancelled")}
                          disabled={statusUpdating}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleStatusChange("In Progress")}
                          disabled={statusUpdating}
                        >
                          Restart
                        </Button>
                      </div>
                    )}

                    {task.status === "Cancelled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleStatusChange("In Progress")}
                        disabled={statusUpdating}
                      >
                        Restart
                      </Button>
                    )}
                  </div>
                )}

              {/* Sidebar status select (admins/managers) */}
              {(currentUser.role === "Super Admin" || currentUser.role === "Admin") && (
                <div className="mt-2">
                  <Select value={task.status} onValueChange={(v) => handleStatusChange(v as TaskStatus)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="h-4 w-4" /><span>Due Date</span></div>
                <p className="text-sm">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</p>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600"><User className="h-4 w-4" /><span>Assigned To</span></div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6"><AvatarFallback>{(assignedUserName || "U").split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                    <span className="text-sm">{assignedUserName}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600"><User className="h-4 w-4" /><span>Created By</span></div>
                <p className="text-sm">{createdByName}</p>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600"><FileText className="h-4 w-4" /><span>Department</span></div>
                <p className="text-sm">{task.department ?? "—"}</p>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="h-4 w-4" /><span>Created</span></div>
                <p className="text-sm">{new Date(task.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
