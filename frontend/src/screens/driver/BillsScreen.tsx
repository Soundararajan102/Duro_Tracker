import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useReceiptImagePrintJob } from '../../hooks/use-receipt-image-print-job';
import { usePrinterStore } from '../../store/printer-store';
import { DeliveryReceiptData, DeliveryReceiptItem } from '../../utils/printer';
import { format } from 'date-fns';
import { useDriverItems } from '../../hooks/useItems';
function BillCard({ item, handlePrint, itemsCatalog }: { item: any; handlePrint: (item: any) => void; itemsCatalog?: any[] }) {
  const isCollection = !item.items || item.items.length === 0;
  const currentBalance = item.buyer?.balance_pending || 0;
  // Use snapshot if available, otherwise fallback to approximation
  const openingBalance = item.opening_balance != null ? item.opening_balance : (currentBalance - item.total_bill_amount + item.cash_collected + item.upi_collected);
  const closingBalance = item.closing_balance != null ? item.closing_balance : currentBalance;

  const receiptNumber = item.bill_number || (item.id ? String(item.id).split('-')[0].toUpperCase() : '-');
  const currentBillBal = item.total_bill_amount - item.cash_collected - item.upi_collected;

  return (
    <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-zinc-200">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-4 border-b border-zinc-100 pb-3">
        <View className="flex-1">
          <Text className="text-zinc-500 text-xs font-semibold mb-1 uppercase tracking-wider">Bill No: {receiptNumber}</Text>
          <Text className="text-xl font-bold text-zinc-900">
            {item.buyer?.name || item.adhoc_buyer_name || 'Unknown Buyer'}
          </Text>
          <Text className="text-zinc-500 text-sm mt-0.5">
            {item.timestamp ? format(new Date(item.timestamp), 'dd MMM yyyy, hh:mm a') : 'Unknown Date'}
          </Text>
          {item.buyer?.address ? (
            <Text className="text-zinc-400 text-xs mt-1">{item.buyer.address}</Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={() => handlePrint(item)} className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 active:bg-blue-100 ml-2">
          <Ionicons name="print" size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Opening Balance */}
      <View className="flex-row justify-between items-center mb-4 px-1">
        <Text className="text-zinc-500 text-sm font-medium">Opening Balance</Text>
        <Text className="text-zinc-800 text-sm font-bold">₹{openingBalance.toFixed(2)}</Text>
      </View>

      {/* Items Table - Only for Sales */}
      {!isCollection && (
        <View className="mb-4 bg-zinc-50 rounded-xl overflow-hidden border border-zinc-100">
          <View className="flex-row border-b border-zinc-200 px-3 py-2 bg-zinc-100/50">
            <Text className="flex-1 text-zinc-500 text-xs font-bold uppercase tracking-wider">Item</Text>
            <Text className="w-12 text-center text-zinc-500 text-xs font-bold uppercase tracking-wider">Qty</Text>
            <Text className="w-16 text-center text-zinc-500 text-xs font-bold uppercase tracking-wider">Rate</Text>
            <Text className="w-20 text-right text-zinc-500 text-xs font-bold uppercase tracking-wider">Total</Text>
          </View>
          {item.items && item.items.length > 0 ? (
            item.items.map((i: any, idx: number) => (
              <View key={idx} className="flex-row px-3 py-2.5 border-b border-zinc-100 last:border-0 items-center">
                <View className="flex-1 pr-2">
                  <Text className="text-zinc-800 font-medium text-sm">{i.item?.name || 'Unknown'}</Text>
                  {i.empty_received > 0 && (
                    <Text className="text-orange-500 text-xs mt-0.5">{i.empty_received} Empty Returned</Text>
                  )}
                </View>
                <Text className="w-12 text-center text-zinc-800 font-semibold">{i.full_delivered}</Text>
                <Text className="w-16 text-center text-zinc-600 text-xs font-medium">₹{i.unit_price_at_delivery}</Text>
                <Text className="w-20 text-right text-zinc-800 font-bold">₹{i.line_total_amount}</Text>
              </View>
            ))
          ) : (
            <View className="px-3 py-4 items-center">
               <Text className="text-zinc-400 text-sm font-medium">No items in this bill</Text>
            </View>
          )}
        </View>
      )}

      {/* Summary Section */}
      <View className="mb-4 px-1">
        {!isCollection && (
          <View className="flex-row justify-between items-center py-1.5">
            <Text className="text-zinc-600 font-medium">Total Bill Amount</Text>
            <Text className="text-zinc-900 font-bold text-base">₹{item.total_bill_amount.toFixed(2)}</Text>
          </View>
        )}
        <View className="flex-row justify-between items-center py-1.5">
          <Text className="text-emerald-600 font-medium">{isCollection ? 'Cash Received' : 'Cash Paid'}</Text>
          <Text className="text-emerald-600 font-semibold">{!isCollection && '- '}₹{item.cash_collected.toFixed(2)}</Text>
        </View>
        <View className="flex-row justify-between items-center py-1.5">
          <Text className="text-blue-600 font-medium">{isCollection ? 'UPI Received' : 'UPI Paid'}</Text>
          <Text className="text-blue-600 font-semibold">{!isCollection && '- '}₹{item.upi_collected.toFixed(2)}</Text>
        </View>
        
        {isCollection && (
          <View className="flex-row justify-between items-center pt-3 pb-1 border-t border-zinc-100 mt-1.5">
            <Text className="text-zinc-800 font-semibold">Total Amount Received</Text>
            <Text className="text-zinc-900 font-bold text-base text-emerald-600">₹{(item.cash_collected + item.upi_collected).toFixed(2)}</Text>
          </View>
        )}
        {!isCollection && (
          <View className="flex-row justify-between items-center pt-3 pb-1 border-t border-zinc-100 mt-1.5">
            <Text className="text-zinc-800 font-semibold">Balance Amount</Text>
            <Text className="text-zinc-900 font-bold text-base">₹{currentBillBal.toFixed(2)}</Text>
          </View>
        )}
      </View>

      {/* Closing Balance */}
      <View className="flex-row justify-between items-center p-3 bg-zinc-800 rounded-xl mb-4 shadow-sm">
        <Text className="text-zinc-100 font-semibold">Closing Balance</Text>
        <Text className="text-white font-bold text-lg tracking-tight">₹{closingBalance.toFixed(2)}</Text>
      </View>

      {/* Cylinders Holding */}
      {item.items && item.items.filter((bi: any) => bi.buyer_holding_snapshot != null).length > 0 && (
        <View className="border border-zinc-200 rounded-xl overflow-hidden">
          <View className="bg-zinc-50 px-3 py-2 border-b border-zinc-200">
            <Text className="text-zinc-600 font-bold text-xs uppercase tracking-wider text-center">
              Cylinders Holding
            </Text>
          </View>
          <View className="p-3 gap-2 bg-white">
            {item.items
              .filter((bi: any) => bi.buyer_holding_snapshot != null)
              .map((bi: any, idx: number) => {
                const itemName = bi.item?.name || itemsCatalog?.find((i: any) => i.id === bi.item_id)?.name || 'Cyl';
                const given = bi.full_delivered || 0;
                const taken = bi.empty_received || 0;
                const hold = bi.buyer_holding_snapshot;
                
                return (
                  <View key={idx} className="bg-orange-50 border border-orange-200 px-3 py-2 rounded-lg flex-row justify-center items-center shadow-sm">
                    <Text className="text-orange-900 font-semibold text-xs text-center">
                      {itemName} - Given: {given}  Taken: {taken}  Hold: {hold}
                    </Text>
                  </View>
                );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

export default function BillsScreen() {
  const [activeTab, setActiveTab] = useState<'SALES' | 'COLLECTIONS'>('SALES');
  const { receiptImagePrintBridge, startReceiptImagePrintJob } = useReceiptImagePrintJob();
  const preferredPrinter = usePrinterStore((state) => state.preferredPrinter);
  const { data: itemsCatalog = [] } = useDriverItems();
  const { 
    data: historyData, 
    isLoading, 
    refetch, 
    isRefetching, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: ['driver_history', activeTab],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const res = await api.get('/driver/entries', {
        params: { 
          paginated: true, 
          cursor: pageParam, 
          limit: 20, 
          bill_type: activeTab === 'SALES' ? 'sales' : 'collections' 
        }
      });
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
    select: (data) => data.pages.flatMap((page) => page.items),
  });

  const history = historyData || [];

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-zinc-100">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const displayedHistory = history;

  const handlePrint = (item: any) => {
    if (!preferredPrinter) {
      Alert.alert("No Printer", "Please select a printer in the Delivery screen first.");
      return;
    }
    
    // Use snapshot if available, otherwise fallback to approximation
    const currentBalance = item.buyer?.balance_pending || 0;
    const openingBalance = item.opening_balance != null ? item.opening_balance : (currentBalance - item.total_bill_amount + item.cash_collected + item.upi_collected);
    const closingBalance = item.closing_balance != null ? item.closing_balance : currentBalance;
    
    const receiptItems: DeliveryReceiptItem[] = item.items.map((i: any) => ({
      name: i.item?.name || 'Item',
      quantity: i.full_delivered,
      price: i.unit_price_at_delivery,
      total: i.line_total_amount
    }));

      // Map only the items that were part of this specific delivery bill
      // to ensure historical accuracy, using the holding snapshot.
      const cylinderBalances = item.items
      ?.filter((bi: any) => bi.buyer_holding_snapshot != null)
      .map((bi: any) => {
        const given = bi.full_delivered || 0;
        const taken = bi.empty_received || 0;
        return {
          name: bi.item?.name || itemsCatalog?.find((cat: any) => cat.id === bi.item_id)?.name || 'Item',
          count: bi.buyer_holding_snapshot,
          given: given,
          taken: taken
        };
      });
    
    const isPayment = item.bill_number?.startsWith('PAY-');

    const receiptData: DeliveryReceiptData = {
      receipt_type: isPayment ? 'PAYMENT' : 'DELIVERY',
      receipt_number: item.bill_number || item.id.split('-')[0].toUpperCase(),
      date: item.timestamp,
      agency_name: "Sree Hari Agencies",
      agency_address: "Namakkal",
      buyer_name: item.buyer?.name || item.adhoc_buyer_name || 'Unknown',
      buyer_address: item.buyer?.address || "",
      opening_balance: openingBalance,
      items: receiptItems,
      total_bill: item.total_bill_amount,
      cash_collected: item.cash_collected,
      upi_collected: item.upi_collected,
      closing_balance: closingBalance,
      cylinder_balances: cylinderBalances,
    };

    startReceiptImagePrintJob([receiptData], preferredPrinter).catch(err => {
      Alert.alert("Print Error", err.message || "Failed to print receipt");
    });
  };

  return (
    <View className="flex-1 bg-zinc-100">
      <View className="flex-row bg-white p-2 mb-2">
        <TouchableOpacity 
          className={`flex-1 py-3 items-center rounded-lg ${activeTab === 'SALES' ? 'bg-zinc-800' : 'bg-transparent'}`}
          onPress={() => setActiveTab('SALES')}
        >
          <Text className={`font-semibold ${activeTab === 'SALES' ? 'text-white' : 'text-zinc-500'}`}>Sales Bills</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 items-center rounded-lg ${activeTab === 'COLLECTIONS' ? 'bg-zinc-800' : 'bg-transparent'}`}
          onPress={() => setActiveTab('COLLECTIONS')}
        >
          <Text className={`font-semibold ${activeTab === 'COLLECTIONS' ? 'text-white' : 'text-zinc-500'}`}>Collection Bills</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BillCard item={item} handlePrint={handlePrint} itemsCatalog={itemsCatalog} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="py-10 items-center">
            <Ionicons name="receipt-outline" size={48} color="#d4d4d8" />
            <Text className="text-zinc-400 mt-4 text-center">No deliveries logged today.</Text>
          </View>
        }
        refreshing={isRefetching}
        onRefresh={refetch}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator className="my-4" /> : null}
      />
      {receiptImagePrintBridge}
    </View>
  );
}
