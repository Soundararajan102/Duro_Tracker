import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useReceiptImagePrintJob } from '../../hooks/use-receipt-image-print-job';
import { usePrinterStore } from '../../store/printer-store';
import { DeliveryReceiptData, DeliveryReceiptItem } from '../../utils/printer';

export default function BillsScreen() {
  const { receiptImagePrintBridge, startReceiptImagePrintJob } = useReceiptImagePrintJob();
  const preferredPrinter = usePrinterStore((state) => state.preferredPrinter);
  const { data: history, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver_history'],
    queryFn: async () => {
      const res = await api.get('/driver/entries');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-zinc-100">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const handlePrint = (item: any) => {
    if (!preferredPrinter) {
      Alert.alert("No Printer", "Please select a printer in the Delivery screen first.");
      return;
    }
    
    // Approximation for opening balance
    const currentBalance = item.buyer?.balance_pending || 0;
    
    const receiptItems: DeliveryReceiptItem[] = item.items.map((i: any) => ({
      name: i.item?.name || 'Item',
      quantity: i.full_delivered,
      price: i.unit_price_at_delivery,
      total: i.line_total_amount
    }));
    
    const receiptData: DeliveryReceiptData = {
      receipt_number: item.id.split('-')[0].toUpperCase(),
      date: item.timestamp,
      agency_name: "Sree Hari Agencies",
      agency_address: "Namakkal",
      buyer_name: item.buyer?.name || item.adhoc_buyer_name || 'Unknown',
      buyer_address: item.buyer?.address || "",
      opening_balance: currentBalance - item.total_bill_amount + item.cash_collected + item.upi_collected,
      items: receiptItems,
      total_bill: item.total_bill_amount,
      cash_collected: item.cash_collected,
      upi_collected: item.upi_collected,
      closing_balance: currentBalance,
    };

    startReceiptImagePrintJob([receiptData], preferredPrinter).catch(err => {
      Alert.alert("Print Error", err.message || "Failed to print receipt");
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const totalDelivered = item.items.reduce((sum: number, i: any) => sum + i.full_delivered, 0);
    const totalReturned = item.items.reduce((sum: number, i: any) => sum + i.empty_received, 0);

    return (
      <View className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-zinc-100">
        <View className="flex-row justify-between items-center mb-3 border-b border-zinc-100 pb-3">
          <View>
            <Text className="text-lg font-semibold text-zinc-800">
              {item.buyer?.name || item.adhoc_buyer_name || 'Unknown Buyer'}
            </Text>
            <Text className="text-zinc-400 text-xs">
              {new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handlePrint(item)} className="p-2 bg-zinc-50 rounded-full border border-zinc-200">
            <Ionicons name="print-outline" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
        
        <View className="mb-3 space-y-1">
          {item.items.map((i: any, idx: number) => (
             <View key={idx} className="flex-row justify-between">
                <Text className="text-zinc-600">{i.item?.name}</Text>
                <Text className="text-zinc-600 font-medium">
                   {i.full_delivered} delivered {i.empty_received > 0 ? `(${i.empty_received} ret)` : ''}
                </Text>
             </View>
          ))}
        </View>

        <View className="flex-row justify-between mb-3 bg-zinc-50 p-3 rounded-xl">
          <View className="items-center">
            <Text className="text-zinc-500 text-xs uppercase mb-1">Items</Text>
            <Text className="text-green-600 font-bold text-lg">{totalDelivered}</Text>
          </View>
          <View className="items-center">
            <Text className="text-zinc-500 text-xs uppercase mb-1">Returned</Text>
            <Text className="text-orange-500 font-bold text-lg">{totalReturned}</Text>
          </View>
          <View className="items-center">
            <Text className="text-zinc-500 text-xs uppercase mb-1">Bill</Text>
            <Text className="text-zinc-800 font-bold text-lg">₹{item.total_bill_amount}</Text>
          </View>
        </View>

        <View className="flex-row justify-between border-t border-zinc-100 pt-3">
          <View className="flex-row items-center">
            <Ionicons name="cash-outline" size={16} color="#71717a" />
            <Text className="text-zinc-600 ml-1">₹{item.cash_collected}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="phone-portrait-outline" size={16} color="#71717a" />
            <Text className="text-zinc-600 ml-1">₹{item.upi_collected}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-zinc-100">
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="py-10 items-center">
            <Ionicons name="receipt-outline" size={48} color="#d4d4d8" />
            <Text className="text-zinc-400 mt-4 text-center">No deliveries logged today.</Text>
          </View>
        }
        refreshing={isRefetching}
        onRefresh={refetch}
      />
      {receiptImagePrintBridge}
    </View>
  );
}
