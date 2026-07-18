import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Provider, PurchaseEntry } from '../types/api';

export function useProviders() {
  return useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const response = await api.get<Provider[]>('/purchase/providers');
      return response.data;
    }
  });
}

export function usePurchases() {
  return useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const response = await api.get<PurchaseEntry[]>('/purchase/');
      return response.data;
    }
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<PurchaseEntry>) => {
      const response = await api.post<PurchaseEntry>('/purchase/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  });
}

export function useCreateProvider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; phone?: string; gstin?: string; is_active?: boolean }) => {
      const response = await api.post<Provider>('/purchase/providers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    }
  });
}
