// Dashboard Types

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'list';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: Record<string, any>;
  data?: any;
  isLoading?: boolean;
  error?: string;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
}

export interface DashboardStats {
  totalClients: number;
  totalInvoices: number;
  totalRevenue: number;
  pendingPayments: number;
  overdueInvoices: number;
  recentActivity: {
    type: string;
    description: string;
    timestamp: string;
  }[];
}
