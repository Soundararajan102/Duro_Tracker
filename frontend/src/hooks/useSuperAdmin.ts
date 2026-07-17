import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '../services/api';
import { Organization, OrganizationCreate, UserCreate } from '../types/api';

export function useOrganizations() {
  return useQuery<Organization[], Error>({
    queryKey: ['organizations'],
    queryFn: superAdminApi.getOrganizations,
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
