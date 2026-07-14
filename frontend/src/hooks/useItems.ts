import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Item, ItemCreate } from '../types/api';

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get<Item[]>('/admin/items');
      return response.data;
    }
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ItemCreate) => {
      const response = await api.post<Item>('/admin/items', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  });
}

export function useToggleItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      const response = await api.patch<Item>(`/admin/items/${id}`, { is_active: isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  });
}
