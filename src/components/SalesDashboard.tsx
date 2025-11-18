import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
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
  DollarSign,
  TrendingUp,
  Users,
  Target,
  ArrowRight,
  Phone,
  Mail,
} from 'lucide-react';
import type { Lead, Deal, Customer, User, SalesActivity } from '../types';

interface SalesDashboardProps {
  leads: Lead[];
  deals: Deal[];
  customers: Customer[];
  users: User[];
  salesActivities: SalesActivity[];
  currentUser: User;
  onNavigate: (page: string) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function SalesDashboard({
  leads,
  deals,
  customers,
  users,
  salesActivities,
  currentUser,
  onNavigate,
}: SalesDashboardProps) {
  // Filter data based on user role
  const isSalesEmployee = currentUser.department === 'Sales' && currentUser.role === 'Employee';
  const myLeads = isSalesEmployee ? leads.filter((l) => l.assignedTo === currentUser.id) : leads;
  const myDeals = isSalesEmployee ? deals.filter((d) => d.assignedTo === currentUser.id) : deals;
  const myCustomers = isSalesEmployee ? customers.filter((c) => c.assignedTo === currentUser.id) : customers;

  // Stats
  const totalLeads = myLeads.length;
  const activeDeals = myDeals.filter((d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length;
  const wonDeals = myDeals.filter((d) => d.stage === 'Closed Won').length;
  const totalRevenue = myDeals
    .filter((d) => d.stage === 'Closed Won')
    .reduce((sum, d) => sum + d.amount, 0);
  const pipelineValue = myDeals
    .filter((d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost')
    .reduce((sum, d) => sum + d.amount, 0);
  const conversionRate = totalLeads > 0 ? ((wonDeals / totalLeads) * 100).toFixed(1) : '0';

  // Lead status distribution
  const leadStatusData = [
    { name: 'New', value: myLeads.filter((l) => l.status === 'New').length },
    { name: 'Contacted', value: myLeads.filter((l) => l.status === 'Contacted').length },
    { name: 'Qualified', value: myLeads.filter((l) => l.status === 'Qualified').length },
    { name: 'Proposal', value: myLeads.filter((l) => l.status === 'Proposal').length },
    { name: 'Won', value: myLeads.filter((l) => l.status === 'Won').length },
  ];

  // Monthly performance (mock data for chart)
  const monthlyData = [
    { month: 'Jul', leads: 28, deals: 12, revenue: 145000 },
    { month: 'Aug', leads: 35, deals: 15, revenue: 180000 },
    { month: 'Sep', leads: 42, deals: 18, revenue: 210000 },
    { month: 'Oct', leads: 38, deals: 20, revenue: 245000 },
    { month: 'Nov', leads: 45, deals: 16, revenue: 195000 },
  ];

  // Top performers
  const salesUsers = users.filter((u) => u.department === 'Sales' && u.isActive);
  const performanceData = salesUsers.map((user) => {
    const userDeals = deals.filter((d) => d.assignedTo === user.id);
    const userWonDeals = userDeals.filter((d) => d.stage === 'Closed Won');
    const userRevenue = userWonDeals.reduce((sum, d) => sum + d.amount, 0);
    return {
      name: user.name,
      deals: userWonDeals.length,
      revenue: userRevenue,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Lead sources
  const leadSourceData = [
    { name: 'Website', value: myLeads.filter((l) => l.source === 'Website').length },
    { name: 'Referral', value: myLeads.filter((l) => l.source === 'Referral').length },
    { name: 'Email Campaign', value: myLeads.filter((l) => l.source === 'Email Campaign').length },
    { name: 'Social Media', value: myLeads.filter((l) => l.source === 'Social Media').length },
    { name: 'Other', value: myLeads.filter((l) => ['Cold Call', 'Trade Show', 'Partner', 'Other'].includes(l.source)).length },
  ];

  // Recent activities
  const recentActivities = salesActivities.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1>Sales Dashboard</h1>
        <p className="text-gray-500">Overview of sales performance and activities</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalLeads}</div>
            <p className="text-xs text-gray-500">All pipeline stages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Deals</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{activeDeals}</div>
            <p className="text-xs text-gray-500">${(pipelineValue / 1000).toFixed(0)}K value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Closed Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{wonDeals}</div>
            <p className="text-xs text-green-600">Won this period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${(totalRevenue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-gray-500">Closed deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{conversionRate}%</div>
            <p className="text-xs text-gray-500">Lead to customer</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leadStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leadStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
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
              <BarChart data={leadSourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
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

      {/* Top Performers & Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        {!isSalesEmployee && (
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.slice(0, 5).map((performer, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <span className="text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm">{performer.name}</p>
                        <p className="text-xs text-gray-500">{performer.deals} deals closed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">${(performer.revenue / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activities */}
        <Card className={isSalesEmployee ? 'lg:col-span-2' : ''}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activities</CardTitle>
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    {activity.type === 'call' && <Phone className="h-4 w-4 text-blue-600" />}
                    {activity.type === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
                    {activity.type === 'meeting' && <Users className="h-4 w-4 text-blue-600" />}
                    {activity.type === 'demo' && <Target className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{activity.userName}</p>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">{activity.notes}</p>
                    {activity.outcome && (
                      <p className="mt-1 text-xs text-gray-500">Outcome: {activity.outcome}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(activity.date).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" onClick={() => onNavigate('leads')}>
              <Users className="mr-2 h-4 w-4" />
              Manage Leads
            </Button>
            <Button variant="outline" onClick={() => onNavigate('pipeline')}>
              <Target className="mr-2 h-4 w-4" />
              View Pipeline
            </Button>
            <Button variant="outline" onClick={() => onNavigate('customers')}>
              <Users className="mr-2 h-4 w-4" />
              Customers
            </Button>
            <Button variant="outline" onClick={() => onNavigate('crm-reports')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Sales Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
