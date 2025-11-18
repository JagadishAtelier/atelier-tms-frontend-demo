import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  Users,
  CheckCircle,
  Clock,
} from 'lucide-react';
import type { Project, Task, User } from '../types';

interface ProjectsProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
  currentUser: User;
}

export function Projects({ projects, tasks, users, currentUser }: ProjectsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'On Hold' | 'Completed'>('All');

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProjectStats = (project: Project) => {
    const projectTasks = tasks.filter((t) => t.project === project.name);
    const completedTasks = projectTasks.filter((t) => t.status === 'Completed').length;
    const totalTasks = projectTasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Get unique team members
    const teamMembers = new Set<string>();
    projectTasks.forEach((task) => {
      task.assignedTo.forEach((userId) => teamMembers.add(userId));
    });

    return {
      totalTasks,
      completedTasks,
      progress,
      teamSize: teamMembers.size,
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="default">Active</Badge>;
      case 'On Hold':
        return <Badge variant="secondary">On Hold</Badge>;
      case 'Completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Projects</h1>
          <p className="text-gray-500">Manage and track all projects</p>
        </div>
        {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{projects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {projects.filter((p) => p.status === 'Active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">On Hold</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {projects.filter((p) => p.status === 'On Hold').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {projects.filter((p) => p.status === 'Completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'All' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('All')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'Active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('Active')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'On Hold' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('On Hold')}
              >
                On Hold
              </Button>
              <Button
                variant={statusFilter === 'Completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('Completed')}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => {
          const stats = getProjectStats(project);
          return (
            <Card key={project.id} className="cursor-pointer transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <p className="mt-1 text-sm text-gray-500">{project.department}</p>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span>{stats.progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={stats.progress} />
                  <p className="text-xs text-gray-500">
                    {stats.completedTasks} of {stats.totalTasks} tasks completed
                  </p>
                </div>

                {/* Dates */}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                  {project.endDate && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Ended: {new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Team */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{stats.teamSize} team members</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    View Tasks
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <FolderKanban className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p>No projects found</p>
            <p className="text-sm">Try adjusting your filters or create a new project</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
