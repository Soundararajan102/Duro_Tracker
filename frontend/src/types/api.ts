export interface Item {
  id: string;
  name: string;
  category: 'commercial' | 'domestic' | 'retail';
  price: number;
  initial_full: number;
  initial_empty: number;
  current_full: number;
  current_empty: number;
  is_active: boolean;
}

export interface ItemCreate {
  name: string;
  category: 'commercial' | 'domestic' | 'retail';
  price: number;
  initial_full: number;
  initial_empty: number;
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
}

export interface DashboardMetrics {
  total_dispatched: number;
  total_empty_received: number;
  total_cash_collected: number;
  total_upi_collected: number;
}

export interface Provider {
  id: string;
  name: string;
  phone?: string;
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
}
