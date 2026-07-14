import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function HistoryScreen() {
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

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-zinc-100">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold text-zinc-800">
          {item.buyer?.name || item.adhoc_buyer_name || 'Unknown Buyer'}
        </Text>
        <Text className="text-zinc-400 text-xs">
          {new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
        </Text>
      </View>
      
      <View className="flex-row justify-between mb-3 bg-zinc-50 p-3 rounded-xl">
        <View className="items-center">
          <Text className="text-zinc-500 text-xs uppercase mb-1">Delivered</Text>
          <Text className="text-green-600 font-bold text-lg">{item.full_delivered}</Text>
        </View>
        <View className="items-center">
          <Text className="text-zinc-500 text-xs uppercase mb-1">Returned</Text>
          <Text className="text-orange-500 font-bold text-lg">{item.empty_received}</Text>
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
    </View>
  );
}
