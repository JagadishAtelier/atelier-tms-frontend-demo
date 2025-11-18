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
import type { User as UserType, Notification } from '../types';

interface NavbarProps {
  currentUser: UserType;
  notifications: Notification[];
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export function Navbar({ currentUser, notifications, onLogout, onNavigate }: NavbarProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-white">AT</span>
          </div>
          <div>
            <h1 className="text-blue-600">Atelier Technologies</h1>
            <p className="text-sm text-gray-500">Task Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start gap-1 p-3 ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => notification.link && onNavigate(notification.link)}
                    >
                      <div className="flex w-full items-start justify-between">
                        <span className="text-sm">{notification.title}</span>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{notification.message}</p>
                      <span className="text-xs text-gray-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.role}</p>
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
