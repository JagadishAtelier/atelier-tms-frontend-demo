// src/App.jsx
import { useEffect, useState, useCallback } from 'react';
import { Login } from './components/Login';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { TaskBoard } from './components/TaskBoard';
import { TaskDetails } from './components/TaskDetails';
import { AttendanceManagement } from './components/AttendanceManagement';
import { UserManagement } from './components/UserManagement';
import { Reports } from './components/Reports';
import { TimeTracking } from './components/TimeTracking';
import { Projects } from './components/Projects';
import { Settings } from './components/Settings';
import { SalesDashboard } from './components/SalesDashboard';
import { LeadManagement } from './components/LeadManagement';
import { SalesPipeline } from './components/SalesPipeline';
import { CustomerManagement } from './components/CustomerManagement';
import { CRMReports } from './components/CRMReports';
import {
  users,
  tasks,
  attendanceRecords,
  projects,
  departments,

  timeEntries,
  leads,
  customers,
  deals,
  salesActivities,
} from './lib/mockData';
import type { User } from './types';
import { NotificationProvider } from './context/NotificationContext';
import NotificationPermission from './components/NotificationPermission';
import { getProfileApi, logoutApi } from './components/service/auth';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // read cached user quickly
  useEffect(() => {
    const cachedUser = localStorage.getItem("user");
    if (cachedUser) {
      try {
        setCurrentUser(JSON.parse(cachedUser));
      } catch {
        // ignore
      }
    }
  }, []);

  // fetch profile if token present
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setAuthLoading(false);
      return;
    }

    getProfileApi()
      .then((user) => {
        setCurrentUser(user);
      })
      .catch(() => {
        localStorage.clear();
        setCurrentUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  // parse URL and set page / selectedTaskId
  const parseUrl = useCallback(() => {
    const raw = window.location.pathname || '/';
    // remove leading/trailing slashes
    const path = raw.replace(/^\/+|\/+$/g, '');
    if (!path) {
      setCurrentPage('dashboard');
      setSelectedTaskId(null);
      return;
    }
    const parts = path.split('/');

    // Support: /projects/:projectId/tasks/:taskId
    if (parts.length === 4 && parts[0] === 'projects' && parts[2] === 'tasks') {
      const projectId = parts[1];
      const taskId = parts[3];
      setSelectedTaskId(taskId);
      setCurrentPage('task-details');
      return;
    }

    // Support: /tasks/:taskId
    if (parts.length === 2 && parts[0] === 'tasks') {
      const taskId = parts[1];
      setSelectedTaskId(taskId);
      setCurrentPage('task-details');
      return;
    }

    // Support other top-level routes (simple mapping)
    switch (parts[0]) {
      case 'projects':
        setCurrentPage('projects');
        setSelectedTaskId(null);
        return;
      case 'attendance':
        setCurrentPage('attendance');
        setSelectedTaskId(null);
        return;
      case 'timetracking':
        setCurrentPage('timetracking');
        setSelectedTaskId(null);
        return;
      case 'reports':
        setCurrentPage('reports');
        setSelectedTaskId(null);
        return;
      case 'users':
        setCurrentPage('users');
        setSelectedTaskId(null);
        return;
      case 'settings':
        setCurrentPage('settings');
        setSelectedTaskId(null);
        return;
      case 'sales-dashboard':
        setCurrentPage('sales-dashboard');
        setSelectedTaskId(null);
        return;
      case 'leads':
        setCurrentPage('leads');
        setSelectedTaskId(null);
        return;
      case 'pipeline':
        setCurrentPage('pipeline');
        setSelectedTaskId(null);
        return;
      case 'customers':
        setCurrentPage('customers');
        setSelectedTaskId(null);
        return;
      case 'crm-reports':
        setCurrentPage('crm-reports');
        setSelectedTaskId(null);
        return;
      case 'tasks':
        // fallback above already handles /tasks/:taskId
        setCurrentPage('tasks');
        setSelectedTaskId(null);
        return;
      case 'dashboard':
      default:
        setCurrentPage('dashboard');
        setSelectedTaskId(null);
        return;
    }
  }, []);

  // parse URL once auth resolves and whenever browser history changes
  useEffect(() => {
    if (!authLoading) parseUrl();

    const onPop = () => {
      parseUrl();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [authLoading, parseUrl]);

  // helper to change URL when navigating inside the app
  const pushUrlForPage = (page, opts = {}) => {
    let url = '/';
    switch (page) {
      case 'dashboard':
        url = '/';
        break;
      case 'projects':
        url = '/projects';
        break;
      case 'attendance':
        url = '/attendance';
        break;
      case 'timetracking':
        url = '/timetracking';
        break;
      case 'reports':
        url = '/reports';
        break;
      case 'users':
        url = '/users';
        break;
      case 'settings':
        url = '/settings';
        break;
      case 'sales-dashboard':
        url = '/sales-dashboard';
        break;
      case 'leads':
        url = '/leads';
        break;
      case 'pipeline':
        url = '/pipeline';
        break;
      case 'customers':
        url = '/customers';
        break;
      case 'crm-reports':
        url = '/crm-reports';
        break;
      case 'tasks':
        url = '/tasks';
        break;
      case 'task-details':
        // opts may contain taskId and projectId
        if (opts.projectId) {
          url = `/projects/${opts.projectId}/tasks/${opts.taskId}`;
        } else if (opts.taskId) {
          url = `/tasks/${opts.taskId}`;
        } else {
          url = '/tasks';
        }
        break;
      default:
        url = '/';
    }

    // Avoid pushing same url repeatedly
    if (window.location.pathname !== url) {
      window.history.pushState({}, '', url);
    }
  };

  /* -------------------------
     Navigation handlers
  ------------------------- */
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
    pushUrlForPage('dashboard');
  };

  const handleLogout = async () => {
    try {
      // optional: call API to logout
      await logoutApi?.().catch(() => {});
    } catch {}
    setCurrentUser(null);
    setCurrentPage("dashboard");
    localStorage.clear();
    setSelectedTaskId(null);
    pushUrlForPage('dashboard');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedTaskId(null);
    pushUrlForPage(page);
  };

  // accepts optional projectId to build /projects/:projectId/tasks/:taskId url
  const handleTaskClick = (taskId: string, projectId?: string) => {
    setSelectedTaskId(taskId);
    setCurrentPage('task-details');
    pushUrlForPage('task-details', { taskId, projectId });
  };

  const handleBackFromTask = () => {
    setSelectedTaskId(null);
    setCurrentPage('tasks');
    pushUrlForPage('tasks');
  };

  // While checking auth, show loading state
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // If not logged in, show login
  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  // Find selected task (from mock tasks in this app)
  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;

  return (
    <NotificationProvider>
      <NotificationPermission />
      <div className="flex h-screen flex-col bg-gray-50">
        <Navbar
          currentUser={currentUser}
          currentPage={currentPage}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            currentPage={currentPage}
            userRole={currentUser.role}
            userDepartment={currentUser.department}
            onNavigate={handleNavigate}
          />
          <main className="flex-1 overflow-y-auto p-6">
            {currentPage === 'dashboard' && currentUser.role === 'employee' && (
              <EmployeeDashboard
                currentUser={currentUser}
                tasks={tasks}
                attendance={attendanceRecords}
                onNavigate={handleNavigate}
              />
            )}
            {currentPage === 'dashboard' && currentUser.role !== 'employee' && (
              <Dashboard
                currentUser={currentUser}
                tasks={tasks}
                attendance={attendanceRecords}
                onNavigate={handleNavigate}
              />
            )}
            {currentPage === 'employee-dashboard' && (
              <EmployeeDashboard
                currentUser={currentUser}
                tasks={tasks}
                attendance={attendanceRecords}
                onNavigate={handleNavigate}
              />
            )}
            {currentPage === 'tasks' && (
              <TaskBoard
                tasks={tasks}
                users={users}
                currentUser={currentUser}
                onTaskClick={handleTaskClick}
              />
            )}
            {currentPage === 'task-details' && selectedTaskId && (
              <TaskDetails
                taskId={selectedTaskId}
                users={users}
                currentUser={currentUser}
                onBack={handleBackFromTask}
              />
            )}
            {currentPage === 'projects' && (
              <Projects
                projects={projects}
                tasks={tasks}
                users={users}
                currentUser={currentUser}
              />
            )}
            {currentPage === 'attendance' && (
              <AttendanceManagement
                attendance={attendanceRecords}
                users={users}
                currentUser={currentUser}
              />
            )}
            {currentPage === 'timetracking' && (
              <TimeTracking
                tasks={tasks}
                timeEntries={timeEntries}
                currentUser={currentUser}
              />
            )}
            {currentPage === 'reports' && (
              <Reports
                tasks={tasks}
                attendance={attendanceRecords}
                users={users}
                departments={departments}
              />
            )}
            {currentPage === 'users' && (
              <UserManagement
                users={users}
                departments={departments}
                currentUser={currentUser}
              />
            )}
            {currentPage === 'settings' && <Settings currentUser={currentUser} />}
            {currentPage === 'sales-dashboard' && (
              <SalesDashboard
                leads={leads}
                deals={deals}
                customers={customers}
                users={users}
                salesActivities={salesActivities}
                currentUser={currentUser}
                onNavigate={handleNavigate}
              />
            )}
            {currentPage === 'leads' && (
              <LeadManagement
                leads={leads}
                users={users}
                currentUser={currentUser}
              />
            )}
            {currentPage === 'pipeline' && (
              <SalesPipeline
                deals={deals}
                users={users}
                currentUser={currentUser}
              />
            )}
            {currentPage === 'customers' && (
              <CustomerManagement
                customers={customers}
                users={users}
                currentUser={currentUser}
              />
            )}
            {currentPage === 'crm-reports' && (
              <CRMReports
                leads={leads}
                deals={deals}
                customers={customers}
                users={users}
              />
            )}
          </main>
        </div>
        <footer className="border-t bg-white px-6 py-3 text-center">
          <p className="text-sm text-gray-500">
            Prepared by Atelier Technologies • Empowering Businesses through Smart Software Solutions.
          </p>
        </footer>
      </div>
    </NotificationProvider>
  );
}

export default App;
