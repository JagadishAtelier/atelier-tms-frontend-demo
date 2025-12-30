export type UserRole = 'Super Admin' | 'Admin' | 'Manager' | 'employee' | 'Client';

export type TaskStatus = 'To Do' | 'In Progress' | 'Completed' | 'On Hold';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface User {
  id: string;
  _id: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  checkIn: string;
  checkOut?: string;
  totalHours?: number;
  status: 'present' | 'absent' | 'pending' | 'manual';
  date: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string[];
  assignedBy: string;
  createdAt: string;
  dueDate: string;
  project: string;
  department: string;
  tags: string[];
  subtasks?: Subtask[];
  attachments?: Attachment[];
  comments?: Comment[];
  timeSpent?: number;
  estimatedTime?: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  mentions?: string[];
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  department: string;
  status: 'Active' | 'On Hold' | 'Completed';
  startDate: string;
  endDate?: string;
}

export interface Department {
  id: string;
  name: string;
  managerId: string;
}



// CRM Types
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';

export type LeadSource = 'Website' | 'Referral' | 'Cold Call' | 'Email Campaign' | 'Social Media' | 'Trade Show' | 'Partner' | 'Other';

export type DealStage = 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  assignedTo: string;
  assignedBy: string;
  createdAt: string;
  lastContactDate?: string;
  tags: string[];
  notes?: string;
  value?: number;
  industry?: string;
  region?: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address?: string;
  industry: string;
  region: string;
  assignedTo: string;
  createdAt: string;
  totalValue: number;
  lastContactDate?: string;
  tags: string[];
  notes: CustomerNote[];
  status: 'Active' | 'Inactive' | 'VIP';
}

export interface CustomerNote {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  type: 'call' | 'email' | 'meeting' | 'note';
}

export interface Deal {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  amount: number;
  expectedCloseDate: string;
  stage: DealStage;
  probability: number;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  product?: string;
  campaign?: string;
  notes?: string;
  tags: string[];
}

export interface SalesActivity {
  id: string;
  userId: string;
  userName: string;
  type: 'call' | 'email' | 'meeting' | 'demo';
  leadId?: string;
  customerId?: string;
  dealId?: string;
  date: string;
  duration?: number;
  notes: string;
  outcome?: string;
}
