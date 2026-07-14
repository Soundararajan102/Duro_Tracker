import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Buyer } from '../types/api';

export function useBuyers() {
  return useQuery({
    queryKey: ['buyers'],
    queryFn: async () => {
      const response = await api.get<Buyer[]>('/admin/buyers');
      return response.data;
    }
  });
}
