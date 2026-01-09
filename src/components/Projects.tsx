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
  getProjectTimeReportApi,
  type ProjectTimeReport,
  type ProjectTimeByDateEmployee,
  type ProjectEmployeeTotal,
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

  // Time report state for modal (single)
  const [timeReport, setTimeReport] = useState<ProjectTimeReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Prefetched reports for all projects (projectId -> report)
  const [projectReports, setProjectReports] = useState<Record<string, ProjectTimeReport>>({});
  const [reportsLoading, setReportsLoading] = useState(false);

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
      return projectsArray;
    } catch (err) {
      console.error("Failed to fetch projects", err);
      setProjects([]);
      return [];
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
    // When page opens: fetch projects and employees and then prefetch reports.
    (async () => {
      const projectsArray = await fetchProjects();
      await fetchEmployees();
      if (projectsArray.length > 0) {
        prefetchAllProjectReports(projectsArray);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------
     Prefetch all reports (when page opens)
     Stores results in projectReports map so modal & grid can use it
  ------------------------- */
  const prefetchAllProjectReports = async (projectsArray: Project[]) => {
    setReportsLoading(true);
    const map: Record<string, ProjectTimeReport> = { ...projectReports };

    // fetch in parallel but handle failures gracefully
    const promises = projectsArray.map(async (p) => {
      if (!p?.id) return null;
      try {
        const res = await getProjectTimeReportApi(p.id);
        const normalized = res?.data ?? res;
        if (normalized) map[p.id] = normalized;
        return { id: p.id, ok: true };
      } catch (err) {
        console.warn(`Failed to prefetch report for project ${p.id}`, err);
        return { id: p.id, ok: false, error: err };
      }
    });

    await Promise.allSettled(promises);
    setProjectReports(map);
    setReportsLoading(false);
  };

  /* -------------------------
     Helpers to compute team members & counts from a report
     Accepts optional report param; if not provided, will use `timeReport`
  ------------------------- */
  const deriveTeamFromReport = (report?: ProjectTimeReport) => {
    const r = report ?? timeReport;
    if (!r) return [];

    const fromTotals = (r.perEmployeeTaskTotals ?? []) as ProjectEmployeeTotal[];
    if (fromTotals.length > 0) {
      return fromTotals.map((row) => {
        const emp = employees.find((e) => e.id === row.employee_id);
        return {
          id: row.employee_id,
          name: row.employee_name ?? emp?.name ?? row.employee_id,
          hours: Number(row.task_total_hours ?? 0),
          department: emp?.department ?? emp?.dept ?? "",
          email: emp?.email ?? "",
          raw: row,
        };
      });
    }

    const fromDateRows = (r.perDateEmployee ?? []) as ProjectTimeByDateEmployee[];
    const map = new Map<string, { id: string; name: string; hours: number }>();
    for (const row of fromDateRows) {
      const existing = map.get(row.employee_id);
      if (existing) existing.hours += Number(row.total_hours ?? 0);
      else map.set(row.employee_id, { id: row.employee_id, name: row.employee_name ?? row.employee_id, hours: Number(row.total_hours ?? 0) });
    }
    return Array.from(map.values()).map((m) => {
      const emp = employees.find((e) => e.id === m.id);
      return {
        id: m.id,
        name: m.name,
        hours: m.hours,
        department: emp?.department ?? emp?.dept ?? "",
        email: emp?.email ?? "",
        raw: { employee_id: m.id, employee_name: m.name, task_total_hours: m.hours },
      };
    });
  };

  const teamCountFromReport = (report?: ProjectTimeReport) => {
    const r = report ?? timeReport;
    if (!r) return 0;
    if ((r.perEmployeeTaskTotals ?? []).length > 0) return (r.perEmployeeTaskTotals ?? []).length;
    return Array.from(new Set((r.perDateEmployee ?? []).map((x) => x.employee_id))).length;
  };

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
     Project stats helper (kept unchanged)
  ------------------------- */
  const getProjectStats = (project: Project) => {
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
     Create Project form state & handlers (kept unchanged)
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
      const newProjects = await fetchProjects();
      if (newProjects.length > 0) prefetchAllProjectReports(newProjects);
    } catch (err: any) {
      console.error("Create failed", err);
      alert(err?.message || "Failed to create project");
    }
  };

  /* -------------------------
     Time Report fetching for single project (used when modal opens if needed)
  ------------------------- */
  const fetchTimeReport = async (projectId: string) => {
    setReportLoading(true);
    setReportError(null);
    setTimeReport(null);
    try {
      const report = await getProjectTimeReportApi(projectId);
      const normalized = report?.data ?? report;
      setTimeReport(normalized);
      // cache it
      setProjectReports((prev) => ({ ...prev, [projectId]: normalized }));
    } catch (err: any) {
      console.error("Failed to fetch time report", err);
      setReportError(err?.message || "Failed to fetch time report");
      setTimeReport(null);
    } finally {
      setReportLoading(false);
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
        proj = res.data ?? res;
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

  const handleUpdateProject = async (updates: Partial<Project>) => {
    if (!selectedProject) return;
    try {
      await updateProjectApi(selectedProject.id, updates);
      alert("Project updated");
      setViewOpen(false);
      setSelectedProject(null);
      const newProjects = await fetchProjects();
      if (newProjects.length > 0) prefetchAllProjectReports(newProjects);
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
      const newProjects = await fetchProjects();
      if (newProjects.length > 0) prefetchAllProjectReports(newProjects);
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
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <p className="mt-1 text-sm text-gray-500">{/* optionally department */}</p>
                  </div>
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
                  <span>{teamCount} team members</span>
                  {reportsLoading && <span className="text-xs text-gray-400 ml-2">loading reports...</span>}
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
                  <p className="text-sm text-gray-600">{selectedProject.description}</p>
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
                    value={selectedProject.project_lead ?? ""}
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
                            {String(m.name || m.id).split(" ").map((n: string) => n[0]).slice(0,2).join("").toUpperCase()}
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
    </div>
  );
}

export default Projects;
