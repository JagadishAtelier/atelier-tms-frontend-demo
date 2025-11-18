import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  User as UserIcon,
  Plus,
} from 'lucide-react';
import type { Deal, DealStage, User } from '../types';

interface SalesPipelineProps {
  deals: Deal[];
  users: User[];
  currentUser: User;
}

export function SalesPipeline({ deals, users, currentUser }: SalesPipelineProps) {
  const [selectedUser, setSelectedUser] = useState<string>('all');

  // Filter deals based on user role and selection
  let filteredDeals = deals;
  if (currentUser.department === 'Sales' && currentUser.role === 'Employee') {
    filteredDeals = deals.filter((deal) => deal.assignedTo === currentUser.id);
  } else if (selectedUser !== 'all') {
    filteredDeals = deals.filter((deal) => deal.assignedTo === selectedUser);
  }

  const stages: DealStage[] = [
    'Prospecting',
    'Qualification',
    'Proposal',
    'Negotiation',
    'Closed Won',
    'Closed Lost',
  ];

  const getDealsByStage = (stage: DealStage) => {
    return filteredDeals.filter((deal) => deal.stage === stage);
  };

  const getStageColor = (stage: DealStage) => {
    switch (stage) {
      case 'Prospecting':
        return 'bg-blue-100 text-blue-800';
      case 'Qualification':
        return 'bg-cyan-100 text-cyan-800';
      case 'Proposal':
        return 'bg-purple-100 text-purple-800';
      case 'Negotiation':
        return 'bg-orange-100 text-orange-800';
      case 'Closed Won':
        return 'bg-green-100 text-green-800';
      case 'Closed Lost':
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageBadgeColor = (stage: DealStage): any => {
    switch (stage) {
      case 'Closed Won':
        return 'default';
      case 'Closed Lost':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Calculate stats
  const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.amount, 0);
  const activeDeals = filteredDeals.filter(
    (d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
  );
  const wonDeals = filteredDeals.filter((d) => d.stage === 'Closed Won');
  const projectedRevenue = activeDeals.reduce(
    (sum, deal) => sum + (deal.amount * deal.probability) / 100,
    0
  );
  const wonRevenue = wonDeals.reduce((sum, deal) => sum + deal.amount, 0);

  const salesUsers = users.filter((u) => u.department === 'Sales' && u.isActive);

  const DealCard = ({ deal }: { deal: Deal }) => {
    const assignedUser = users.find((u) => u.id === deal.assignedTo);
    return (
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm">{deal.title}</h4>
              <p className="text-xs text-gray-500">{deal.customerName}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm">${deal.amount.toLocaleString()}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {deal.probability}%
              </Badge>
            </div>

            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <UserIcon className="h-3 w-3" />
                <span>{assignedUser?.name}</span>
              </div>
            </div>

            {deal.product && (
              <Badge variant="outline" className="text-xs">
                {deal.product}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Sales Pipeline</h1>
          <p className="text-gray-500">Track deals through the sales process</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-gray-500">{filteredDeals.length} deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{activeDeals.length}</div>
            <p className="text-xs text-gray-500">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Projected Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${projectedRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500">Weighted by probability</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Won Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${wonRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600">{wonDeals.length} deals closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label className="text-sm">Filter by Sales Executive:</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Executives</SelectItem>
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
      )}

      {/* Pipeline Board */}
      <div className="grid gap-4 md:grid-cols-6">
        {stages.map((stage) => {
          const stageDeals = getDealsByStage(stage);
          const stageValue = stageDeals.reduce((sum, deal) => sum + deal.amount, 0);

          return (
            <div key={stage} className="space-y-3">
              <div className={`rounded-lg p-3 ${getStageColor(stage)}`}>
                <h3 className="text-sm">{stage}</h3>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span>{stageDeals.length} deals</span>
                  <span>${(stageValue / 1000).toFixed(0)}K</span>
                </div>
              </div>
              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
                {stageDeals.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed p-4 text-center text-xs text-gray-400">
                    No deals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stages
              .filter((stage) => stage !== 'Closed Won' && stage !== 'Closed Lost')
              .map((stage) => {
                const stageDeals = getDealsByStage(stage);
                const stageValue = stageDeals.reduce((sum, deal) => sum + deal.amount, 0);
                const weightedValue = stageDeals.reduce(
                  (sum, deal) => sum + (deal.amount * deal.probability) / 100,
                  0
                );
                const percentage = totalValue > 0 ? (stageValue / totalValue) * 100 : 0;

                return (
                  <div key={stage} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={getStageBadgeColor(stage)}>{stage}</Badge>
                        <span className="text-gray-500">
                          {stageDeals.length} deals
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500">
                          ${stageValue.toLocaleString()}
                        </span>
                        <span>
                          Weighted: ${weightedValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} />
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={className}>{children}</label>;
}
