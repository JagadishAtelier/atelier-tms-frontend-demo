import { Bell, LogOut, Settings, User } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import type { User as UserType } from '../types';
import MockNotificationButtons from './MockNotificationButtons';
import NotificationBell from './NotificationBell';

interface NavbarProps {
  currentUser: UserType;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export function Navbar({ currentUser, onLogout, onNavigate }: NavbarProps) {


  return (
    <nav className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <img src="/Dark_Logo.png" alt="Logo" srcSet="/Dark_Logo.png" className="h-8" />
          </div>
          <div>
            <h1 className="text-blue-600">Atelier Technologies</h1>
            <p className="text-sm text-gray-500">Task Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* <MockNotificationButtons/> */}
          {/* Notifications */}
          {/* Notifications */}
          <NotificationBell onNavigate={onNavigate} />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-12">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm my-0">{currentUser.username}</p>
                  <p className="text-xs my-0 text-gray-500">{currentUser.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate('profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate('settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
