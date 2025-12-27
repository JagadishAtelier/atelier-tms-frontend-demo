import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Plus, Search, Edit, Trash2, UserX, UserCheck } from 'lucide-react';
import type { User, UserRole, Department } from '../types';

interface UserManagementProps {
  users: User[];
  departments: Department[];
  currentUser: User;
}

export function UserManagement({ users, departments, currentUser }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm?.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesDepartment =
      departmentFilter === 'All' || user.department === departmentFilter;
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const activeUsers = filteredUsers.filter((u) => u.isActive).length;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Super Admin':
        return <Badge variant="destructive">{role}</Badge>;
      case 'Admin':
        return <Badge variant="default">{role}</Badge>;
      case 'Manager':
        return <Badge variant="secondary">{role}</Badge>;
      case 'employee':
        return <Badge variant="outline">{role}</Badge>;
      case 'Client':
        return <Badge>{role}</Badge>;
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const UserForm = ({ user, onClose }: { user?: User; onClose: () => void }) => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            defaultValue={user?.username}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john.doe@ateliertechnologies.com"
            defaultValue={user?.email}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select defaultValue={user?.role || 'Employee'}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentUser.role === 'Super Admin' && (
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                )}
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
                <SelectItem value="Client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select defaultValue={user?.department}>
              <SelectTrigger id="department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {!user && (
          <div className="space-y-2">
            <Label htmlFor="password">Initial Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter initial password"
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>
            {user ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>User Management</h1>
          <p className="text-gray-500">Manage users, roles, and permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system
              </DialogDescription>
            </DialogHeader>
            <UserForm onClose={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{users.length}</div>
            <p className="text-xs text-gray-500">{activeUsers} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {users.filter((u) => u.role === 'Super Admin' || u.role === 'Admin').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {users.filter((u) => u.role === 'Manager').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {users.filter((u) => u.role === 'employee').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Roles</SelectItem>
                <SelectItem value="Super Admin">Super Admin</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
                <SelectItem value="Client">Client</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="default" className="flex items-center gap-1 w-fit">
                          <UserCheck className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <UserX className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserForm
              user={selectedUser}
              onClose={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
