import { useEffect, useState } from 'react';
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
  notifications,
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

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    setCurrentPage("dashboard");
    localStorage.clear();
    setSelectedTaskId(null);
  };


  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedTaskId(null);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentPage('task-details');
  };

  const handleBackFromTask = () => {
    setSelectedTaskId(null);
    setCurrentPage('tasks');
  };
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    const cachedUser = localStorage.getItem("user");
    console.log(cachedUser)
    if (cachedUser) {
      setCurrentUser(JSON.parse(cachedUser));
    }

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

  // If not logged in, show login
  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  // Filter notifications for current user
  const userNotifications = notifications.filter((n) => n.userId === currentUser.id);

  // Find selected task
  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <NotificationPermission />
      <div className="flex h-screen flex-col bg-gray-50">
        <Navbar
          currentUser={currentUser}
          notifications={userNotifications}
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
