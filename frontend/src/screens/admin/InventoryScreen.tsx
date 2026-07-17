import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { Settings2, X, ChevronDown } from 'lucide-react-native';
import { useItems, useUpdateItem } from '../../hooks/useItems';

export default function InventoryScreen() {
  const { data: inventoryData = [] } = useItems();
  const updateItem = useUpdateItem();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [cylinderType, setCylinderType] = useState<'full' | 'empty'>('full');
  const [actionType, setActionType] = useState<'add' | 'deduct'>('add');
  const [quantity, setQuantity] = useState('');

  const handleAdjust = () => {
    if (!selectedItemId || !quantity) return;
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) return;

    const item = inventoryData.find(i => i.id === selectedItemId);
    if (!item) return;

    let newFull = item.current_full;
    let newEmpty = item.current_empty;

    if (cylinderType === 'full') {
      newFull = actionType === 'add' ? newFull + qty : Math.max(0, newFull - qty);
    } else {
      newEmpty = actionType === 'add' ? newEmpty + qty : Math.max(0, newEmpty - qty);
    }

    updateItem.mutate({
      id: selectedItemId,
      data: {
        current_full: newFull,
        current_empty: newEmpty
      }
    }, {
      onSuccess: () => {
        setIsModalOpen(false);
        setIsItemDropdownOpen(false);
        setQuantity('');
        setSelectedItemId('');
      }
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4 pt-12">
        {/* Header */}
        <View className="flex flex-col sm:flex-row mb-6 mt-2">
          <View className="flex-1 mb-4 sm:mb-0">
            <Text className="text-2xl font-semibold text-slate-900">Live Stock Snapshot</Text>
            <Text className="text-slate-500 text-sm mt-1">Real-time inventory levels</Text>
          </View>
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
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Asset: Ready for Dispatch</Text>
                  <Text className="text-xs font-semibold text-slate-800 mb-2">Full Cylinders</Text>
                  <Text className="text-5xl font-black font-mono tracking-tighter text-emerald-600 leading-none">
                    {item.current_full}
                  </Text>
                </View>
                <View className="flex flex-col flex-1 border-l border-gray-100 pl-4">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Liability: Awaiting Refill</Text>
                  <Text className="text-xs font-semibold text-slate-800 mb-2">Empty Cylinders</Text>
                  <Text className="text-5xl font-black font-mono tracking-tighter text-amber-500 leading-none">
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

      {/* Floating Action Button */}
      <Pressable 
        onPress={() => setIsModalOpen(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full items-center justify-center shadow-lg active:bg-indigo-700"
      >
        <Settings2 size={24} color="#ffffff" />
      </Pressable>

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
              <View className="z-10">
                <Text className="text-sm font-medium text-slate-700 mb-2">Select Item</Text>
                
                <Pressable 
                  onPress={() => setIsItemDropdownOpen(!isItemDropdownOpen)}
                  className="flex flex-row items-center justify-between w-full rounded-lg border border-gray-300 px-3 py-3 bg-white"
                >
                  <Text className={`text-sm font-medium ${selectedItemId ? 'text-slate-900' : 'text-slate-400'}`}>
                    {selectedItemId 
                      ? inventoryData.find(i => i.id === selectedItemId)?.name 
                      : 'Select an item...'}
                  </Text>
                  <ChevronDown size={16} color="#64748b" />
                </Pressable>

                {isItemDropdownOpen && (
                  <View className="absolute top-[70px] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-md max-h-48 overflow-hidden z-50 elevation-5">
                    <ScrollView nestedScrollEnabled={true}>
                      {inventoryData.map(item => (
                        <Pressable 
                          key={item.id} 
                          onPress={() => {
                            setSelectedItemId(item.id);
                            setIsItemDropdownOpen(false);
                          }}
                          className={`px-4 py-3 border-b border-gray-100 active:bg-slate-50 ${selectedItemId === item.id ? 'bg-indigo-50' : ''}`}
                        >
                          <Text className={`text-sm ${selectedItemId === item.id ? 'font-semibold text-indigo-700' : 'text-slate-700'}`}>
                            {item.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View>
                <Text className="text-sm font-medium text-slate-700 mb-2">Adjustment Action</Text>
                <View className="flex flex-row gap-2">
                  <Pressable 
                    onPress={() => setActionType('add')}
                    className={`flex-1 py-2 items-center justify-center rounded-lg border ${actionType === 'add' ? 'bg-emerald-50 border-emerald-600' : 'bg-white border-gray-300'}`}
                  >
                    <Text className={`text-sm font-medium ${actionType === 'add' ? 'text-emerald-700' : 'text-slate-600'}`}>Add Stock</Text>
                  </Pressable>
                  <Pressable 
                    onPress={() => setActionType('deduct')}
                    className={`flex-1 py-2 items-center justify-center rounded-lg border ${actionType === 'deduct' ? 'bg-rose-50 border-rose-600' : 'bg-white border-gray-300'}`}
                  >
                    <Text className={`text-sm font-medium ${actionType === 'deduct' ? 'text-rose-700' : 'text-slate-600'}`}>Deduct Stock</Text>
                  </Pressable>
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-slate-700 mb-2">Cylinder Type</Text>
                <View className="flex flex-row gap-2">
                  <Pressable 
                    onPress={() => setCylinderType('full')}
                    className={`flex-1 py-2 items-center justify-center rounded-lg border ${cylinderType === 'full' ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-gray-300'}`}
                  >
                    <Text className={`text-sm font-medium ${cylinderType === 'full' ? 'text-indigo-700' : 'text-slate-600'}`}>Full Cylinders</Text>
                  </Pressable>
                  <Pressable 
                    onPress={() => setCylinderType('empty')}
                    className={`flex-1 py-2 items-center justify-center rounded-lg border ${cylinderType === 'empty' ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-gray-300'}`}
                  >
                    <Text className={`text-sm font-medium ${cylinderType === 'empty' ? 'text-indigo-700' : 'text-slate-600'}`}>Empty Cylinders</Text>
                  </Pressable>
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-slate-700 mb-1">Quantity</Text>
                <TextInput 
                  placeholder="0"
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm text-slate-900 font-mono"
                />
              </View>

              <Pressable 
                onPress={handleAdjust}
                disabled={updateItem.isPending || !selectedItemId || !quantity}
                className={`w-full rounded-lg py-3 items-center justify-center mt-2 ${(updateItem.isPending || !selectedItemId || !quantity) ? 'bg-indigo-400' : 'bg-indigo-600'}`}
              >
                <Text className="text-white font-medium text-sm">
                  {updateItem.isPending ? 'Updating...' : 'Confirm Adjustment'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
