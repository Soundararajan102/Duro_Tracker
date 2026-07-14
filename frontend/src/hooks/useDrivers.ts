import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Driver } from '../types/api';

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const response = await api.get<Driver[]>('/admin/drivers');
      return response.data;
    }
  });
}

export function useToggleDriver() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      const response = await api.patch<Driver>(`/admin/drivers/${id}`, { is_active: isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    }
  });
}

