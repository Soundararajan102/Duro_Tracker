import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { Settings2, X } from 'lucide-react-native';
import { useItems } from '../../hooks/useItems';

export default function InventoryScreen() {
  const { data: inventoryData = [] } = useItems();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4 pt-12">
        {/* Header */}
        <View className="flex flex-col sm:flex-row mb-6 mt-2">
          <View className="flex-1 mb-4 sm:mb-0">
            <Text className="text-2xl font-semibold text-slate-900">Live Stock Snapshot</Text>
            <Text className="text-slate-500 text-sm mt-1">Real-time inventory levels</Text>
          </View>
          <Pressable 
            onPress={() => setIsModalOpen(true)}
            className="flex flex-row items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm"
          >
            <Settings2 size={16} color="#64748b" />
            <Text className="text-slate-700 text-sm font-medium">Adjust Stock</Text>
          </Pressable>
        </View>

        {/* Grid Layout */}
        <View className="flex flex-col gap-6 pb-20">
          {inventoryData.map((item) => (
            <View key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <View className="p-6 pb-4">
                <Text className="text-lg font-semibold text-slate-900">{item.name}</Text>
              </View>
              
              <View className="flex flex-row px-6 pb-6 gap-4">
                <View className="flex flex-col flex-1">
                  <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Full (Ready)</Text>
                  <Text className="text-5xl font-bold font-mono tracking-tighter text-emerald-600 leading-none">
                    {item.current_full}
                  </Text>
                </View>
                <View className="flex flex-col flex-1 border-l border-gray-100 pl-4">
                  <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Empty (Return)</Text>
                  <Text className="text-5xl font-bold font-mono tracking-tighter text-amber-500 leading-none">
                    {item.current_empty}
                  </Text>
                </View>
              </View>
              
              <View className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex flex-row justify-between items-center">
                <Text className="text-sm font-medium text-slate-500">Total Physical Assets</Text>
                <Text className="text-sm font-mono font-bold text-slate-700">{item.current_full + item.current_empty}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Adjust Stock Modal */}
      <Modal animationType="fade" transparent={true} visible={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <View className="flex-1 items-center justify-center p-4 bg-slate-900/50">
          <View className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <View className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-slate-900">Adjust Stock</Text>
              <Pressable onPress={() => setIsModalOpen(false)} className="p-1 rounded-full">
                <X size={20} color="#94a3b8" />
              </Pressable>
            </View>
            
            <View className="p-6 flex flex-col gap-4">
              <View>
                <Text className="text-sm font-medium text-slate-700 mb-1">Item to Adjust</Text>
                <View className="w-full rounded-lg border-gray-300 border px-3 py-3 bg-white">
                  <Text className="text-sm text-slate-900">19kg Commercial</Text>
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-slate-700 mb-1">Quantity to Deduct</Text>
                <TextInput 
                  placeholder="0"
                  keyboardType="numeric"
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm text-slate-900 font-mono"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-slate-700 mb-1">Reason</Text>
                <View className="w-full rounded-lg border-gray-300 border px-3 py-3 bg-white">
                  <Text className="text-sm text-slate-900">Defective / Leaking</Text>
                </View>
              </View>

              <Pressable 
                onPress={() => setIsModalOpen(false)}
                className="w-full bg-indigo-600 rounded-lg py-2.5 items-center justify-center mt-2"
              >
                <Text className="text-white font-medium text-sm">Confirm Adjustment</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
