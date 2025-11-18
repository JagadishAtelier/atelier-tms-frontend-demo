import { useState } from 'react';
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

  // Filter tasks based on user role and filters
  let filteredTasks = tasks.filter((task) => {
    if (currentUser.role === 'Super Admin' || currentUser.role === 'Admin') {
      return true;
    } else if (currentUser.role === 'Manager') {
      return task.department === currentUser.department;
    } else {
      return task.assignedTo.includes(currentUser.id);
    }
  });

  // Apply search and filters
  filteredTasks = filteredTasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    const matchesDepartment = departmentFilter === 'All' || task.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
  });

  const departments = Array.from(new Set(tasks.map((t) => t.department)));

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
      .map((id) => users.find((u) => u.id === id)?.name || 'Unknown')
      .join(', ');
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onTaskClick(task.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm">{task.title}</CardTitle>
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Title</Label>
                  <Input id="task-title" placeholder="Enter task title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    placeholder="Enter task description"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-priority">Priority</Label>
                    <Select>
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
                    <Label htmlFor="task-due-date">Due Date</Label>
                    <Input id="task-due-date" type="date" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-department">Department</Label>
                    <Select>
                      <SelectTrigger id="task-department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-project">Project</Label>
                    <Input id="task-project" placeholder="Project name" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateDialogOpen(false)}>
                    Create Task
                  </Button>
                </div>
              </div>
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
              Showing {filteredTasks.length} of {tasks.length} tasks
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
      {viewMode === 'board' ? (
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
