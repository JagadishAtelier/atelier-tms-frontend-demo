import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
} from 'lucide-react';
import type { Lead, Deal, Customer, User } from '../types';

interface CRMReportsProps {
  leads: Lead[];
  deals: Deal[];
  customers: Customer[];
  users: User[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function CRMReports({ leads, deals, customers, users }: CRMReportsProps) {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('monthly');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  // Filter data by user if selected
  const filteredLeads = selectedUser === 'all' ? leads : leads.filter(l => l.assignedTo === selectedUser);
  const filteredDeals = selectedUser === 'all' ? deals : deals.filter(d => d.assignedTo === selectedUser);

  // Sales Stats
  const totalLeads = filteredLeads.length;
  const wonLeads = filteredLeads.filter((l) => l.status === 'Won').length;
  const lostLeads = filteredLeads.filter((l) => l.status === 'Lost').length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0';

  const totalDeals = filteredDeals.length;
  const wonDeals = filteredDeals.filter((d) => d.stage === 'Closed Won');
  const activeDeals = filteredDeals.filter((d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');

  const totalRevenue = wonDeals.reduce((sum, d) => sum + d.amount, 0);
  const pipelineValue = activeDeals.reduce((sum, d) => sum + d.amount, 0);
  const projectedRevenue = activeDeals.reduce((sum, d) => sum + (d.amount * d.probability) / 100, 0);

  // Lead to conversion funnel
  const conversionFunnelData = [
    { stage: 'Total Leads', count: totalLeads },
    { stage: 'Contacted', count: filteredLeads.filter((l) => l.status !== 'New').length },
    { stage: 'Qualified', count: filteredLeads.filter((l) => ['Qualified', 'Proposal', 'Won'].includes(l.status)).length },
    { stage: 'Proposal', count: filteredLeads.filter((l) => ['Proposal', 'Won'].includes(l.status)).length },
    { stage: 'Won', count: wonLeads },
  ];

  // Lead sources
  const leadSourceData = [
    { name: 'Website', value: filteredLeads.filter((l) => l.source === 'Website').length },
    { name: 'Referral', value: filteredLeads.filter((l) => l.source === 'Referral').length },
    { name: 'Email Campaign', value: filteredLeads.filter((l) => l.source === 'Email Campaign').length },
    { name: 'Social Media', value: filteredLeads.filter((l) => l.source === 'Social Media').length },
    { name: 'Cold Call', value: filteredLeads.filter((l) => l.source === 'Cold Call').length },
    { name: 'Other', value: filteredLeads.filter((l) => ['Trade Show', 'Partner', 'Other'].includes(l.source)).length },
  ].filter(item => item.value > 0);

  // Deal stages distribution
  const dealStageData = [
    { name: 'Prospecting', value: filteredDeals.filter((d) => d.stage === 'Prospecting').length },
    { name: 'Qualification', value: filteredDeals.filter((d) => d.stage === 'Qualification').length },
    { name: 'Proposal', value: filteredDeals.filter((d) => d.stage === 'Proposal').length },
    { name: 'Negotiation', value: filteredDeals.filter((d) => d.stage === 'Negotiation').length },
    { name: 'Closed Won', value: filteredDeals.filter((d) => d.stage === 'Closed Won').length },
  ].filter(item => item.value > 0);

  // Monthly trend (mock data for demonstration)
  const monthlyTrendData = [
    { month: 'Jul', leads: 28, deals: 12, revenue: 145000 },
    { month: 'Aug', leads: 35, deals: 15, revenue: 180000 },
    { month: 'Sep', leads: 42, deals: 18, revenue: 210000 },
    { month: 'Oct', leads: 38, deals: 20, revenue: 245000 },
    { month: 'Nov', leads: 45, deals: 16, revenue: 195000 },
  ];

  // Sales team performance
  const salesUsers = users.filter((u) => u.department === 'Sales' && u.isActive);
  const teamPerformanceData = salesUsers.map((user) => {
    const userLeads = leads.filter((l) => l.assignedTo === user.id);
    const userDeals = deals.filter((d) => d.assignedTo === user.id);
    const userWonDeals = userDeals.filter((d) => d.stage === 'Closed Won');
    const userRevenue = userWonDeals.reduce((sum, d) => sum + d.amount, 0);
    return {
      name: user.name,
      leads: userLeads.length,
      deals: userDeals.length,
      won: userWonDeals.length,
      revenue: userRevenue,
      conversionRate: userLeads.length > 0 ? ((userWonDeals.length / userLeads.length) * 100).toFixed(1) : '0',
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Industry distribution
  const industryData = Array.from(new Set(filteredLeads.map(l => l.industry).filter(Boolean)))
    .map(industry => ({
      name: industry!,
      count: filteredLeads.filter(l => l.industry === industry).length,
      value: filteredLeads.filter(l => l.industry === industry).reduce((sum, l) => sum + (l.value || 0), 0),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>CRM Reports & Analytics</h1>
          <p className="text-gray-500">Comprehensive sales performance and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="All Sales Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sales Team</SelectItem>
                {salesUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalLeads}</div>
            <p className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              {wonLeads} converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{conversionRate}%</div>
            <p className="text-xs text-gray-500">Lead to customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${(totalRevenue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-gray-500">{wonDeals.length} deals closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pipeline Value</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${(pipelineValue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-gray-500">{activeDeals.length} active deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Projected Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${(projectedRevenue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-gray-500">Weighted forecast</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Lead to Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionFunnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leadSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deal Stages */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Pipeline Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dealStageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="leads" stroke="#3b82f6" name="Leads" />
                <Line yAxisId="left" type="monotone" dataKey="deals" stroke="#10b981" name="Deals" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#f59e0b" name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamPerformanceData.map((performer, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm">{performer.name}</p>
                    <p className="text-xs text-gray-500">
                      {performer.leads} leads • {performer.won} won
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Revenue</p>
                    <p className="text-sm">${(performer.revenue / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Conversion</p>
                    <p className="text-sm">{performer.conversionRate}%</p>
                  </div>
                  <Badge variant="default">{performer.won} Deals</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Industry Performance */}
      {industryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Industry</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={industryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Lead Count" />
                <Bar yAxisId="right" dataKey="value" fill="#10b981" name="Total Value ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
