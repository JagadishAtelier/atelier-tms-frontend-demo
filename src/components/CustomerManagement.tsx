import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Search,
  Phone,
  Mail,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  MessageSquare,
  User as UserIcon,
  Star,
} from 'lucide-react';
import type { Customer, User } from '../types';

interface CustomerManagementProps {
  customers: Customer[];
  users: User[];
  currentUser: User;
}

export function CustomerManagement({ customers, users, currentUser }: CustomerManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive' | 'VIP'>('All');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Filter customers based on user role
  let filteredCustomers = customers;
  if (currentUser.department === 'Sales' && currentUser.role === 'Employee') {
    filteredCustomers = customers.filter((c) => c.assignedTo === currentUser.id);
  }

  // Apply search and filters
  filteredCustomers = filteredCustomers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || customer.status === statusFilter;
    const matchesRegion = regionFilter === 'All' || customer.region === regionFilter;
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const regions = Array.from(new Set(customers.map((c) => c.region)));
  const industries = Array.from(new Set(customers.map((c) => c.industry)));

  // Stats
  const totalValue = filteredCustomers.reduce((sum, c) => sum + c.totalValue, 0);
  const vipCustomers = filteredCustomers.filter((c) => c.status === 'VIP').length;
  const activeCustomers = filteredCustomers.filter((c) => c.status === 'Active').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VIP':
        return (
          <Badge variant="default" className="flex items-center gap-1 w-fit">
            <Star className="h-3 w-3" />
            VIP
          </Badge>
        );
      case 'Active':
        return <Badge variant="default">Active</Badge>;
      case 'Inactive':
        return <Badge variant="outline">Inactive</Badge>;
    }
  };

  const getNoteIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4 text-blue-600" />;
      case 'email':
        return <Mail className="h-4 w-4 text-purple-600" />;
      case 'meeting':
        return <UserIcon className="h-4 w-4 text-green-600" />;
      case 'note':
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Customer Management</h1>
          <p className="text-gray-500">Centralized customer database and history</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Customers</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{filteredCustomers.length}</div>
            <p className="text-xs text-gray-500">{activeCustomers} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">VIP Customers</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{vipCustomers}</div>
            <p className="text-xs text-gray-500">Premium accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${(totalValue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-gray-500">Lifetime value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Avg Value</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              ${filteredCustomers.length > 0 ? (totalValue / filteredCustomers.length).toFixed(0) : 0}
            </div>
            <p className="text-xs text-gray-500">Per customer</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Regions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span>{customer.company}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <Mail className="h-3 w-3" />
                          <span>{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Phone className="h-3 w-3" />
                          <span>{customer.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.industry}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span>{customer.region}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell>${customer.totalValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>{customer.name} - {customer.company}</DialogTitle>
                            <DialogDescription>
                              Customer details and communication history
                            </DialogDescription>
                          </DialogHeader>
                          <Tabs defaultValue="details">
                            <TabsList>
                              <TabsTrigger value="details">Details</TabsTrigger>
                              <TabsTrigger value="history">Communication History</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Email</p>
                                  <p className="text-sm">{customer.email}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Phone</p>
                                  <p className="text-sm">{customer.phone}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Industry</p>
                                  <p className="text-sm">{customer.industry}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Region</p>
                                  <p className="text-sm">{customer.region}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Total Value</p>
                                  <p className="text-sm">${customer.totalValue.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Status</p>
                                  {getStatusBadge(customer.status)}
                                </div>
                                {customer.address && (
                                  <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Address</p>
                                    <p className="text-sm">{customer.address}</p>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Tags</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {customer.tags.map((tag, idx) => (
                                    <Badge key={idx} variant="outline">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </TabsContent>
                            <TabsContent value="history" className="space-y-4">
                              {customer.notes.length === 0 ? (
                                <p className="text-center text-sm text-gray-500">
                                  No communication history
                                </p>
                              ) : (
                                customer.notes.map((note) => (
                                  <div key={note.id} className="flex gap-3 border-b pb-3 last:border-0">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                      {getNoteIcon(note.type)}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm">{note.userName}</p>
                                        <Badge variant="outline" className="text-xs">
                                          {note.type}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                          {new Date(note.createdAt).toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-700">{note.content}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
