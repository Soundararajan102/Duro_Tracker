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
