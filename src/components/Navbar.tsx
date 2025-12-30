import { useState } from 'react';
import { Bell, LogOut, Settings, User, Menu } from 'lucide-react';
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
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from './ui/sheet';
import { SidebarContent } from './Sidebar';

interface NavbarProps {
  currentUser: UserType;
  currentPage: string;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export function Navbar({ currentUser, currentPage, onLogout, onNavigate }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-white px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden -ml-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                    <img src="/Dark_Logo.png" alt="Logo" className="h-6" />
                  </div>
                  <span className="font-semibold text-blue-600">Atelier Technologies</span>
                </div>
              </div>
              <SidebarContent
                currentPage={currentPage}
                userRole={currentUser.role}
                userDepartment={currentUser.department}
                onNavigate={onNavigate}
                onClose={() => setIsMobileMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 hidden md:flex">
            <img src="/Dark_Logo.png" alt="Logo" srcSet="/Dark_Logo.png" className="h-8" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-blue-600">Atelier Technologies</h1>
            <p className="text-sm text-gray-500">Task Management System</p>
          </div>
          {/* Mobile Text Logo */}
          <div className="md:hidden">
            <h1 className="text-blue-600 font-semibold">Atelier</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* <MockNotificationButtons/> */}
          {/* Notifications */}
          <NotificationBell onNavigate={onNavigate} />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-12 px-2 md:px-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm my-0">{currentUser.username}</p>
                  <p className="text-xs my-0 text-gray-500">{currentUser.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <div className="md:hidden px-2 py-1 text-xs text-gray-500">
                {currentUser.username} ({currentUser.role})
              </div>
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
