// Analytics Types

export interface AnalyticsData {
  id: string;
  metric: string;
  value: number;
  timestamp: string;
  dimensions: Record<string, any>;
}

export interface Report {
  id: string;
  name: string;
  type: 'revenue' | 'clients' | 'invoices' | 'expenses' | 'custom';
  data: AnalyticsData[];
  period: {
    start: string;
    end: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface Metric {
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  format: 'currency' | 'number' | 'percentage';
}
