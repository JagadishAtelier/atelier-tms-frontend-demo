import React from 'react';
import { Bell, Trash2 } from 'lucide-react';
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
import { useNotification } from '../context/NotificationContext';
import { AppNotification } from '../types/notification';

interface NotificationBellProps {
  onNavigate?: (page: string) => void;
}

const NotificationBell = ({ onNavigate }: NotificationBellProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, refresh } = useNotification();

  const handleItemClick = (n: AppNotification) => {
    if (!n.is_read) markAsRead(n.id);
    if (onNavigate && n.type && n.type.includes('TASK')) {
      onNavigate('tasks');
    }
  };

  return (
    <DropdownMenu onOpenChange={(open: boolean) => open && refresh()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative p-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white border-none text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50/50">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
            >
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No notifications</div>
          ) : (
            notifications.map(n => (
              <DropdownMenuItem
                key={n.id}
                className={`flex flex-col items-start gap-2 p-3 cursor-pointer focus:bg-gray-50 ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                onClick={() => handleItemClick(n)}
              >
                <div className="flex w-full justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-snug">
                      {n.message}
                    </p>
                  </div>
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />}
                </div>
                <div className="flex w-full justify-between items-center mt-1">
                  <span className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            )))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
