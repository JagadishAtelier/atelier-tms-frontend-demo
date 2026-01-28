import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  X,
  Paperclip,
} from "lucide-react";
import { Linkify } from "./ui/linkify";
import { TaskDetails } from "./TaskDetails";
import { MultiSelect } from "./ui/multi-select";

import type { Task, User } from "../types";
import {
  getProjectsApi,
  createProjectApi,
  getProjectByIdApi,
  updateProjectApi,
  deleteProjectApi,
  getProjectTimeReportApi,
  type ProjectTimeReport,
  type ProjectTimeByDateEmployee,
  type ProjectEmployeeTotal,
} from "../components/service/projectService";
import { getTaskByProjectApi } from "../components/service/task";
import type { Task as ServiceTask } from "../components/service/task";
import type { Project } from "../components/service/projectService";
import {
  getEmployeesApi,
  type Employee,
} from "../components/service/employeeService";

interface ProjectsProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
}

export function Projects({ tasks, users, currentUser }: ProjectsProps) {
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // Dashboard Stats
  const [stats, setStats] = useState({ total: 0, active: 0, onHold: 0, completed: 0 });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | "Active" | "On Hold" | "Completed">("All");

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // View Tasks State
  const [viewTasksOpen, setViewTasksOpen] = useState(false);
  const [viewTasksProject, setViewTasksProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Task Detail State (for viewing task details from project tasks)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  /* -------------------------
     Status Derivation
  ------------------------- */
  const deriveProjectStatus = (project: Project): string => {
    const tasks = (project as any).tasks || [];
    if (tasks.length === 0) return project.status || "Not Started";

    if (tasks.some((t: any) => t.status === "On Hold")) return "On Hold";

    const allCompleted = tasks.every((t: any) => t.status === "Completed");
    if (allCompleted) return "Completed";

    const allNotStarted = tasks.every((t: any) => ["Not Started", "To Do"].includes(t.status));
    if (allNotStarted) return "Not Started";

    return "In Progress";
  };

  /* -------------------------
     Fetch projects (robust)
  ------------------------- */
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch ALL projects matching search (ignore backend status filter to ensure derived statuses work)
      const res = await getProjectsApi({
        search: searchTerm,
        limit: 1000
      });

      // Normalize various API shapes:
      let projectsArray =
        Array.isArray(res) ? res :
          Array.isArray(res.data) ? res.data :
            Array.isArray(res.data?.data) ? res.data.data :
              Array.isArray(res.rows) ? res.rows :
                [];

      // Client-side filtering check using Derived Status
      if (statusFilter !== "All") {
        projectsArray = projectsArray.filter((p: any) => {
          const derived = deriveProjectStatus(p); // Uses task logic

          if (statusFilter === "Active") {
            // Map Active filter to In Progress / Not Started
            return derived === "In Progress" || derived === "Not Started";
          }
          // Exact matches for On Hold / Completed
          return derived === statusFilter;
        });
      }

      setProjects(projectsArray);
      return projectsArray;
    } catch (err) {
      console.error("Failed to fetch projects", err);
      setProjects([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);



  const fetchStats = async () => {
    try {
      // Fetch ALL projects to calculate global stats consistently
      const res = await getProjectsApi({ limit: 1000 });

      const allProjects =
        Array.isArray(res) ? res :
          Array.isArray(res.data) ? res.data :
            Array.isArray(res.data?.data) ? res.data.data :
              Array.isArray(res.rows) ? res.rows :
                [];

      const total = allProjects.length;
      let active = 0;
      let onHold = 0;
      let completed = 0;

      allProjects.forEach((p: any) => {
        const s = deriveProjectStatus(p);
        if (s === "On Hold") onHold++;
        else if (s === "Completed") completed++;
        else if (s === "In Progress" || s === "Not Started") active++;
      });

      setStats({ total, active, onHold, completed });
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  };

  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const res = await getEmployeesApi();

      // Normalize API response
      const employeesArray =
        Array.isArray(res) ? res :
          Array.isArray(res.data) ? res.data :
            Array.isArray(res.data?.data) ? res.data.data :
              [];

      setEmployees(employeesArray);
    } catch (err) {
      console.error("Failed to fetch employees", err);
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };


  useEffect(() => {
    fetchStats();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  /* -------------------------
     Filters
  ------------------------- */
  /* -------------------------
     Filters (Client side removed, now API based)
  ------------------------- */
  // const filteredProjects = projects; // Direct mapping



  /* -------------------------
     Project stats helper
  ------------------------- */
  const parseTeamMembers = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  /* -------------------------
     Project stats calculator
  ------------------------- */
  const getProjectStats = (project: Project) => {
    // Calculate task statistics using nested tasks from API (Project include)
    const projectTasks = (project as any).tasks || [];
    const completedTasks = projectTasks.filter((t: any) => t.status === "Completed").length;
    const totalTasks = projectTasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Parse team members safely
    const members = parseTeamMembers(project.team_members);

    return {
      teamSize: members.length,
      totalTasks,
      completedTasks,
      progress,
    };
  };

  /* -------------------------
     Badges
  ------------------------- */


  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case "On Hold":
        return <Badge className="bg-amber-500 hover:bg-amber-600">On Hold</Badge>;
      case "In Progress":
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case "Active":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Active</Badge>;
      case "Not Started":
        return <Badge variant="secondary">Not Started</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  /* -------------------------
     Create Project form state & handlers
  ------------------------- */
  const emptyCreate = {
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    given_enddate: "",
    status: "Not Started",
    project_lead: "",
    team_members: [] as string[],
  };

  const [createForm, setCreateForm] = useState<any>(emptyCreate);
  useEffect(() => {
    if (!createForm.project_lead && employees.length > 0) {
      setCreateForm((s: any) => ({
        ...s,
        project_lead: employees[0].id,
      }));
    }
  }, [employees]);


  const handleCreateChange = (k: string, v: any) =>
    setCreateForm((s: any) => ({ ...s, [k]: v }));

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append("name", String(createForm.name).trim());
      if (createForm.description) payload.append("description", createForm.description);
      if (createForm.start_date) payload.append("start_date", new Date(createForm.start_date).toISOString());
      if (createForm.end_date) payload.append("end_date", new Date(createForm.end_date).toISOString());
      if (createForm.given_enddate) payload.append("given_enddate", new Date(createForm.given_enddate).toISOString());
      if (createForm.status) payload.append("status", createForm.status);
      if (createForm.project_lead) payload.append("project_lead", createForm.project_lead);
      if (createForm.team_members && createForm.team_members.length > 0) {
        payload.append("team_members", JSON.stringify(createForm.team_members));
      }
      payload.append("is_active", "true");

      if (createFile) {
        payload.append("document", createFile);
      }

      await createProjectApi(payload);
      alert("Project created");
      setCreateOpen(false);
      setCreateForm(emptyCreate);
      setCreateFile(null);
      fetchProjects();
      fetchStats();
    } catch (err: any) {
      console.error("Create failed", err);
      // alert(err?.message || "Failed to create project");
    }
  };

  /* -------------------------
     View/Edit project modal handlers
     - prefer prefetched report from projectReports
  ------------------------- */
  const openView = async (projectIdOrObj: string | Project) => {
    try {
      let proj: Project | null = null;
      if (typeof projectIdOrObj === "string") {
        const res = await getProjectByIdApi(projectIdOrObj);
        // normalize
        proj = (res as any).data ?? res;
      } else {
        proj = projectIdOrObj;
      }
      setSelectedProject(proj);
      setViewOpen(true);

      // use prefetched report if available, otherwise fetch
      if (proj?.id) {
        const cached = projectReports[proj.id];
        if (cached) {
          setTimeReport(cached);
        } else {
          fetchTimeReport(proj.id);
        }
      }
    } catch (err) {
      console.error("Failed to load project", err);
      alert("Failed to load project details");
    }
  };

  const handleUpdateProject = async (updates: Partial<Project> | FormData) => {
    if (!selectedProject) return;
    try {
      await updateProjectApi(selectedProject.id, updates);
      alert("Project updated");
      setViewOpen(false);
      setSelectedProject(null);
      fetchProjects();
      fetchStats();
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update project");
    }
  };

  const handleDeleteProject = async (hard = false) => {
    if (!selectedProject) return;
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProjectApi(selectedProject.id);
      alert("Project deleted");
      setViewOpen(false);
      setSelectedProject(null);
      fetchProjects();
      fetchStats();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete project");
    }
  };

  /* -------------------------
     Permission check for viewing tasks
  ------------------------- */
  const canViewProjectTasks = (project: Project): boolean => {
    // Admins and Super Admins can always view
    if (currentUser.role === "Super Admin" || currentUser.role === "Admin") {
      return true;
    }

    // Project lead can view their project's tasks
    if (project.project_lead === currentUser.id || project.project_lead === (currentUser as any).employeeId) {
      return true;
    }

    return false;
  };



  const handleViewTasks = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setViewTasksProject(project);
    setViewTasksOpen(true);
    setTasksLoading(true);
    try {
      const res = await getTaskByProjectApi(project.id);
      // normalize
      // response structure: { success: true, message: "...", data: [...] }
      const tasks = res.data && Array.isArray(res.data.data) ? res.data.data : [];
      setProjectTasks(tasks as unknown as Task[]);
    } catch (err) {
      console.error("Failed to fetch project tasks", err);
      setProjectTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  /* -------------------------
     Loading UI
  ------------------------- */
  if (loading) {
    return Loading();
  }

  /* -------------------------
     Render
  ------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-gray-500">Manage and track all projects</p>
        </div>
        {(currentUser.role === "Super Admin" ||
          currentUser.role === "Admin" ||
          currentUser.role === "Manager") && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">Active</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">On Hold</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.onHold}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.completed}</div>
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
                variant={statusFilter === "All" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("All")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "Active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("Active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "On Hold" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("On Hold")}
              >
                On Hold
              </Button>
              <Button
                variant={statusFilter === "Completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("Completed")}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const stats = getProjectStats(project);
          const cachedReport = projectReports[project.id];
          const teamCount = cachedReport ? teamCountFromReport(cachedReport) : stats.teamSize;
          return (
            <Card
              key={project.id}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => openView(project)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-md font-medium truncate w-50" title={project.name}>{project.name}</CardTitle>
                    <p className="mt-1 text-sm text-gray-500">{/* optionally department */}</p>
                  </div>
                  {getStatusBadge(deriveProjectStatus(project))}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Started:{" "}
                      {project.start_date ? new Date(project.start_date).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  {project.end_date && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Ended: {new Date(project.end_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{stats.teamSize + 1} team members</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => handleViewTasks(e, project)}
                    disabled={!canViewProjectTasks(project)}
                  >
                    View Tasks
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <FolderKanban className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p>No projects found</p>
            <p className="text-sm">Try adjusting your filters or create a new project</p>
          </CardContent>
        </Card>
      )}

      {/* -------------------------
          Create Project Modal
         ------------------------- */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h3 className="text-lg font-medium">Create Project</h3>
              <button onClick={() => setCreateOpen(false)} className="p-2">
                <X />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <Input
                    required
                    value={createForm.name}
                    onChange={(e) => handleCreateChange("name", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => handleCreateChange("description", e.target.value)}
                    className="mt-1 w-full rounded-md border p-2"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={createForm.start_date}
                      onChange={(e) => handleCreateChange("start_date", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={createForm.end_date}
                      onChange={(e) => handleCreateChange("end_date", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Given End Date</label>
                    <Input
                      type="date"
                      value={createForm.given_enddate}
                      onChange={(e) => handleCreateChange("given_enddate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">


                  <div>
                    <label className="block text-sm font-medium">Project Lead</label>
                    <select
                      value={createForm.project_lead}
                      onChange={(e) => handleCreateChange("project_lead", e.target.value)}
                      className="mt-1 w-full rounded-md border p-2"
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} {emp.department ? `(${emp.department})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Team Members</label>
                  <MultiSelect
                    variant="inverted"
                    options={employees.map((emp) => ({
                      label: emp.name + (emp.department ? ` (${emp.department})` : ""),
                      value: emp.id,
                    }))}
                    value={parseTeamMembers(createForm.team_members || [])}
                    onValueChange={(selected) => handleCreateChange("team_members", selected)}
                    placeholder="Select team members..."
                    maxCount={2}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">Attachment (Document)</label>
                  <Input
                    type="file"
                    onChange={(e) => setCreateFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Project</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------
          View / Edit Project Modal (includes Time Report + Team Members)
         ------------------------- */}
      {viewOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-lg my-8">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h3 className="text-lg font-medium">Project Details</h3>
              <button onClick={() => { setViewOpen(false); setSelectedProject(null); setTimeReport(null); }} className="p-2">
                <X />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-semibold">{selectedProject.name}</h4>
                  {/* <p className="text-sm text-gray-600">{selectedProject.description}</p> */}
                </div>
                {/* <div>{getStatusBadge(selectedProject.status)}</div> */}
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={selectedProject.start_date ? new Date(selectedProject.start_date).toISOString().slice(0, 10) : ""}
                    onChange={(e) => setSelectedProject((s) => s ? { ...s, start_date: e.target.value } : s)}
                    disabled={isEmployee}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={selectedProject.end_date ? new Date(selectedProject.end_date).toISOString().slice(0, 10) : ""}
                    onChange={(e) => setSelectedProject((s) => s ? { ...s, end_date: e.target.value } : s)}
                    disabled={isEmployee}
                  />
                </div>
              </div>

              {/* Attachments Display */}
              {selectedProject.attachments && selectedProject.attachments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">Attachments</label>
                  <div className="space-y-2">
                    {selectedProject.attachments.map((att: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border p-2 bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            {att.name}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Update File Input */}
              {(currentUser.role === "Super Admin" || currentUser.role === "Admin" || currentUser.role === "Manager") && (
                <div>
                  <label className="block text-sm font-medium">Add Attachment (Update)</label>
                  <Input
                    type="file"
                    onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium">Status</label>
                {!isEmployee ? (
                  <select
                    value={selectedProject.status ?? ""}
                    onChange={(e) => setSelectedProject((s) => s ? { ...s, status: e.target.value } : s)}
                    className="mt-1 w-full rounded-md border p-2"
                  >
                    <option>Not Started</option>
                    <option>Active</option>
                    <option>In Progress</option>
                    <option>On Hold</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                ) : (
                  <div className="mt-1 rounded-md border p-2 bg-gray-50 text-sm">
                    {selectedProject.status ?? "—"}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium">Project Lead</label>
                  <select
                    value={selectedProject.project_lead || ""}
                    onChange={(e) => setSelectedProject((s) => s ? { ...s, project_lead: e.target.value } : s)}
                    className="mt-1 w-full rounded-md border p-2"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} {emp.department ? `(${emp.department})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Team Members</label>
                  <MultiSelect
                    variant="inverted"
                    options={employees.map((emp) => ({
                      label: emp.name + (emp.department ? ` (${emp.department})` : ""),
                      value: emp.id,
                    }))}
                    value={parseTeamMembers(selectedProject.team_members || [])}
                    onValueChange={(selected) => setSelectedProject((s) => s ? { ...s, team_members: selected } : s)}
                    placeholder="Select team members..."
                    maxCount={2}
                    disabled={!(currentUser.role === "Super Admin" || currentUser.role === "Admin" || currentUser.role === "Manager")}
                  />
                </div>
              </div>


              <div>
                <label className="block text-sm font-medium">Description</label>
                {(currentUser.role === "Super Admin" || currentUser.role === "Admin" || currentUser.role === "Manager") ? (
                  <textarea
                    value={selectedProject.description ?? ""}
                    onChange={(e) => setSelectedProject((s) => s ? { ...s, description: e.target.value } : s)}
                    className="mt-1 w-full rounded-md border p-2"
                    rows={3}
                  />
                ) : (
                  <div className="mt-1 w-full rounded-md border p-2 min-h-[80px] bg-gray-50">
                    <Linkify text={selectedProject.description ?? ""} />
                  </div>
                )}
              </div>

              {/* Team Members Section (from time report) */}
              <div className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" /> Team Members
                    <span className="ml-2 text-xs text-gray-500">({teamCountFromReport(projectReports[selectedProject.id])} members)</span>
                  </h5>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { if (selectedProject) fetchTimeReport(selectedProject.id); }}>
                      Refresh
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setTimeReport(null); setReportError(null); }}>
                      Clear
                    </Button>
                  </div>
                </div>

                {reportLoading && <div className="text-sm text-gray-600">Loading team members...</div>}
                {reportError && <div className="text-sm text-red-600">{reportError}</div>}

                {!reportLoading && !reportError && (timeReport ?? projectReports[selectedProject.id]) && (
                  <>
                    {/* derive members from modal report (prefer timeReport) */}
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {deriveTeamFromReport(timeReport ?? projectReports[selectedProject.id]).map((m: any) => (
                        <div key={m.id} className="flex items-center gap-3 rounded border p-3">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold">
                            {String(m.name || m.id).split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                          </div>
                          <div className="flex-1 text-sm">
                            <div className="font-medium">{m.name}</div>
                            <div className="text-xs text-gray-500">
                              {m.department ? `${m.department}` : (m.email ? m.email : "")}
                            </div>
                          </div>
                          <div className="text-sm font-semibold">{Number(m.hours ?? 0).toFixed(2)} hrs</div>
                        </div>
                      ))}
                      {deriveTeamFromReport(timeReport ?? projectReports[selectedProject.id]).length === 0 && (
                        <div className="text-sm text-gray-500 p-2 col-span-full">No team members found in the report.</div>
                      )}
                    </div>
                  </>
                )}

                {!reportLoading && !reportError && !timeReport && !projectReports[selectedProject.id] && (
                  <div className="text-sm text-gray-500">No report loaded. Click Refresh to load team members (via time report).</div>
                )}
              </div>

              {/* Time Report Section */}
              <div className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium">Time Report</h5>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { if (selectedProject) fetchTimeReport(selectedProject.id); }}>
                      Refresh
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setTimeReport(null); setReportError(null); }}>
                      Clear
                    </Button>
                  </div>
                </div>

                {reportLoading && <div className="text-sm text-gray-600">Loading report...</div>}
                {reportError && <div className="text-sm text-red-600">{reportError}</div>}

                {!reportLoading && !reportError && (timeReport ?? projectReports[selectedProject.id]) && (
                  <div className="space-y-4">
                    {/* summary */}
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      <div className="p-3 rounded border">
                        <div className="text-xs text-gray-500">Total (from timings)</div>
                        <div className="text-xl font-semibold">{(timeReport ?? projectReports[selectedProject.id])?.projectTotals?.total_from_timings ?? 0} hrs</div>
                      </div>
                      <div className="p-3 rounded border">
                        <div className="text-xs text-gray-500">Total (from task hours)</div>
                        <div className="text-xl font-semibold">{(timeReport ?? projectReports[selectedProject.id])?.projectTotals?.total_from_task_hours ?? 0} hrs</div>
                      </div>
                      <div className="p-3 rounded border">
                        <div className="text-xs text-gray-500">Grand Total</div>
                        <div className="text-xl font-semibold">{(timeReport ?? projectReports[selectedProject.id])?.projectTotals?.grand_total ?? 0} hrs</div>
                      </div>
                    </div>

                    {/* employee totals */}
                    <div>
                      <div className="text-sm font-medium mb-2">Employee Totals</div>
                      <div className="space-y-2">
                        {((timeReport ?? projectReports[selectedProject.id])?.perEmployeeTaskTotals ?? []).map((r: ProjectEmployeeTotal) => (
                          <div key={r.employee_id} className="flex items-center justify-between rounded border p-2">
                            <div>{r.employee_name || r.employee_id}</div>
                            <div className="font-semibold">{Number(r.task_total_hours ?? 0).toFixed(2)} hrs</div>
                          </div>
                        ))}
                        {(((timeReport ?? projectReports[selectedProject.id])?.perEmployeeTaskTotals ?? []).length === 0) && (
                          <div className="text-sm text-gray-500">No employee totals available</div>
                        )}
                      </div>
                    </div>

                    {/* date-wise table */}
                    <div>
                      <div className="text-sm font-medium mb-2">Date-wise Hours</div>
                      <div className="overflow-auto">
                        <table className="w-full table-auto text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-500">
                              <th className="px-2 py-1">Date</th>
                              <th className="px-2 py-1">Employee</th>
                              <th className="px-2 py-1 text-right">Hours</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(((timeReport ?? projectReports[selectedProject.id])?.perDateEmployee ?? []) as ProjectTimeByDateEmployee[]).map((row: ProjectTimeByDateEmployee, idx) => (
                              <tr key={`${row.employee_id}-${row.work_date}-${idx}`} className="border-t">
                                <td className="px-2 py-2">{row.work_date}</td>
                                <td className="px-2 py-2">{row.employee_name || row.employee_id}</td>
                                <td className="px-2 py-2 text-right">{Number(row.total_hours ?? 0).toFixed(2)}</td>
                              </tr>
                            ))}
                            {(((timeReport ?? projectReports[selectedProject.id])?.perDateEmployee ?? []).length === 0) && (
                              <tr>
                                <td colSpan={3} className="px-2 py-4 text-center text-gray-500">No time entries found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {!reportLoading && !reportError && !timeReport && !projectReports[selectedProject.id] && (
                  <div className="text-sm text-gray-500">No report loaded. Click Refresh to load the project time report.</div>
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  <div>Created: {selectedProject.createdAt ? new Date(selectedProject.createdAt).toLocaleString() : "—"}</div>
                  <div>Updated: {selectedProject.updatedAt ? new Date(selectedProject.updatedAt).toLocaleString() : "—"}</div>
                </div>

                <div className="flex gap-2">
                  {(currentUser.role === "Super Admin" || currentUser.role === "Admin") && !isEmployee && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteProject(false)}
                      >
                        Delete
                      </Button>
                      <Button
                        onClick={() => {
                          const payload = new FormData();
                          if (selectedProject.name) payload.append("name", selectedProject.name);
                          if (selectedProject.description) payload.append("description", selectedProject.description);
                          if (selectedProject.start_date) payload.append("start_date", new Date(selectedProject.start_date).toISOString());
                          if (selectedProject.end_date) payload.append("end_date", new Date(selectedProject.end_date).toISOString());
                          if (selectedProject.given_enddate) payload.append("given_enddate", new Date(selectedProject.given_enddate).toISOString());
                          if (selectedProject.status) payload.append("status", selectedProject.status);
                          if (selectedProject.project_lead) payload.append("project_lead", selectedProject.project_lead);
                          if (selectedProject.team_members) {
                            const parsedMembers = parseTeamMembers(selectedProject.team_members);
                            payload.append("team_members", JSON.stringify(parsedMembers));
                          }

                          if (editFile) {
                            payload.append("document", editFile);
                          }

                          handleUpdateProject(payload as any);
                          setEditFile(null);
                        }}
                      >
                        Save
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setViewOpen(false);
                      setSelectedProject(null);
                      setTimeReport(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------
           View Project Tasks Modal
          ------------------------- */}
      {viewTasksOpen && viewTasksProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-lg font-medium">Tasks for {viewTasksProject.name}</h3>
                <p className="text-sm text-gray-500">Overview of all tasks in this project</p>
              </div>
              <button onClick={() => {
                setViewTasksOpen(false);
                setSelectedTaskId(null);
              }} className="p-2">
                <X />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedTaskId ? (
                // Show TaskDetails when a task is selected
                <TaskDetails
                  taskId={selectedTaskId}
                  users={users}
                  employees={employees}
                  currentUser={currentUser}
                  onBack={() => setSelectedTaskId(null)}
                />
              ) : tasksLoading ? (
                <div className="py-8 text-center text-gray-500">Loading tasks...</div>
              ) : projectTasks.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p>No tasks found for this project.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="border shadow-none cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">{task.title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-1">{task.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2">
                              <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "No date"}</span>
                              <span>Priority: {task.priority}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(task.status)}
                            <div className="text-xs text-gray-500">
                              {(() => {
                                const ids = Array.isArray(task.assigned_to) ? task.assigned_to : (task.assigned_to ? [task.assigned_to] : []);
                                if (ids.length === 0) return "Unassigned";
                                return "Assigned into: " + ids.map((id: string) => {
                                  const e = employees.find((emp: any) => emp.id === id);
                                  return e ? e.name : "Unknown";
                                }).join(", ");
                              })()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t px-4 py-3 bg-gray-50 rounded-b-lg flex justify-end">
              <Button onClick={() => {
                setViewTasksOpen(false);
                setSelectedTaskId(null);
              }}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
