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
  restoreUserApi
} from "../api/auth";


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
    const data = await getUsersApi();
    setUsers(data);
  }


  /* ---------------- API Actions ---------------- */
  async function handleDelete(id: string) {
    await deleteUserApi(id);
    fetchUsers();
  }

  async function handleRestore(id: string) {
    await restoreUserApi(id);
    fetchUsers();
  }


  /* ---------------- Form Modal ---------------- */
  const UserForm = ({ user, onClose }: { user?: User, onClose: () => void }) => {
    return (
      <div className="space-y-4">

        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input id="name" placeholder="John Doe" defaultValue={user?.username} />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input id="email" type="email" placeholder="user@example.com" defaultValue={user?.email} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select defaultValue={user?.role || 'employee'}>
              <SelectTrigger id="role"><SelectValue /></SelectTrigger>
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
            <Select defaultValue={user?.department}>
              <SelectTrigger id="department"><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!user && (
          <div className="space-y-2">
            <Label>Initial Password</Label>
            <Input id="password" type="password" placeholder="Enter password" />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>

          <Button
            onClick={async () => {
              const formData = {
                username: (document.getElementById("name") as HTMLInputElement)?.value,
                email: (document.getElementById("email") as HTMLInputElement)?.value,
                role: document.querySelector("#role div")?.textContent || user?.role,
                department: document.querySelector("#department div")?.textContent || user?.department,
                password: !user ? (document.getElementById("password") as HTMLInputElement)?.value : undefined,
              };

              if (user) await updateUserApi(user._id, formData);
              else await createUserApi(formData);

              fetchUsers();
              onClose();
            }}>
            {user ? "Update User" : "Create User"}
          </Button>
        </div>
      </div>
    );
  };


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

            <UserForm onClose={() => setIsCreateDialogOpen(false)} />
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

            <Select value={roleFilter} onValueChange={v => setRoleFilter(v)}>
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
                <TableRow key={user._id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge>{user.role}</Badge></TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>{user.isActive ? <UserCheck /> : <UserX />}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>

                  <TableCell className="flex gap-2">

                    {/* Edit */}
                    <Button variant="ghost" size="sm"
                      onClick={() => { setSelectedUser(user); setIsEditDialogOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Delete */}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(user._id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>

                  </TableCell>
                </TableRow>
              ))}

            </TableBody>
          </Table>
        </CardContent>
      </Card>


      {/* ---------------- Edit Modal ---------------- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {selectedUser && <UserForm user={selectedUser} onClose={() => setIsEditDialogOpen(false)} />}
        </DialogContent>
      </Dialog>

    </div>
  );
}
