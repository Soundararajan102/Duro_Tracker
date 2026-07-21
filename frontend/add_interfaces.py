with open('d:\\Duro_Tracker\\frontend\\src\\types\\api.ts', 'a') as f:
    f.write('''
export interface DeliveryItemCreate {
  item_id: string;
  full_delivered: number;
  empty_received: number;
}

export interface BuyerSummary {
  id: string;
  name: string;
  is_active: boolean;
  address?: string;
  balance_pending?: number;
}

export interface DeliveryItemOut {
  id: string;
  item_id: string;
  unit_price_at_delivery: number;
  line_total_amount: number;
  full_delivered: number;
  empty_received: number;
  item?: Item;
}
''')
