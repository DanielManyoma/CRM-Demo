export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';

export type LeadSource = 'website' | 'referral' | 'linkedin' | 'cold-outreach' | 'event' | 'partner';

export type Lead = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: LeadSource;
  value: number;
  lastContact: Date;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  notes: string;
  /** Agent or owner id for team view and per-agent metrics. */
  ownerId: string;
  /** Human-readable agent name displayed in the UI and used for filtering. */
  owner: string;
};

export type DashboardStats = {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  proposalStage: number;
  wonDeals: number;
  totalValue: number;
  avgDealSize: number;
  conversionRate: number;
};
