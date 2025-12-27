import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Clock,
  BarChart3,
  Calendar,
  Settings,
  FolderKanban,
  UserPlus,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import type { UserRole } from '../types';

interface SidebarProps {
  currentPage: string;
  userRole: UserRole;
  userDepartment: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, userRole, userDepartment, onNavigate }: SidebarProps) {
  const operationsItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Admin', 'Manager', 'employee', 'Client'], departments: ['all'] },
    // { id: 'employee-dashboard', label: 'employee View', icon: LayoutDashboard, roles: ['employee'], departments: ['all'] },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['Super Admin', 'Admin', 'Manager', 'employee'], departments: ['all'] },
    { id: 'projects', label: 'Projects', icon: FolderKanban, roles: ['Super Admin', 'Admin', 'Manager', 'employee'], departments: ['all'] },
    { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['Super Admin', 'Admin', 'Manager', 'employee'], departments: ['all'] },
    { id: 'timetracking', label: 'Time Tracking', icon: Calendar, roles: ['Super Admin', 'Admin', 'Manager', 'employee'], departments: ['all'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['Super Admin', 'Admin', 'Manager'], departments: ['all'] },
    { id: 'users', label: 'User Management', icon: Users, roles: ['Super Admin', 'Admin'], departments: ['all'] },
  ];

  const crmItems = [
    { id: 'sales-dashboard', label: 'Sales Dashboard', icon: TrendingUp, roles: ['Super Admin', 'Admin', 'Manager', 'employee'], departments: ['Sales', 'Management'] },
    { id: 'leads', label: 'Leads', icon: UserPlus, roles: ['Super Admin', 'Admin', 'Manager', 'employee'], departments: ['Sales', 'Management'] },
    { id: 'pipeline', label: 'Pipeline', icon: DollarSign, roles: ['Super Admin', 'Admin', 'Manager', 'employee'], departments: ['Sales', 'Management'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['Super Admin', 'Admin', 'Manager', 'employee'], departments: ['Sales', 'Management'] },
    { id: 'crm-reports', label: 'CRM Reports', icon: BarChart3, roles: ['Super Admin', 'Admin', 'Manager'], departments: ['Sales', 'Management'] },
  ];

  const settingsItems = [
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Super Admin', 'Admin', 'Manager', 'employee', 'Client'], departments: ['all'] },
  ];

  const filterItems = (items: typeof operationsItems) => 
    items.filter((item) => {
      const hasRole = item.roles.includes(userRole);
      const hasDepartment = item.departments.includes('all') || 
                           item.departments.includes(userDepartment) ||
                           userRole === 'Super Admin' ||
                           userRole === 'Admin';
      return hasRole && hasDepartment;
    });

  const visibleOperationsItems = filterItems(operationsItems);
  const visibleCRMItems = filterItems(crmItems);
  const visibleSettingsItems = filterItems(settingsItems);

  return (
    <aside className="w-64 border-r bg-white">
      <nav className="flex flex-col gap-1 p-4">
        {/* Operations Section */}
        {visibleOperationsItems.length > 0 && (
          <>
            <p className="mb-2 px-3 text-xs text-gray-500">OPERATIONS</p>
            {visibleOperationsItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? 'default' : 'ghost'}
                  className="justify-start"
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </>
        )}

        {/* CRM Section */}
        {visibleCRMItems.length > 0 && (
          <>
            <Separator className="my-3" />
            <p className="mb-2 px-3 text-xs text-gray-500">SALES CRM</p>
            {visibleCRMItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? 'default' : 'ghost'}
                  className="justify-start"
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </>
        )}

        {/* Settings Section */}
        {visibleSettingsItems.length > 0 && (
          <>
            <Separator className="my-3" />
            {visibleSettingsItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? 'default' : 'ghost'}
                  className="justify-start"
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
