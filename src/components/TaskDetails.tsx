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
  X,
} from "lucide-react";
import type { Task, User as UserType, TaskStatus, TaskPriority } from "../types";
import { getTaskByIdApi, updateTaskApi, getTaskDiscussionsApi, addTaskDiscussionApi, type TaskDiscussion } from "./service/task";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Linkify } from "./ui/linkify";

interface TaskDetailsProps {
  task?: Task;
  taskId?: string;
  users: UserType[]; // used for lookup
  employees?: any[]; // additional lookup
  currentUser: UserType;
  onBack: () => void;
}

export function TaskDetails({
  task: propTask,
  taskId,
  users,
  employees = [],
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
  // Discussions State
  const [discussions, setDiscussions] = useState<TaskDiscussion[]>([]);
  const [discussionMessage, setDiscussionMessage] = useState("");
  const [discussionFile, setDiscussionFile] = useState<File | null>(null);
  const [sendingDiscussion, setSendingDiscussion] = useState(false);

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
        assignedTo: Array.isArray(taskData.assigned_to) 
          ? taskData.assigned_to 
          : (taskData.assigned_to ? [taskData.assigned_to] : (taskData.assignee?.id ? [taskData.assignee.id] : [])),
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
      if (!silentBackground) {
        fetchDiscussions(); // Fetch discussions after task is loaded
      }
    } catch (error) {
      console.error("Failed to fetch task:", error);
    } finally {
      if (!silentBackground) setLoading(false);
    }
  }

  async function fetchDiscussions() {
    if (!taskId) return;
    try {
      const discRes = await getTaskDiscussionsApi(taskId);
      setDiscussions(extractResponseData(discRes) || []);
    } catch (err) {
      console.error("Failed to load discussions", err);
    }
  }

  async function handleSendDiscussion(e: React.FormEvent) {
    e.preventDefault();
    if (!taskId || (!discussionMessage.trim() && !discussionFile)) return;

    setSendingDiscussion(true);
    try {
      const formData = new FormData();
      formData.append("task_id", taskId);
      formData.append("message", discussionMessage);
      if (discussionFile) {
        formData.append("file", discussionFile);
      }

      await addTaskDiscussionApi(formData);
      setDiscussionMessage("");
      setDiscussionFile(null);
      await fetchDiscussions(); // Refresh discussions
    } catch (err: any) {
      console.error("Failed to send discussion:", err);
      alert(err?.response?.data?.message || "Failed to send discussion");
    } finally {
      setSendingDiscussion(false);
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
  const assignedUsers = (() => {
      const ids = Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []);
      if (ids.length === 0) return [];
      
      return ids.map(id => {
         // Check employees first, then users
         const emp = employees.find((e: any) => String(e.id) === String(id));
         if (emp) return { name: emp.name ?? emp.email, id };
         
         const u = users.find((u) => String(u.id) === String(id));
         if (u) return { name: u.username ?? u.email, id };
         
         return { name: "Unknown", id };
      });
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
              <div className="text-gray-700">
                <Linkify text={task.description ?? "—"} />
              </div>
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

          {/* Discussions (Chat Style) */}
          <Card>
            <CardHeader>
              <CardTitle>Discussions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {discussions.length > 0 ? (
                  discussions.map((disc) => {
                    const isMe = disc.user_id === currentUser.id; // Note: user_id is Employee ID, currentUser.id is User ID. They should align if logic is correct, otherwise might be mismatch.
                    // Ideally we compare against currentUser.employeeId or if currentUser IS employee. 
                    // Assuming currentUser.id is the correct ID to match.

                    return (
                      <div key={disc.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback>{(disc.user?.name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-600">{disc.user?.name || "Unknown"}</span>
                            <span className="text-[10px] text-gray-400">{new Date(disc.createdAt).toLocaleString()}</span>
                          </div>
                          <div className={`p-3 rounded-lg text-sm ${isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-900 rounded-tl-none"}`}>
                            {disc.message && <div className="whitespace-pre-wrap"><Linkify text={disc.message} /></div>}

                            {disc.attachments && Array.isArray(disc.attachments) && disc.attachments.length > 0 && (
                              <div className={`mt-2 p-2 rounded bg-white/10 ${isMe ? "border-white/20" : "border-gray-200 bg-white"}`}>
                                {disc.attachments.map((att: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Paperclip className={`h-3 w-3 ${isMe ? "text-white/70" : "text-gray-500"}`} />
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`text-xs hover:underline ${isMe ? "text-white" : "text-blue-600"}`}
                                    >
                                      {att.name}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-4 text-sm">No discussions yet. Start the conversation!</div>
                )}
              </div>

              <Separator />

              {/* New Message Input */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your message..."
                  value={discussionMessage}
                  onChange={(e) => setDiscussionMessage(e.target.value)}
                  rows={2}
                  className="min-h-[80px]"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label htmlFor="disc-file-upload" className="cursor-pointer flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 border rounded px-2 py-1">
                      <Paperclip className="h-3 w-3" />
                      {discussionFile ? discussionFile.name : "Attach File"}
                    </label>
                    <input
                      id="disc-file-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => setDiscussionFile(e.target.files?.[0] || null)}
                    />
                    {discussionFile && (
                      <button onClick={() => setDiscussionFile(null)} className="text-gray-500 hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!discussionMessage.trim() && !discussionFile) return;
                      setSendingDiscussion(true);
                      try {
                        const payload = new FormData();
                        if (discussionMessage) payload.append("message", discussionMessage);
                        if (discussionFile) payload.append("document", discussionFile);

                        await addTaskDiscussionApi(task.id, payload);

                        // Refresh discussions
                        const res = await getTaskDiscussionsApi(task.id);
                        setDiscussions(res.data);

                        setDiscussionMessage("");
                        setDiscussionFile(null);
                      } catch (err) {
                        console.error("Failed to send", err);
                        alert("Failed to send message");
                      } finally {
                        setSendingDiscussion(false);
                      }
                    }}
                    disabled={sendingDiscussion || (!discussionMessage.trim() && !discussionFile)}
                  >
                    {sendingDiscussion ? "Sending..." : "Send"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader><CardTitle>Attachments</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {task.attachments && Array.isArray(task.attachments) && task.attachments.length > 0 && (
                  <div className="space-y-2">
                    {task.attachments.map((attachment: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <div>
                            <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline text-blue-600">
                              {attachment.name}
                            </a>
                            <p className="text-xs text-gray-500">Uploaded by {attachment.uploaded_by_name || "User"} {attachment.uploadedAt ? `on ${new Date(attachment.uploadedAt).toLocaleDateString()}` : ""}</p>
                          </div>
                        </div>
                        {/* <Button variant="ghost" size="sm">Download</Button> */}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Attachment */}
                {(currentUser.role === "Super Admin" || currentUser.role === "Admin" || currentUser.role === "Project Lead") && (
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      className="text-sm"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          const formData = new FormData();
                          formData.append("document", file);

                          // We need to send some update data to satisfy validation if any, 
                          // but schema allows optional updates. 
                          // Ideally, backend should handle just file update if schema allows all optional.
                          // The updateTaskSchema allows optional everywhere.

                          // Optimistic update? No, let's wait for server.
                          await updateTaskApi(task.id, formData);
                          fetchTask(true); // refresh
                          alert("Attachment uploaded");
                        } catch (err: any) {
                          console.error("Upload failed", err);
                          alert("Failed to upload attachment");
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
                <p className="text-sm">{task.dueDate ? new Date(task.dueDate).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "No due date"}</p>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600"><User className="h-4 w-4" /><span>Assigned To</span></div>
                <div className="space-y-2">
                  {assignedUsers.length > 0 ? (
                    assignedUsers.map((u, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                           <AvatarFallback>{(u.name || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{u.name}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Unassigned</span>
                  )}
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
