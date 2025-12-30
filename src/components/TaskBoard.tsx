import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Plus,
  Search,
  Filter,
  Calendar as CalendarIcon,
  User,
  Clock,
} from 'lucide-react';
import type { Task, User as UserType, TaskStatus, TaskPriority } from '../types';
import {
  getTasksApi,
  createTaskApi,
  updateTaskApi,
  deleteTaskApi,
  restoreTaskApi,
  type TaskPayload,
  getMyTasksApi
} from "./service/task";
import { getProjectsApi, type Project } from "./service/projectService";
import { getEmployeesApi, type Employee } from "./service/employeeService";

interface TaskBoardProps {
  tasks: Task[];
  users: UserType[];
  currentUser: UserType;
  onTaskClick: (taskId: string) => void;
}

export function TaskBoard({ tasks, users, currentUser, onTaskClick }: TaskBoardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Create task form state
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    priority: 'Medium' as TaskPriority,
    dueDate: '',
    department: '',
    projectId: '', // Store project ID
    projectName: '', // Store project name for display
    assignedTo: '', // Store single employee ID
    status: 'Not Started' as TaskStatus
  });

  let currentEmployeeId = ""
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  currentEmployeeId = storedUser?.employee_profile?.id;
  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchEmployees();
    fetchTask();
  }, []);

  async function fetchTask() {
    try {
      const res = await getMyTasksApi();

      const responseData = (res.data as any)?.data || res.data;
      const fetchedTasks = responseData?.data || responseData || [];
      const tasksArray = Array.isArray(fetchedTasks) ? fetchedTasks : [];

    } catch (error) {

    }
  }

  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await getTasksApi();
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
      setLocalTasks(mappedTasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setLocalTasks([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjects() {
    try {
      const res = await getProjectsApi();
      const projectsArray = Array.isArray(res) ? res :
        Array.isArray(res.data) ? res.data :
          Array.isArray(res.data?.data) ? res.data.data : [];
      setProjects(projectsArray);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
    }
  }

  async function fetchEmployees() {
    try {
      const res = await getEmployeesApi();
      // Handle nested response structure similar to tasks
      const responseData = (res as any)?.data || res;
      const employeesArray = responseData?.data || responseData || [];
      const finalArray = Array.isArray(employeesArray) ? employeesArray : [];
      console.log('Fetched employees:', finalArray.length, finalArray);
      setEmployees(finalArray);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setEmployees([]);
    }
  }

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


  const columns: TaskStatus[] = ['To Do', 'In Progress', 'On Hold', 'Completed'];

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
  const parseTimeToHours = (timeString: string): number | undefined => {
    if (!timeString) return undefined;
    try {
      const parts = timeString.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseInt(parts[2], 10);
        return hours + (minutes / 60) + (seconds / 3600);
      }
      return parseFloat(timeString);
    } catch {
      return undefined;
    }
  };

  // Get unique departments from tasks (may be empty if API doesn't provide)
  const departments = Array.from(new Set(tasksToUse.map((t) => t.department).filter(Boolean)));

  const TaskCard = ({ task }: { task: Task }) => (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onTaskClick(task.id)}
    >
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
          <span className="line-clamp-1">{getAssignedUserNames(task.assignedTo)}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
          {task.timeSpent !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{task.timeSpent}h / {task.estimatedTime}h</span>
            </div>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.role === 'Manager' || currentUser.role === 'employee') && (
        <div className="px-4 pb-3 flex gap-2">
          <Select
            value={task.status === 'To Do' ? 'Not Started' : task.status}
            onValueChange={(value) => handleStatusUpdate(task.id, value)}
          >
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Tasks</h1>
          <p className="text-gray-500">Manage and track all your tasks</p>
        </div>
        {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
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
                <DialogDescription>
                  Add a new task and assign it to team members
                </DialogDescription>
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
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-due-date">Due Date *</Label>
                    <Input
                      id="task-due-date"
                      type="date"
                      value={createForm.dueDate}
                      onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-project">Project *</Label>
                    <Select
                      value={createForm.projectId}
                      onValueChange={(value) => {
                        const selectedProject = projects.find(p => p.id === value);
                        setCreateForm({
                          ...createForm,
                          projectId: value,
                          projectName: selectedProject?.name || ''
                        });
                      }}
                    >
                      <SelectTrigger id="task-project">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
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
                          employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name || employee.email}
                            </SelectItem>
                          ))
                        ) : (
                          users.filter(u => u.role !== 'Client').map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.username}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
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
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
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
                        status: 'To Do' as TaskStatus
                      });
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Task'}
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
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | 'All')}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="To Do">To Do</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | 'All')}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Priority</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {filteredTasks.length} of {tasksToUse.length} tasks
            </p>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'board' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('board')}
              >
                Board
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Board */}
      {loading && tasksToUse.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      ) : viewMode === 'board' ? (
        <div className="grid gap-4 md:grid-cols-4">
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
