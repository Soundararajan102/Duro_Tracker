import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { DashboardMetrics } from '../types/api';

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const response = await api.get<DashboardMetrics>('/dashboard/metrics');
      return response.data;
    }
  });
}

export interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  amount?: number;
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: async () => {
      const response = await api.get<RecentActivity[]>('/dashboard/recent-activity');
      return response.data;
    }
  });
}
