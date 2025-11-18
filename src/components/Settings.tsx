import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { User, Bell, Lock, Palette, Globe } from 'lucide-react';
import type { User as UserType } from '../types';

interface SettingsProps {
  currentUser: UserType;
}

export function Settings({ currentUser }: SettingsProps) {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskNotifications, setTaskNotifications] = useState(true);
  const [mentionNotifications, setMentionNotifications] = useState(true);
  const [attendanceReminders, setAttendanceReminders] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Settings</h1>
        <p className="text-gray-500">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Palette className="mr-2 h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={currentUser.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={currentUser.email} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" defaultValue={currentUser.department} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" defaultValue={currentUser.role} disabled />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" placeholder="Tell us about yourself" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Receive email updates about your activity
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Task Assignments</Label>
                  <p className="text-sm text-gray-500">
                    Get notified when you're assigned to a task
                  </p>
                </div>
                <Switch
                  checked={taskNotifications}
                  onCheckedChange={setTaskNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Mentions</Label>
                  <p className="text-sm text-gray-500">
                    Get notified when someone mentions you
                  </p>
                </div>
                <Switch
                  checked={mentionNotifications}
                  onCheckedChange={setMentionNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Attendance Reminders</Label>
                  <p className="text-sm text-gray-500">
                    Daily reminders to check in and check out
                  </p>
                </div>
                <Switch
                  checked={attendanceReminders}
                  onCheckedChange={setAttendanceReminders}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Daily Digest</Label>
                <Select defaultValue="morning">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="morning">Morning (9:00 AM)</SelectItem>
                    <SelectItem value="evening">Evening (6:00 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Reset to Default</Button>
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">
                  Add an extra layer of security to your account
                </p>
                <Button variant="outline">Enable 2FA</Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm">Active Sessions</h3>
                <p className="text-sm text-gray-500">
                  Manage your active sessions across devices
                </p>
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Current Device</p>
                      <p className="text-xs text-gray-500">Chrome on Windows • Active now</p>
                    </div>
                    <Button variant="ghost" size="sm" disabled>
                      Current
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Update Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc-5">
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                    <SelectItem value="utc-6">Central Time (UTC-6)</SelectItem>
                    <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                    <SelectItem value="utc+0">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-format">Date Format</Label>
                <Select defaultValue="mdy">
                  <SelectTrigger id="date-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time-format">Time Format</Label>
                <Select defaultValue="12">
                  <SelectTrigger id="time-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12-hour</SelectItem>
                    <SelectItem value="24">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select defaultValue="light">
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-view">Default Task View</Label>
                <Select defaultValue="board">
                  <SelectTrigger id="default-view">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="board">Board View</SelectItem>
                    <SelectItem value="list">List View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Reset to Default</Button>
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
