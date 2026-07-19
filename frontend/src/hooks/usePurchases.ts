import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Provider, PurchaseBill } from '../types/api';

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
      const response = await api.get<PurchaseBill[]>('/purchase/');
      return response.data;
    }
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { provider_id: string; bill_number?: string; total_cost: number; amount_paid: number; items: { item_id: string; full_received: number; empty_returned: number; total_cost: number }[] }) => {
      const response = await api.post<PurchaseBill>('/purchase/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
}

export function useCreateProvider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; phone?: string; gstin?: string; price_per_kg?: number; is_active?: boolean }) => {
      const response = await api.post<Provider>('/purchase/providers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    }
  });
}

export function useUpdateProvider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Provider> }) => {
      const response = await api.put<Provider>(`/purchase/providers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    }
  });
}
