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
import { Plus, Search, Calendar as CalendarIcon, User, Clock } from "lucide-react";

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

  // Create task form state
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    priority: "Medium" as TaskPriority,
    dueDate: "",
    department: "",
    projectId: "", // Store project ID
    projectName: "", // Store project name for display
    assignedTo: "", // Store single employee ID
    status: "Not Started" as TaskStatus, // backend-aligned
  });

<<<<<<< HEAD
  // current employee id from local user (if present)
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const currentEmployeeId = storedUser?.employee_profile?.id || "";

  // ========== Effects ==========
=======
  let currentEmployeeId = ""
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  currentEmployeeId = storedUser?.employee_profile?.id;
  // Fetch tasks on mount
>>>>>>> 2fb70f69aab31128bcd464951a41bbdee0777e19
  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchEmployees();
  }, []);

<<<<<<< HEAD
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
=======
  async function fetchTask() {
    try {
      const res = await getMyTasksApi();

      const responseData = (res.data as any)?.data || res.data;
      const fetchedTasks = responseData?.data || responseData || [];
      const tasksArray = Array.isArray(fetchedTasks) ? fetchedTasks : [];

    } catch (error) {

>>>>>>> 2fb70f69aab31128bcd464951a41bbdee0777e19
    }
    return d as T;
  }

  // ========== Fetchers ==========
  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await getTasksApi();
<<<<<<< HEAD
      const data = extractData<any>(res);
      // data may be array or object with pagination: { total, currentPage, data: [...] }
      let tasksArray: any[] = [];
      if (Array.isArray(data)) tasksArray = data;
      else if (data?.data && Array.isArray(data.data)) tasksArray = data.data;
      else if (data?.rows && Array.isArray(data.rows)) tasksArray = data.rows;
      else tasksArray = [];

      const mappedTasks: TaskType[] = tasksArray.map((t: any) => mapApiTaskToFrontend(t));
=======
      // Handle nested response structure: data.data.data
      const responseData = (res.data as any)?.data || res.data;
      const fetchedTasks = responseData?.data || responseData || [];
      const tasksArray = Array.isArray(fetchedTasks) ? fetchedTasks : [];

      // Map API tasks to match the expected Task type
      const mappedTasks: Task[] = tasksArray.map((task: any) => {
        // Map status: null -> 'To Do', or map backend status to frontend status
        const statusMap: Record<string, TaskStatus> = {
          'Not Started': 'To Do',
          'In Progress': 'In Progress',
          'On Hold': 'On Hold',
          'Completed': 'Completed',
          'Cancelled': 'On Hold' // Map cancelled to On Hold for frontend
        };
        const frontendStatus = task.status
          ? (statusMap[task.status] || 'To Do')
          : 'To Do';

        // Map priority: null -> 'Medium'
        const priorityMap: Record<string, TaskPriority> = {
          'Low': 'Low',
          'Medium': 'Medium',
          'High': 'High',
          'Urgent': 'Urgent'
        };
        const frontendPriority = task.priority
          ? (priorityMap[task.priority] || 'Medium')
          : 'Medium';

        return {
          id: task.id,
          title: task.title || '',
          description: task.description || '',
          status: frontendStatus,
          priority: frontendPriority,
          assignedTo: task.assigned_to ? [task.assigned_to] : [], // Convert single ID to array
          assignedBy: task.created_by || currentUser.id,
          createdAt: task.createdAt || new Date().toISOString(),
          dueDate: task.due_date_and_time || task.dueDate || new Date().toISOString(),
          project: task.project?.name || task.project_id || '',
          department: task.department || '', // May not be in API response
          tags: task.tags || [],
          timeSpent: task.timeSpent || (task.timetaken ? parseTimeToHours(task.timetaken) : undefined),
          estimatedTime: task.estimatedTime,
          subtasks: task.subtasks,
          attachments: task.attachments,
          comments: task.comments
        };
      });
      console.log('Fetched tasks:', mappedTasks.length, mappedTasks);
>>>>>>> 2fb70f69aab31128bcd464951a41bbdee0777e19
      setLocalTasks(mappedTasks);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setLocalTasks([]);
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

<<<<<<< HEAD
  // ========== Mapping helpers ==========
  function mapApiTaskToFrontend(task: any): TaskType {
    // Backend fields:
    // id, title, description, status, priority, assigned_to, created_by, createdAt, due_date_and_time, project (relation with name), timetaken, total_hours
    const status: TaskStatus = (task.status as TaskStatus) ?? "Not Started";
    const priority: TaskPriority = (task.priority as TaskPriority) ?? "Medium";

    const assignedToId: string =
      task.assigned_to ??
      task.assignee?.id ??
      task.assignedTo ??
      ""; // fallback variations

    // Use assignee relation name if available
    const projectName = task.project?.name ?? task.project_name ?? task.project_id ?? "";
    const timetaken = task.timetaken ?? null;
=======
  // Use localTasks if available, otherwise fall back to prop
  const tasksToUse = Array.isArray(localTasks) && localTasks.length > 0
    ? localTasks
    : (Array.isArray(tasks) ? tasks : []);

  // Filter tasks based on user role and filters
  let filteredTasks = tasksToUse.filter((task) => {
    if (currentUser.role === 'Super Admin' || currentUser.role === 'Admin') {
      return true;
    } else if (currentUser.role === 'Manager') {
      return task.department === currentUser.department;
    } else {

      return task.assignedTo?.some(
        (id) => String(id) === String(currentEmployeeId)
      );
    }
  });

  // Apply search and filters
  filteredTasks = filteredTasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    // Allow tasks without department or match department filter
    const matchesDepartment = departmentFilter === 'All' || !task.department || task.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
  });
>>>>>>> 2fb70f69aab31128bcd464951a41bbdee0777e19

    const frontend: TaskType = {
      ...task,
      id: task.id,
      title: task.title ?? "",
      description: task.description ?? "",
      status,
      priority,
      // adapt to TaskType shape (assignedTo single string)
      assignedTo: assignedToId,
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

<<<<<<< HEAD
  // convert HH:mm:ss to hours float (same helper you had)
=======
  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter((task) => task.status === status);
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'Urgent':
        return 'destructive';
      case 'High':
        return 'default';
      case 'Medium':
        return 'secondary';
      case 'Low':
        return 'outline';
    }
  };



  const getAssignedUserNames = (userIds: string[]) => {
    return userIds
      .map((id) => users.find((u) => u.id === id)?.username || 'Unknown')
      .join(', ');
  };

  // Handle create task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title || !createForm.projectId || !createForm.assignedTo) {
      alert('Please fill in all required fields (Title, Project, and Assigned To)');
      return;
    }

    setLoading(true);
    try {
      // Map frontend status to backend status
      const statusMap: Record<string, "Not Started" | "In Progress" | "Completed" | "On Hold" | "Cancelled"> = {
        'To Do': 'Not Started',
        'In Progress': 'In Progress',
        'On Hold': 'On Hold',
        'Completed': 'Completed',
        'Not Started': 'Not Started',
        'Cancelled': 'Cancelled'
      };

      const payload: TaskPayload = {
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        priority: createForm.priority,
        due_date_and_time: createForm.dueDate ? new Date(createForm.dueDate).toISOString() : undefined,
        project_id: createForm.projectId, // Send UUID
        assigned_to: createForm.assignedTo, // Send single UUID string
        status: statusMap[createForm.status] || 'Not Started',
        is_active: true
      };

      await createTaskApi(payload);
      setIsCreateDialogOpen(false);
      setCreateForm({
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: '',
        department: '',
        projectId: '',
        projectName: '',
        assignedTo: '',
        status: 'To Do' as TaskStatus // Frontend uses 'To Do', will be mapped to 'Not Started' in payload
      });
      await fetchTasks(); // Refresh tasks
    } catch (error: any) {
      console.error('Failed to create task:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create task';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle status update (for drag and drop or click)
  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      // Map frontend status to backend status
      const backendStatusMap: Record<string, "Not Started" | "In Progress" | "Completed" | "On Hold" | "Cancelled"> = {
        'To Do': 'Not Started',
        'In Progress': 'In Progress',
        'On Hold': 'On Hold',
        'Completed': 'Completed',
        'Not Started': 'Not Started',
        'Cancelled': 'Cancelled'
      };
      const backendStatus = backendStatusMap[newStatus] || 'Not Started';

      await updateTaskApi(taskId, { status: backendStatus });
      await fetchTasks(); // Refresh tasks
    } catch (error: any) {
      console.error('Failed to update task status:', error);
      alert(error?.response?.data?.message || 'Failed to update task status');
    }
  };

  // Helper function to convert HH:mm:ss to hours
>>>>>>> 2fb70f69aab31128bcd464951a41bbdee0777e19
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

<<<<<<< HEAD
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
      if (!task.assignedTo) return false;
      if (String(task.assignedTo) !== String(currentEmployeeId)) return false;
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
    const id = Array.isArray(assignedTo) ? assignedTo[0] : assignedTo;
    if (!id) return "Unassigned";
    const emp = employees.find((e) => String(e.id) === String(id));
    if (emp) return emp.name ?? emp.email ?? "Unknown";
    const user = users.find((u) => String(u.id) === String(id));
    if (user) return user.username ?? user.email ?? "Unknown";
    return "Unknown";
  };

  // ========== Create task handler ==========
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title || !createForm.projectId || !createForm.assignedTo) {
      alert("Please fill in Title, Project and Assigned To");
      return;
    }

    setLoading(true);
    try {
      const payload: TaskPayload = {
        title: createForm.title.trim(),
        description: createForm.description?.trim() || undefined,
        priority: createForm.priority,
        due_date_and_time: createForm.dueDate ? new Date(createForm.dueDate).toISOString() : undefined,
        project_id: createForm.projectId,
        assigned_to: createForm.assignedTo,
        status: createForm.status ?? "Not Started",
        is_active: true,
      };

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
        assignedTo: "",
        status: "Not Started",
      });
      await fetchTasks();
    } catch (err: any) {
      console.error("Failed to create task:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to create task";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // ========== Status update handler ==========
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
=======
  const TaskCard = ({ task }: { task: Task }) => (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onTaskClick(task.id)}
    >
>>>>>>> 2fb70f69aab31128bcd464951a41bbdee0777e19
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
<<<<<<< HEAD

      {(currentUser.role === "Super Admin" || currentUser.role === "Admin" || currentUser.role === "Manager") && (
        <div className="px-4 pb-3 flex gap-2">
          <Select value={task.status ?? "Not Started"} onValueChange={(value) => handleStatusUpdate(task.id, value as TaskStatus)}>
=======
      {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.role === 'Manager' || currentUser.role === 'employee') && (
        <div className="px-4 pb-3 flex gap-2">
          <Select
            value={task.status === 'To Do' ? 'Not Started' : task.status}
            onValueChange={(value) => handleStatusUpdate(task.id, value)}
          >
>>>>>>> 2fb70f69aab31128bcd464951a41bbdee0777e19
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
<<<<<<< HEAD
                    <Label htmlFor="task-due-date">Due Date</Label>
=======
                    <Label htmlFor="task-due-date">Due Date *</Label>
>>>>>>> 2fb70f69aab31128bcd464951a41bbdee0777e19
                    <Input
                      id="task-due-date"
                      type="date"
                      value={createForm.dueDate}
                      onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-project">Project *</Label>
                    <Select
                      value={createForm.projectId}
                      onValueChange={(value) => {
<<<<<<< HEAD
                        const selected = projects.find((p) => p.id === value);
                        setCreateForm({ ...createForm, projectId: value, projectName: selected?.name ?? "" });
=======
                        const selectedProject = projects.find(p => p.id === value);
                        setCreateForm({
                          ...createForm,
                          projectId: value,
                          projectName: selectedProject?.name || ''
                        });
>>>>>>> 2fb70f69aab31128bcd464951a41bbdee0777e19
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
                    <Label htmlFor="task-assigned">Assign To *</Label>
                    <Select
                      value={createForm.assignedTo}
                      onValueChange={(value) => setCreateForm({ ...createForm, assignedTo: value })}
                    >
                      <SelectTrigger id="task-assigned">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.length > 0 ? (
                          employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.name ?? emp.email}
                            </SelectItem>
                          ))
                        ) : (
                          users.filter((u) => u.role !== "Client").map((user) => (
                            <SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="task-status">Status</Label>
                  <Select
                    value={createForm.status}
                    onValueChange={(value) => setCreateForm({ ...createForm, status: value as TaskStatus })}
                  >
                    <SelectTrigger id="task-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}

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
                        assignedTo: "",
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
        <div className="grid gap-4 md:grid-cols-5">
          {columns.map((status) => {
            const columnTasks = getTasksByStatus(status);
            return (
              <div key={status} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm">{status}</h3>
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
    </div>
  );
}
