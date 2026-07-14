import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Wallet, ArrowDown, TrendingUp, ArrowUp, Truck, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { useDashboardMetrics } from '../../hooks/useDashboard';

const activityData = [
  { id: 1, type: 'delivery', message: 'Driver John delivered 19kg to Shop XYZ', time: '10 mins ago', amount: '₹3,500' },
  { id: 2, type: 'collection', message: 'Payment received via UPI from ABC Store', time: '30 mins ago', amount: '₹12,000' },
  { id: 3, type: 'delivery', message: 'Driver Mike delivered 14.2kg to Retailer Q', time: '1 hour ago', amount: '₹1,200' },
  { id: 4, type: 'alert', message: 'Low stock: 19kg Commercial', time: '2 hours ago' },
  { id: 5, type: 'collection', message: 'Cash collected from Driver John', time: '3 hours ago', amount: '₹5,000' },
];

export default function DashboardScreen() {
  const { data: metrics, isLoading } = useDashboardMetrics();
  return (
    <ScrollView className="flex-1 bg-gray-50 p-4 pt-12">
      <View className="mb-6 flex flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-slate-900">Dashboard</Text>
      </View>

      {/* Metrics Row */}
      {isLoading ? (
        <View className="mb-6 h-24 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : metrics ? (
        <View className="flex flex-row gap-3 mb-6">
          <View className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <View className="flex flex-row items-center gap-1.5 mb-2">
              <CheckCircle2 size={16} color="#059669" />
              <Text className="font-medium text-xs text-slate-500">Collected</Text>
            </View>
            <Text className="text-xl font-bold text-slate-900 mb-1 tracking-tight">₹{(metrics.total_cash_collected + metrics.total_upi_collected).toLocaleString()}</Text>
            <Text className="text-[10px] text-slate-400 font-medium">Cash & UPI</Text>
          </View>

          <View className="flex-1 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm p-4">
            <View className="flex flex-row items-center gap-1.5 mb-2">
              <Truck size={16} color="#4f46e5" />
              <Text className="font-medium text-xs text-indigo-800">Dispatched</Text>
            </View>
            <Text className="text-xl font-bold text-indigo-950 mb-1 tracking-tight">{metrics.total_dispatched}</Text>
            <Text className="text-[10px] text-indigo-600 font-medium">Full Cylinders</Text>
          </View>
        </View>
      ) : null}

      {/* Activity Feed */}
      <View className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5 flex flex-col mb-10">
        <View className="mb-5 flex flex-row items-center justify-between">
          <Text className="text-base font-bold text-slate-900">Recent Activity</Text>
          <Pressable className="bg-indigo-50 px-3 py-1.5 rounded-full">
            <Text className="text-indigo-600 text-xs font-semibold">View All</Text>
          </Pressable>
        </View>

        <View className="relative">
          {/* Vertical Timeline Line */}
          <View className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-slate-100" />
          
          {activityData.map((activity) => (
            <View key={activity.id} className="flex flex-row items-center justify-between mb-5 relative">
              <View className="flex flex-row items-center gap-4 flex-1 pr-2">
                <View className={`z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${
                  activity.type === 'delivery' ? 'bg-indigo-100' :
                  activity.type === 'collection' ? 'bg-emerald-100' : 'bg-rose-100'
                }`}>
                  {activity.type === 'delivery' ? <Truck size={16} color="#4f46e5" /> :
                   activity.type === 'collection' ? <CheckCircle2 size={16} color="#059669" /> :
                   <AlertTriangle size={16} color="#e11d48" />}
                </View>
                <View className="flex flex-col flex-1">
                  <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{activity.message}</Text>
                  <Text className="text-[11px] font-medium text-slate-400 mt-0.5">{activity.time}</Text>
                </View>
              </View>
              {activity.amount && (
                <Text className={`text-sm font-bold pl-2 ${
                  activity.type === 'collection' ? 'text-emerald-600' : 'text-slate-700'
                }`}>
                  {activity.type === 'collection' ? '+' : ''}{activity.amount}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
