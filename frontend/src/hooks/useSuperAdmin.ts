import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '../services/api';
import { Organization, OrganizationCreate, OrganizationUpdate, User, UserCreate } from '../types/api';

export function useOrganizations() {
  return useQuery<Organization[], Error>({
    queryKey: ['organizations'],
    queryFn: superAdminApi.getOrganizations,
  });
}

export function useSuperAdminStats() {
  return useQuery<{ total_users: number, total_organizations: number }, Error>({
    queryKey: ['super_admin_stats'],
    queryFn: superAdminApi.getStats,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OrganizationCreate) => superAdminApi.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

export function useCreateTenantAdmin() {
  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: UserCreate }) => superAdminApi.createTenantAdmin(orgId, data),
  });
}

export function useOrganizationUsers(orgId: string) {
  return useQuery<User[], Error>({
    queryKey: ['organization_users', orgId],
    queryFn: () => superAdminApi.getOrganizationUsers(orgId),
    enabled: !!orgId,
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: OrganizationUpdate }) => superAdminApi.updateOrganization(orgId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orgId: string) => superAdminApi.deleteOrganization(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['super_admin_stats'] });
    },
  });
}

export function useUpdateOrganizationUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, userId, data }: { orgId: string; userId: string; data: { password?: string; is_active?: boolean } }) => 
      superAdminApi.updateOrganizationUser(orgId, userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization_users', variables.orgId] });
    },
  });
}

export function useDeleteOrganizationUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, userId }: { orgId: string; userId: string }) => 
      superAdminApi.deleteOrganizationUser(orgId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization_users', variables.orgId] });
    },
  });
}
