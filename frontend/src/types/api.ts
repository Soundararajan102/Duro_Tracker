export type ItemCategory = 'commercial' | 'domestic' | 'retail';

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  capacity_kg?: number;
  initial_full: number;
  initial_empty: number;
  current_full: number;
  current_empty: number;
  is_active: boolean;
}

export interface ItemCreate {
  name: string;
  category: ItemCategory;
  price: number;
  capacity_kg?: number;
  initial_full: number;
  initial_empty: number;
  is_active?: boolean;
}

export interface ItemUpdate {
  name?: string;
  category?: ItemCategory;
  price?: number;
  capacity_kg?: number;
  current_full?: number;
  current_empty?: number;
  is_active?: boolean;
}

export interface Driver {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  // Extraneous stats if returned by backend
  deliveries?: number;
  collected?: number;
  lastActive?: string;
}

export interface Buyer {
  id: string;
  name: string;
  phone?: string;
  type: 'retail' | 'commercial';
  address?: string;
  is_active: boolean;
  balance_pending: number;
  cylinders_pending: number;
  price_per_kg?: number;
}

export interface BuyerCreate {
  name: string;
  phone?: string;
  type: 'retail' | 'commercial';
  address?: string;
  balance_pending?: number;
  cylinders_pending?: number;
  price_per_kg?: number;
}

export interface BuyerUpdate {
  name?: string;
  phone?: string;
  type?: 'retail' | 'commercial';
  address?: string;
  is_active?: boolean;
  price_per_kg?: number;
  balance_pending?: number;
  cylinders_pending?: number;
}

export interface DashboardMetrics {
  total_dispatched: number;
  total_empty_received: number;
  total_cash_collected: number;
  total_upi_collected: number;
  outstanding_balance: number;
  todays_sales: number;
}

export interface Provider {
  id: string;
  name: string;
  phone?: string;
  gstin?: string;
  balance_pending: number;
  cylinders_pending: number;
  is_active: boolean;
}

export interface PurchaseEntry {
  id: string;
  provider_id: string;
  item_id: string;
  full_received: number;
  empty_returned: number;
  total_cost: number;
  amount_paid: number;
  created_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  max_users: number;
  created_at?: string;
}

export interface OrganizationCreate {
  name: string;
  max_users: number;
}

export interface UserCreate {
  username: string;
  password?: string;
  role: 'super_admin' | 'tenant_admin' | 'driver';
  is_active?: boolean;
}

export interface User {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at?: string;
  organization_id?: string;
}

export interface OrganizationUpdate {
  name?: string;
  max_users?: number;
}
