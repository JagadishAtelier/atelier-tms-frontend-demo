// src/components/Projects.tsx
import { useEffect, useState } from "react";
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
} from "lucide-react";
import Loading from "./loading";

import type { Task, User } from "../types";
import {
  getProjectsApi,
  createProjectApi,
  getProjectByIdApi,
  updateProjectApi,
  deleteProjectApi,
} from "../components/service/projectService";
import type { Project } from "../components/service/projectService";
import {
  getEmployeesApi,
  type Employee,
} from "../components/service/employeeService";

/**
 * Projects UI with Create & View/Edit modals
 *
 * Props:
 *  - tasks: Task[]
 *  - users: User[] (used for project_lead select)
 *  - currentUser: User (for role checks)
 */
interface ProjectsProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
}

export function Projects({ tasks, users, currentUser }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | "Active" | "On Hold" | "Completed">("All");

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const isEmployee = currentUser?.role === "employee";

  /* -------------------------
     Fetch projects (robust)
  ------------------------- */
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getProjectsApi();
      // Normalize various API shapes:
      const projectsArray =
        Array.isArray(res) ? res :
          Array.isArray(res.data) ? res.data :
            Array.isArray(res.data?.data) ? res.data.data :
              Array.isArray(res.rows) ? res.rows :
                [];

      setProjects(projectsArray);
    } catch (err) {
      console.error("Failed to fetch projects", err);
      setProjects([]);
    } finally {
      setLoading(false);
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
    fetchProjects();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------
     Filters
  ------------------------- */
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = (project.name ?? "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    // note: your backend status values might be "In Progress" etc; this component uses "Active"/"Completed"/"On Hold"
    const matchesStatus =
      statusFilter === "All" || (project.status ?? "") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  /* -------------------------
     Project stats helper
  ------------------------- */
  const getProjectStats = (project: Project) => {
    // NOTE: your Task type should have a project field — adapt if it's projectId instead
    const projectTasks = tasks.filter((t) => t.project === project.name);
    const completedTasks = projectTasks.filter((t) => t.status === "Completed").length;
    const totalTasks = projectTasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const teamMembers = new Set<string>();
    projectTasks.forEach((task) => {
      (task.assignedTo || []).forEach((id) => teamMembers.add(id));
    });

    return {
      totalTasks,
      completedTasks,
      progress,
      teamSize: teamMembers.size,
    };
  };

  /* -------------------------
     Badges
  ------------------------- */
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Active":
        return <Badge>Active</Badge>;
      case "On Hold":
        return <Badge variant="secondary">On Hold</Badge>;
      case "Completed":
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge>{status || "Unknown"}</Badge>;
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
      // Build payload to match backend (projectService expects same fields)
      const payload: Partial<Project> = {
        name: String(createForm.name).trim(),
        description: createForm.description || null,
        start_date: createForm.start_date ? new Date(createForm.start_date).toISOString() : null,
        end_date: createForm.end_date ? new Date(createForm.end_date).toISOString() : null,
        given_enddate: createForm.given_enddate ? new Date(createForm.given_enddate).toISOString() : null,
        status: createForm.status,
        project_lead: createForm.project_lead || null,
        is_active: true,
      };

      await createProjectApi(payload);
      alert("Project created");
      setCreateOpen(false);
      setCreateForm(emptyCreate);
      fetchProjects();
    } catch (err: any) {
      console.error("Create failed", err);
      alert(err?.message || "Failed to create project");
    }
  };

  /* -------------------------
     View/Edit project modal handlers
  ------------------------- */
  const openView = async (projectIdOrObj: string | Project) => {
    try {
      let proj: Project | null = null;
      if (typeof projectIdOrObj === "string") {
        const res = await getProjectByIdApi(projectIdOrObj);
        // normalize
        proj = res.data ?? res;
      } else {
        proj = projectIdOrObj;
      }
      setSelectedProject(proj);
      setViewOpen(true);
    } catch (err) {
      console.error("Failed to load project", err);
      alert("Failed to load project details");
    }
  };

  const handleUpdateProject = async (updates: Partial<Project>) => {
    if (!selectedProject) return;
    try {
      await updateProjectApi(selectedProject.id, updates);
      alert("Project updated");
      setViewOpen(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update project");
    }
  };

  const handleDeleteProject = async (hard = false) => {
    if (!selectedProject) return;
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      // backend delete endpoint accepts id; our backend supports soft/hard but frontend calls soft by default
      await deleteProjectApi(selectedProject.id);
      alert("Project deleted");
      setViewOpen(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete project");
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
            <div className="text-2xl">{projects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">Active</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{projects.filter((p) => p.status === "Active").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">On Hold</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{projects.filter((p) => p.status === "On Hold").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{projects.filter((p) => p.status === "Completed").length}</div>
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
        {filteredProjects.map((project) => {
          const stats = getProjectStats(project);
          return (
            <Card
              key={project.id}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => openView(project)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <p className="mt-1 text-sm text-gray-500">{/* optionally department */}</p>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
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
                  <span>{stats.teamSize} team members</span>
                </div>

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
          View / Edit Project Modal
         ------------------------- */}
      {viewOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h3 className="text-lg font-medium">Project Details</h3>
              <button onClick={() => { setViewOpen(false); setSelectedProject(null); }} className="p-2">
                <X />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-semibold">{selectedProject.name}</h4>
                  <p className="text-sm text-gray-600">{selectedProject.description}</p>
                </div>
                <div>{getStatusBadge(selectedProject.status)}</div>
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

              <div>
                <label className="block text-sm font-medium">Project Lead</label>
                {!isEmployee ? (
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
                ) : (
                  <div className="mt-1 rounded-md border p-2 bg-gray-50 text-sm">
                    {employees.find((emp) => emp.id === selectedProject.project_lead)?.name ?? "—"}
                  </div>
                )}
              </div>


              <div>
                <label className="block text-sm font medium">Description</label>
                <textarea
                  value={selectedProject.description ?? ""}
                  onChange={(e) => setSelectedProject((s) => s ? { ...s, description: e.target.value } : s)}
                  className="mt-1 w-full rounded-md border p-2"
                  rows={3}
                  readOnly={isEmployee}
                />
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
                          // prepare update payload from selectedProject fields
                          const payload: Partial<Project> = {
                            name: selectedProject.name,
                            description: selectedProject.description,
                            start_date: selectedProject.start_date ? new Date(selectedProject.start_date).toISOString() : null,
                            end_date: selectedProject.end_date ? new Date(selectedProject.end_date).toISOString() : null,
                            given_enddate: selectedProject.given_enddate ? new Date(selectedProject.given_enddate).toISOString() : null,
                            status: selectedProject.status,
                            project_lead: selectedProject.project_lead,
                          };
                          handleUpdateProject(payload);
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
    </div>
  );
}

export default Projects;
