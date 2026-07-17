import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Buyer, BuyerCreate, BuyerUpdate } from '../types/api';

export function useBuyers() {
  return useQuery({
    queryKey: ['buyers'],
    queryFn: async () => {
      const response = await api.get<Buyer[]>('/admin/buyers');
      return response.data;
    }
  });
}

export function useCreateBuyer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<Buyer>('/admin/buyers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
    }
  });
}

export function useUpdateBuyer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: BuyerUpdate }) => {
      const response = await api.put<Buyer>(`/admin/buyers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
    }
  });
}

export function useDeleteBuyer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/buyers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
    }
  });
}

export interface GlobalBill {
  id: string;
  time: string;
  buyer: string;
  fullGiven: number;
  emptyCollected: number;
  total: number;
}

export function useGlobalBills() {
  return useQuery({
    queryKey: ['buyers', 'bills'],
    queryFn: async () => {
      const response = await api.get<GlobalBill[]>('/admin/buyers/bills');
      return response.data;
    }
  });
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: string;
  fullGiven: number;
  emptyCollected: number;
  amount: number;
  paid: number;
  finRunBal: number;
  cylRunBal: number;
}

export function useBuyerLedger(buyerId?: string) {
  return useQuery({
    queryKey: ['buyers', buyerId, 'ledger'],
    queryFn: async () => {
      if (!buyerId) return [];
      const response = await api.get<LedgerEntry[]>(`/admin/buyers/${buyerId}/ledger`);
      return response.data;
    },
    enabled: !!buyerId
  });
}
