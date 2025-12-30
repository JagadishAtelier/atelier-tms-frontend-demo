import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
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
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Building2,
  TrendingUp,
  UserPlus,
  Download,
} from 'lucide-react';
import type { Lead, LeadStatus, LeadSource, User } from '../types';

interface LeadManagementProps {
  leads: Lead[];
  users: User[];
  currentUser: User;
}

export function LeadManagement({ leads, users, currentUser }: LeadManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'All'>('All');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | 'All'>('All');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Filter leads based on user role
  let filteredLeads = leads;
  if (currentUser.department === 'Sales' && currentUser.role === 'Employee') {
    filteredLeads = leads.filter((lead) => lead.assignedTo === currentUser.id);
  }

  // Apply search and filters
  filteredLeads = filteredLeads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'All' || lead.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const getStatusBadge = (status: LeadStatus) => {
    const variants: Record<LeadStatus, any> = {
      'New': 'default',
      'Contacted': 'secondary',
      'Qualified': 'default',
      'Proposal': 'secondary',
      'Won': 'default',
      'Lost': 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const salesUsers = users.filter((u) => u.department === 'Sales' && u.isActive);

  // Stats
  const newLeads = filteredLeads.filter((l) => l.status === 'New').length;
  const qualifiedLeads = filteredLeads.filter((l) => l.status === 'Qualified').length;
  const wonLeads = filteredLeads.filter((l) => l.status === 'Won').length;
  const conversionRate = filteredLeads.length > 0
    ? ((wonLeads / filteredLeads.length) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Lead Management</h1>
          <p className="text-gray-500">Track and manage sales leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Import Leads
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Enter lead information and assign to a sales executive
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lead-name">Contact Name</Label>
                    <Input id="lead-name" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-company">Company</Label>
                    <Input id="lead-company" placeholder="Company Name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lead-email">Email</Label>
                    <Input id="lead-email" type="email" placeholder="email@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-phone">Phone</Label>
                    <Input id="lead-phone" placeholder="+1-555-0000" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lead-source">Source</Label>
                    <Select>
                      <SelectTrigger id="lead-source">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Cold Call">Cold Call</SelectItem>
                        <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Trade Show">Trade Show</SelectItem>
                        <SelectItem value="Partner">Partner</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-value">Estimated Value ($)</Label>
                    <Input id="lead-value" type="number" placeholder="50000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-assign">Assign To</Label>
                    <Select>
                      <SelectTrigger id="lead-assign">
                        <SelectValue placeholder="Select executive" />
                      </SelectTrigger>
                      <SelectContent>
                        {salesUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lead-industry">Industry</Label>
                    <Input id="lead-industry" placeholder="Technology" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-region">Region</Label>
                    <Input id="lead-region" placeholder="North America" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-tags">Tags (comma separated)</Label>
                  <Input id="lead-tags" placeholder="Enterprise, Software, High-Priority" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-notes">Notes</Label>
                  <Textarea id="lead-notes" placeholder="Additional information..." rows={3} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateDialogOpen(false)}>
                    Create Lead
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{filteredLeads.length}</div>
            <p className="text-xs text-gray-500">{newLeads} new this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Qualified</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{qualifiedLeads}</div>
            <p className="text-xs text-gray-500">Ready for proposal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Won</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{wonLeads}</div>
            <p className="text-xs text-green-600">Converted to customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{conversionRate}%</div>
            <p className="text-xs text-gray-500">Lead to customer</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Proposal">Proposal</SelectItem>
                <SelectItem value="Won">Won</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(value: any) => setSourceFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Sources</SelectItem>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Cold Call">Cold Call</SelectItem>
                <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                <SelectItem value="Social Media">Social Media</SelectItem>
                <SelectItem value="Trade Show">Trade Show</SelectItem>
                <SelectItem value="Partner">Partner</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500">
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => {
                    const assignedUser = users.find((u) => u.id === lead.assignedTo);
                    return (
                      <TableRow key={lead.id}>
                        <TableCell>{lead.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span>{lead.company}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <Mail className="h-3 w-3" />
                              <span>{lead.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Phone className="h-3 w-3" />
                              <span>{lead.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{lead.source}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(lead.status)}</TableCell>
                        <TableCell>
                          {lead.value ? `$${lead.value.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>{assignedUser?.name || 'Unassigned'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
