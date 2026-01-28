import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Plus, Search, Calendar as CalendarIcon, User, Clock, Loader2 } from "lucide-react";
import { MultiSelect } from "./ui/multi-select";
import { useRef, useCallback } from "react";

import type {
  Task as TaskType,
  User as UserType,
  TaskStatus,
  TaskPriority,
} from "../types";

import {
  getTasksApi,
  createTaskApi,
  updateTaskApi,
  deleteTaskApi,
  restoreTaskApi,
  type TaskPayload,
  getMyTasksApi,
} from "./service/task";
import { getProjectsApi, type Project } from "./service/projectService";
import { getEmployeesApi, type Employee } from "./service/employeeService";
import { DateTimePicker } from "./ui/date-time-picker";

interface TaskBoardProps {
  tasks: TaskType[]; // initial prop fallback (optional)
  users: UserType[]; // system users for lookup fallback
  currentUser: UserType;
  onTaskClick: (taskId: string) => void;
}

export function TaskBoard({
  tasks = [],
  users = [],
  currentUser,
  onTaskClick,
}: TaskBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "All">(
    "All"
  );
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [localTasks, setLocalTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

  const lastTaskElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prevPage) => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Create task form state
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    priority: "Medium" as TaskPriority,
    dueDate: "",
    department: "",
    projectId: "", // Store project ID
    projectName: "", // Store project name for display
    assignedTo: [] as string[], // Store employee IDs
    status: "Not Started" as TaskStatus, // backend-aligned
  });

  const [createFile, setCreateFile] = useState<File | null>(null);

  // ...

  // ========== Create task handler ==========
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title || !createForm.projectId || createForm.assignedTo.length === 0) {
      alert("Please fill in Title, Project and Assigned To");
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("title", createForm.title.trim());
      if (createForm.description) payload.append("description", createForm.description.trim());
      payload.append("priority", createForm.priority);
      if (createForm.dueDate) payload.append("due_date_and_time", new Date(createForm.dueDate).toISOString());
      payload.append("project_id", createForm.projectId);
      payload.append("assigned_to", JSON.stringify(createForm.assignedTo));
      payload.append("status", createForm.status ?? "Not Started");
      payload.append("is_active", "true");

      if (createFile) {
        payload.append("document", createFile);
      }

      await createTaskApi(payload);
      setIsCreateDialogOpen(false);
      setCreateForm({
        title: "",
        description: "",
        priority: "Medium",
        dueDate: "",
        department: "",
        projectId: "",
        projectName: "",
        assignedTo: [],
        status: "Not Started",
      });
      setCreateFile(null);
      await fetchTasks();
    } catch (err: any) {
      console.error("Failed to create task:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to create task";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // ...


  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const currentEmployeeId = storedUser?.employee_profile?.id || "";

  // ========== Effects ==========
  // ========== Effects ==========
  useEffect(() => {
    fetchProjects();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch tasks when filters or page change
  useEffect(() => {
    // If page is 1, it's a reset/filter change
    const isReset = page === 1;
    fetchTasks(isReset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, statusFilter, priorityFilter, departmentFilter]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, priorityFilter, departmentFilter]);

  // ========== API helpers / robust parsing ==========
  function extractData<T = any>(res: any): T {
    // Common patterns:
    // 1) res.data -> { success, message, data }
    // 2) res.data.data -> actual data (resource or list)
    // 3) sometimes nested further: res.data.data.data (legacy)
    if (!res) return undefined as unknown as T;
    if (res.data === undefined) return res as T;
    const d = res.data;
    if (d && d.data !== undefined) {
      // if d.data.data => unwrap
      const d2 = d.data;
      if (d2 && d2.data !== undefined) return d2.data as T;
      return d2 as T;
    }
    return d as T;
  }

  // ========== Fetchers ==========
  // ========== Fetchers ==========
  async function fetchTasks(reset = false) {
    if (loading && !reset && page > 1) return; // Prevent duplicate fetch if already loading more

    setLoading(true);
    try {
      const params: any = {
        page: reset ? 1 : page,
        limit: 10,
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "All") params.status = statusFilter;
      if (priorityFilter !== "All") params.priority = priorityFilter;

      // Role filtering for API
      if (currentUser?.role === "employee") {
        params.assigned_to = currentEmployeeId;
      }

      const res = await getTasksApi(params);
      const data = extractData<any>(res);

      let tasksArray: any[] = [];
      if (Array.isArray(data)) tasksArray = data;
      else if (data?.data && Array.isArray(data.data)) tasksArray = data.data;
      else if (data?.rows && Array.isArray(data.rows)) tasksArray = data.rows;
      else tasksArray = [];

      const mappedTasks: TaskType[] = tasksArray.map((t: any) => mapApiTaskToFrontend(t));

      if (reset) {
        setLocalTasks(mappedTasks);
      } else {
        setLocalTasks((prev) => {
          // Filter duplicates just in case
          const newIds = new Set(mappedTasks.map(t => t.id));
          return [...prev.filter(t => !newIds.has(t.id)), ...mappedTasks];
        });
      }

      setHasMore(mappedTasks.length >= 10);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      // Don't clear tasks on error if loading more
      if (reset) setLocalTasks([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyTasks() {
    setLoading(true);
    try {
      const res = await getMyTasksApi();
      const data = extractData<any>(res);
      let tasksArray: any[] = [];
      if (Array.isArray(data)) tasksArray = data;
      else if (data?.data && Array.isArray(data.data)) tasksArray = data.data;
      else tasksArray = [];

      const mappedTasks: TaskType[] = tasksArray.map((t: any) => mapApiTaskToFrontend(t));
      setLocalTasks(mappedTasks);
    } catch (err) {
      console.error("Failed to fetch my tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjects() {
    try {
      const res = await getProjectsApi();
      const data = extractData<any>(res) || res;
      const arr = Array.isArray(data) ? data : data?.data ?? [];
      setProjects(Array.isArray(arr) ? arr : []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setProjects([]);
    }
  }

  async function fetchEmployees() {
    try {
      const res = await getEmployeesApi();
      const data = extractData<any>(res) || res;
      const arr = Array.isArray(data) ? data : data?.data ?? [];
      setEmployees(Array.isArray(arr) ? arr : []);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      setEmployees([]);
    }
  }

  // ========== Mapping helpers ==========
  function mapApiTaskToFrontend(task: any): TaskType {
    // Backend fields:
    // id, title, description, status, priority, assigned_to, created_by, createdAt, due_date_and_time, project (relation with name), timetaken, total_hours
    const status: TaskStatus = (task.status as TaskStatus) ?? "Not Started";
    const priority: TaskPriority = (task.priority as TaskPriority) ?? "Medium";

    // multiple assignees logic
    let assignedIds: string[] = [];
    if (Array.isArray(task.assigned_to)) assignedIds = task.assigned_to;
    else if (task.assigned_to) assignedIds = [task.assigned_to];
    else if (task.assignee?.id) assignedIds = [task.assignee.id]; // fallback

    // Use assignee relation name if available
    const projectName = task.project?.name ?? task.project_name ?? task.project_id ?? "";
    const timetaken = task.timetaken ?? null;

    const frontend: TaskType = {
      ...task,
      id: task.id,
      title: task.title ?? "",
      description: task.description ?? "",
      status,
      priority,
      // adapt to TaskType shape 
      assignedTo: assignedIds,
      assignedBy: task.created_by ?? task.createdBy ?? currentUser?.id,
      createdAt: task.createdAt ?? task.created_at ?? new Date().toISOString(),
      dueDate: task.due_date_and_time ?? task.dueDate ?? null,
      project: projectName,
      department: task.department ?? null,
      tags: task.tags ?? [],
      timeSpent:
        typeof task.timeSpent !== "undefined"
          ? task.timeSpent
          : timetaken
            ? parseTimeToHours(timetaken)
            : undefined,
      estimatedTime: (task.estimatedTime as number) ?? undefined,
      subtasks: task.subtasks ?? [],
      attachments: task.attachments ?? [],
      comments: task.comments ?? [],
      // Ensure total_hours present if backend provides
      total_hours: task.total_hours ?? task.totalHours ?? undefined,
      timetaken: timetaken ?? undefined,
    };

    return frontend;
  }

  // convert HH:mm:ss to hours float (same helper you had)
  const parseTimeToHours = (timeString: string): number | undefined => {
    if (!timeString) return undefined;
    try {
      const parts = timeString.split(":");
      if (parts.length === 3) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseInt(parts[2], 10);
        return hours + minutes / 60 + seconds / 3600;
      }
      return parseFloat(timeString);
    } catch {
      return undefined;
    }
  };

  // use localTasks if available else props
  const tasksToUse: TaskType[] =
    Array.isArray(localTasks) && localTasks.length > 0 ? localTasks : Array.isArray(tasks) ? tasks : [];

  // ========== Filtering ==========
  const filteredTasks = tasksToUse.filter((task) => {
    // role based visibility
    if (currentUser?.role === "Super Admin" || currentUser?.role === "Admin") {
      // full view
    } else if (currentUser?.role === "Manager") {
      if (task.department && currentUser.department) {
        if (task.department !== currentUser.department) return false;
      }
      // otherwise allow
    } else {
      // normal user: must be assigned to them
      if (!task.assignedTo || task.assignedTo.length === 0) return false;
      const ids = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
      if (!ids.includes(String(currentEmployeeId))) return false;
    }

    // search
    const matchesSearch =
      !searchTerm ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "All" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
    const matchesDepartment = departmentFilter === "All" || !task.department || task.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
  });

  // columns (include Cancelled)
  const columns: TaskStatus[] = ["Not Started", "In Progress", "On Hold", "Completed", "Cancelled"];

  const getTasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter((task) => (task.status ?? "Not Started") === status);

  // ========== UI helpers ==========
  const getPriorityColor = (priority: TaskPriority) => {
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

  const getAssignedUserName = (assignedTo: string | string[] | undefined) => {
    const ids = Array.isArray(assignedTo) ? assignedTo : (assignedTo ? [assignedTo] : []);
    if (ids.length === 0) return "Unassigned";

    const names = ids.map(id => {
      const emp = employees.find((e) => String(e.id) === String(id));
      if (emp) return emp.name ?? emp.email ?? "Unknown";
      const user = users.find((u) => String(u.id) === String(id));
      return user?.username ?? user?.email ?? "Unknown";
    });

    return names.join(", ");
  };


  const handleStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
    setLoading(true);
    try {
      await updateTaskApi(taskId, { status: newStatus });
      await fetchTasks();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert(err?.response?.data?.message || "Failed to update task status");
    } finally {
      setLoading(false);
    }
  };

  // ========== Task card component ==========
  const TaskCard = ({ task }: { task: TaskType }) => (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => onTaskClick(task.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm capitalize">{task.title}</CardTitle>
          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
            {task.priority}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <User className="h-3 w-3" />
          <span className="line-clamp-1">{getAssignedUserName(task.assignedTo)}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</span>
          </div>
          {typeof task.timeSpent !== "undefined" && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{Number(task.timeSpent).toFixed(2)}h {task.estimatedTime ? `/ ${task.estimatedTime}h` : ""}</span>
            </div>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>

      {(currentUser.role === "Super Admin" || currentUser.role === "Admin" || currentUser.role === "Manager") && (
        <div className="px-4 pb-3 flex gap-2">
          <Select value={task.status ?? "Not Started"} onValueChange={(value) => handleStatusUpdate(task.id, value as TaskStatus)}>
            <SelectTrigger className="h-8 text-xs" onClick={(e) => e.stopPropagation()}>
              <SelectValue />
            </SelectTrigger>
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
    </Card>
  );

  // Departments derived from tasks
  const departments = Array.from(new Set(tasksToUse.map((t) => t.department).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Tasks</h1>
          <p className="text-gray-500">Manage and track all your tasks</p>
        </div>

        {(currentUser.role === "Super Admin" || currentUser.role === "Admin" || currentUser.role === "Manager") && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Add a new task and assign it to team members</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Title *</Label>
                  <Input
                    id="task-title"
                    placeholder="Enter task title"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    placeholder="Enter task description"
                    rows={4}
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-priority">Priority</Label>
                    <Select
                      value={createForm.priority}
                      onValueChange={(value) => setCreateForm({ ...createForm, priority: value as TaskPriority })}
                    >
                      <SelectTrigger id="task-priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task-due-date">Due Date</Label>
                    <DateTimePicker
                      date={createForm.dueDate ? new Date(createForm.dueDate) : undefined}
                      setDate={(date) => setCreateForm({ ...createForm, dueDate: date ? date.toISOString() : "" })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-file">Attachment</Label>
                  <Input
                    id="task-file"
                    type="file"
                    onChange={(e) => setCreateFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-project">Project *</Label>
                    <Select
                      value={createForm.projectId}
                      onValueChange={(value) => {
                        const selected = projects.find((p) => p.id === value);
                        setCreateForm({ ...createForm, projectId: value, projectName: selected?.name ?? "" });
                      }}
                    >
                      <SelectTrigger id="task-project">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task-project">Assigned To *</Label>
                    <MultiSelect
                      variant="inverted"
                      options={employees.length > 0
                        ? employees.map(emp => ({ label: emp.name ?? emp.email, value: emp.id }))
                        : users.filter(u => u.role !== "Client").map(u => ({ label: u.username, value: u.id }))}
                      value={createForm.assignedTo}
                      onValueChange={(vals) => setCreateForm({ ...createForm, assignedTo: vals })}
                      placeholder="Select employees"
                      maxCount={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setCreateForm({
                        title: "",
                        description: "",
                        priority: "Medium",
                        dueDate: "",
                        department: "",
                        projectId: "",
                        projectName: "",
                        assignedTo: [],
                        status: "Not Started",
                      });
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>

                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | "All")}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | "All")}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Priority</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {filteredTasks.length} of {tasksToUse.length} tasks</p>
            <div className="flex gap-2">
              <Button variant={viewMode === "board" ? "default" : "outline"} size="sm" onClick={() => setViewMode("board")}>Board</Button>
              <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>List</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Board / List */}
      {loading && tasksToUse.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      ) : viewMode === "board" ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {columns.map((status) => {
            const columnTasks = getTasksByStatus(status);
            return (
              <div key={status} className="space-y-4">
                <div className="flex items-center justify-between sticky -top-6 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 border-b">
                  <h3 className="text-sm font-semibold">{status}</h3>
                  <Badge variant="secondary">{columnTasks.length}</Badge>
                </div>
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* Sentinel for Infinite Scroll */}
      <div ref={lastTaskElementRef} className="h-4 flex items-center justify-center py-4">
        {loading && tasksToUse.length > 0 && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
      </div>
    </div>
  );
}
