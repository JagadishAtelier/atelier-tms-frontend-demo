import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from './ui/table';
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from './ui/select';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger
} from './ui/dialog';

import { Plus, Search, Edit, Trash2, UserX, UserCheck } from 'lucide-react';

import type { User, UserRole, Department } from '../types';
import {
  getUsersApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
} from "./service/auth";

/* ---------------- Helper: Generate Password ---------------- */
const generatePassword = (length = 12) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}<>?";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/* ---------------- UserForm Component ---------------- */
interface UserFormProps {
  user?: User;
  onClose: () => void;
  departments: Department[];
  currentUser: User;
  onSuccess: () => void;
}

function UserForm({ user, onClose, departments, currentUser, onSuccess }: UserFormProps) {
  // Use controlled state for all fields
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [role, setRole] = useState<UserRole>(user?.role || 'employee');
  const [department, setDepartment] = useState(user?.department || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Generate a random password if creating a new user and password is empty
  const handleGeneratePassword = () => {
    setPassword(generatePassword());
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = {
        username,
        email,
        phone,
        role,
        department,
        password: !user ? password : undefined, // Only send password if creating new user
      };

      if (user) {
        // Use user.id (or fallback to _id if necessary, to prevent 'undefined')
        const userId = user.id || user._id;
        if (!userId) {
          alert("Error: User ID is missing");
          return;
        }
        await updateUserApi(userId, formData);
      } else {
        await createUserApi(formData);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to save user", error);
      alert("Failed to save user: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input
          id="name"
          placeholder="John Doe"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Phone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="83456 87890"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {currentUser.role === 'Super Admin' && <SelectItem value="Super Admin">Super Admin</SelectItem>}
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="Client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Department</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent>
              {departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!user && (
        <div className="space-y-2">
          <Label>Initial Password</Label>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              className="pr-20" // space for icons
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-gray-500 hover:text-black outline-none p-1"
                title="Generate Password"
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-gray-500 hover:text-black outline-none p-1"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>

        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : (user ? "Update User" : "Create User")}
        </Button>
      </div>
    </div>
  );
}

/* ---------------- UserManagement Component ---------------- */

export function UserManagement({ departments, currentUser }: { departments: Department[], currentUser: User }) {

  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  /* ---------------- Fetch Users ---------------- */
  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const data = await getUsersApi();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  }


  /* ---------------- API Actions ---------------- */
  async function handleDelete(id: string) {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUserApi(id);
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user", err);
    }
  }

  /* ---------------- Filters & Stats ---------------- */
  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    return (
      (u.username.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)) &&
      (roleFilter === 'All' || u.role === roleFilter) &&
      (departmentFilter === 'All' || u.department === departmentFilter)
    );
  });

  const activeUsers = filteredUsers.filter(u => u.isActive).length;


  return (
    <div className="space-y-6">

      {/* ---------------- Header ---------------- */}
      <div className="flex items-center justify-between">
        <div>
          <h1>User Management</h1>
          <p className="text-gray-500">Manage users, roles, and permissions</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add User</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add new user to system.</DialogDescription>
            </DialogHeader>

            <UserForm
              onClose={() => setIsCreateDialogOpen(false)}
              departments={departments}
              currentUser={currentUser}
              onSuccess={fetchUsers}
            />
          </DialogContent>
        </Dialog>
      </div>


      {/* ---------------- Stats Cards ---------------- */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle>Total Users</CardTitle></CardHeader><CardContent><div className="text-2xl">{users.length}</div><p>{activeUsers} active</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Admins</CardTitle></CardHeader><CardContent><div className="text-2xl">{users.filter(u => ["Super Admin", "Admin"].includes(u.role)).length}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Managers</CardTitle></CardHeader><CardContent><div className="text-2xl">{users.filter(u => u.role === "Manager").length}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Employees</CardTitle></CardHeader><CardContent><div className="text-2xl">{users.filter(u => u.role === "employee").length}</div></CardContent></Card>
      </div>


      {/* ---------------- Filters ---------------- */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input className="pl-10" placeholder="Search users..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
              <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Super Admin">Super Admin</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
                <SelectItem value="Client">Client</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>

          </div>
        </CardContent>
      </Card>


      {/* ---------------- Users Table ---------------- */}
      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Email</TableHead>
                  <TableHead>Role</TableHead><TableHead>Department</TableHead>
                  <TableHead>Status</TableHead><TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredUsers.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center">No Users Found</TableCell></TableRow>
                )}

                {filteredUsers.map(user => (
                  <TableRow key={user.id || user._id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge>{user.role}</Badge></TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.isActive ? <UserCheck className="text-green-600" /> : <UserX className="text-red-500" />}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>

                    <TableCell className="flex gap-2">

                      {/* Edit */}
                      <Button variant="ghost" size="sm"
                        onClick={() => { setSelectedUser(user); setIsEditDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id || user._id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>

                    </TableCell>
                  </TableRow>
                ))}

              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      {/* ---------------- Edit Modal ---------------- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {selectedUser && (
            <UserForm
              user={selectedUser || undefined}
              onClose={() => setIsEditDialogOpen(false)}
              departments={departments}
              currentUser={currentUser}
              onSuccess={fetchUsers}
            />
          )}
        </DialogContent>
      </Dialog>

    </div >
  );
}
