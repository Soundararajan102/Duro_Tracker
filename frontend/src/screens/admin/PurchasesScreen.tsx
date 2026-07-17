import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, FlatList, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Plus, X, Search, Store, ArrowLeft, Download, FileText, Receipt, PackageOpen, Truck } from 'lucide-react-native';
import { usePurchases, useProviders, useCreatePurchase, useCreateProvider } from '../../hooks/usePurchases';
import { useItems } from '../../hooks/useItems';
import type { Provider } from '../../types/api';

export default function PurchasesScreen() {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderPhone, setNewProviderPhone] = useState('');

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [itemId, setItemId] = useState('');
  const [fullBought, setFullBought] = useState('');
  const [emptyReturned, setEmptyReturned] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  const { data: purchases = [], isLoading: isPurchasesLoading } = usePurchases();
  const { data: providers = [], isLoading: isProvidersLoading } = useProviders();
  const { data: items = [] } = useItems();
  const createPurchase = useCreatePurchase();
  const createProvider = useCreateProvider();

  const handleSaveProvider = () => {
    if (!newProviderName.trim()) return;
    createProvider.mutate(
      { name: newProviderName.trim(), phone: newProviderPhone.trim() },
      {
        onSuccess: () => {
          setIsProviderModalOpen(false);
          setNewProviderName('');
          setNewProviderPhone('');
        }
      }
    );
  };

  const handleSavePurchase = () => {
    if (!selectedProvider || !itemId) return;
    createPurchase.mutate({
      provider_id: selectedProvider.id,
      item_id: itemId,
      full_received: parseInt(fullBought) || 0,
      empty_returned: parseInt(emptyReturned) || 0,
      total_cost: parseFloat(totalCost) || 0,
      amount_paid: parseFloat(amountPaid) || 0,
    }, {
      onSuccess: () => {
        setIsPurchaseModalOpen(false);
        setItemId('');
        setFullBought('');
        setEmptyReturned('');
        setTotalCost('');
        setAmountPaid('');
      }
    });
  };

  const getItemName = (id: string) => items.find(i => i.id === id)?.name || id.split('-')[0];

  const renderPurchaseRow = ({ item }: { item: typeof purchases[0] }) => (
    <View className="flex flex-row items-center border-b border-gray-100 bg-white">
      <View className="w-32 px-4 py-4 flex flex-col justify-center">
        <Text className="font-medium text-slate-900 text-sm">{new Date(item.created_at || Date.now()).toLocaleDateString()}</Text>
      </View>
      <View className="w-40 px-4 py-4 justify-center">
        <Text className="text-sm font-medium text-slate-700" numberOfLines={1}>{getItemName(item.item_id)}</Text>
      </View>
      <Text className="w-24 px-4 py-4 text-center font-mono text-sm text-emerald-600 font-bold">+{item.full_received}</Text>
      <Text className="w-24 px-4 py-4 text-center font-mono text-sm text-amber-500 font-bold">-{item.empty_returned}</Text>
      <View className="w-32 px-4 py-4 flex flex-col justify-center items-end">
        <Text className="font-mono text-sm text-slate-900 font-bold">₹{item.total_cost.toLocaleString()}</Text>
        {item.amount_paid > 0 && <Text className="font-mono text-[11px] text-emerald-600 mt-0.5">Paid ₹{item.amount_paid.toLocaleString()}</Text>}
      </View>
    </View>
  );

  const renderProviderCRM = () => {
    if (!selectedProvider) return null;
    
    // Filter purchases for this provider
    const providerPurchases = purchases.filter(p => p.provider_id === selectedProvider.id);

    return (
      <View className="flex-1 pb-20">
        <View className="flex flex-row items-center justify-between mb-6 mt-2">
          <View className="flex flex-row items-center gap-4">
            <Pressable 
              onPress={() => setSelectedProvider(null)}
              className="p-2 bg-white border border-gray-200 rounded-lg"
            >
              <ArrowLeft size={20} color="#475569" />
            </Pressable>
            <View>
              <Text className="text-xl font-bold text-slate-900">{selectedProvider.name}</Text>
              <Text className="text-sm text-slate-500">{selectedProvider.phone || 'No phone'}</Text>
            </View>
          </View>
          <Pressable 
            onPress={() => setIsPurchaseModalOpen(true)}
            className="flex flex-row items-center justify-center gap-2 px-4 h-10 bg-indigo-600 rounded-lg"
          >
            <Plus size={16} color="#ffffff" />
            <Text className="text-white text-sm font-medium">Record Purchase</Text>
          </Pressable>
        </View>

        <View className="flex flex-row gap-4 mb-6">
          <View className="flex-1 bg-white rounded-xl border border-gray-200 p-4 flex flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Outstanding</Text>
              <Text className="text-xl font-mono tracking-tight font-bold" style={{ color: selectedProvider.balance_pending > 0 ? '#e11d48' : '#059669' }}>
                {selectedProvider.balance_pending > 0 ? `₹${selectedProvider.balance_pending.toLocaleString()} Due` : `₹${Math.abs(selectedProvider.balance_pending).toLocaleString()} Adv`}
              </Text>
            </View>
            <View className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
              <Receipt size={20} color="#94a3b8" />
            </View>
          </View>
          
          <View className="flex-1 bg-white rounded-xl border border-gray-200 p-4 flex flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Empty Cylinders</Text>
              <Text className="text-xl font-mono tracking-tight font-bold text-amber-600">
                {selectedProvider.cylinders_pending} <Text className="text-sm text-amber-400 font-medium">Pending</Text>
              </Text>
            </View>
            <View className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Store size={20} color="#f59e0b" />
            </View>
          </View>
        </View>

        <View className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6 flex-1">
          <View className="px-4 py-4 border-b border-gray-200 bg-gray-50 flex flex-row items-center justify-between">
            <Text className="font-semibold text-slate-900">Purchase History</Text>
            <Text className="text-xs font-medium text-slate-500">{providerPurchases.length} Records</Text>
          </View>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} className="flex-1">
            <View className="flex flex-col">
              <View className="flex flex-row bg-white border-b border-gray-200">
                <Text className="w-32 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</Text>
                <Text className="w-40 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</Text>
                <Text className="w-24 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Full In</Text>
                <Text className="w-24 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Empty Out</Text>
                <Text className="w-32 px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost/Paid</Text>
              </View>
              {providerPurchases.length === 0 ? (
                <View className="p-8 items-center justify-center w-full min-w-[500px]">
                  <Text className="text-slate-400 text-sm">No purchases recorded yet.</Text>
                </View>
              ) : (
                <FlatList
                  data={providerPurchases}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderPurchaseRow}
                  scrollEnabled={false}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  if (selectedProvider) {
    return (
      <View className="flex-1 bg-gray-50 p-4 pt-12">
        {renderProviderCRM()}
        
        {/* Record Purchase Modal (Scoped to Provider) */}
        <Modal animationType="fade" transparent={true} visible={isPurchaseModalOpen} onRequestClose={() => setIsPurchaseModalOpen(false)}>
          <View className="flex-1 items-center justify-center p-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
            <View className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
              <View className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200 bg-indigo-50">
                <View>
                  <Text className="text-lg font-semibold text-slate-900">Record Purchase</Text>
                  <Text className="text-xs font-medium text-indigo-700 mt-0.5">{selectedProvider.name}</Text>
                </View>
                <Pressable onPress={() => setIsPurchaseModalOpen(false)} className="p-1 rounded-full bg-white border border-indigo-100">
                  <X size={20} color="#4f46e5" />
                </Pressable>
              </View>
              
              <View className="p-6 flex flex-col gap-4">
                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-1">Select Item</Text>
                  {/* Custom Picker Alternative for styling (using a simple mapping or default RN picker if not using a library) */}
                  {/* Since RN doesn't have a native styled picker, we will create a mini scroll list or simple buttons for items */}
                  <View className="flex flex-row flex-wrap gap-2">
                    {items.map(item => (
                      <Pressable 
                        key={item.id} 
                        onPress={() => setItemId(item.id)}
                        className="px-3 py-2 rounded-lg border"
                        style={itemId === item.id ? { backgroundColor: '#eef2ff', borderColor: '#4f46e5' } : { backgroundColor: '#ffffff', borderColor: '#d1d5db' }}
                      >
                        <Text className="text-xs font-medium" style={{ color: itemId === item.id ? '#4338ca' : '#334155' }}>
                          {item.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="flex flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Full Bought</Text>
                    <TextInput 
                      placeholder="0"
                      keyboardType="numeric"
                      value={fullBought}
                      onChangeText={setFullBought}
                      className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm text-slate-900 font-mono"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Empty Returned</Text>
                    <TextInput 
                      placeholder="0"
                      keyboardType="numeric"
                      value={emptyReturned}
                      onChangeText={setEmptyReturned}
                      className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm text-slate-900 font-mono"
                    />
                  </View>
                </View>

                <View className="flex flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Total Cost (₹)</Text>
                    <TextInput 
                      placeholder="0.00"
                      keyboardType="numeric"
                      value={totalCost}
                      onChangeText={setTotalCost}
                      className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm text-slate-900 font-mono"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Amount Paid (₹)</Text>
                    <TextInput 
                      placeholder="0.00"
                      keyboardType="numeric"
                      value={amountPaid}
                      onChangeText={setAmountPaid}
                      className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm text-slate-900 font-mono"
                    />
                  </View>
                </View>

                <Pressable 
                  onPress={handleSavePurchase}
                  disabled={createPurchase.isPending || !itemId}
                  className="w-full rounded-lg py-3 items-center justify-center mt-2"
                  style={{ backgroundColor: (createPurchase.isPending || !itemId) ? '#a5b4fc' : '#4f46e5' }}
                >
                  <Text className="text-white font-medium text-sm">
                    {createPurchase.isPending ? 'Saving...' : 'Save Purchase'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // --- Main Provider List View ---
  return (
    <View className="flex-1 bg-gray-50 p-4 pt-12">
      <View className="flex flex-col sm:flex-row mb-6">
        <View className="flex-1 mb-4 sm:mb-0">
          <Text className="text-2xl font-semibold text-slate-900">Providers</Text>
          <Text className="text-slate-500 text-sm mt-1">Manage suppliers, purchases, and outstanding balances.</Text>
        </View>
      </View>

      <View className="flex flex-row items-center justify-between mb-4">
        <View className="flex-1 bg-white border border-gray-300 rounded-lg flex flex-row items-center px-3 h-10">
          <Search size={16} color="#94a3b8" />
          <TextInput 
            placeholder="Search providers..." 
            className="flex-1 ml-2 text-sm text-slate-900"
          />
        </View>
      </View>

      <View className="border border-gray-200 rounded-2xl bg-white overflow-hidden flex-1">
        {isProvidersLoading ? (
          <View className="p-8 items-center justify-center">
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : (
          <FlatList
            data={providers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => setSelectedProvider(item)}
                className="flex flex-row items-center border-b border-gray-100 p-4 active:bg-slate-50"
              >
                <View className="w-12 h-12 bg-indigo-50 rounded-full items-center justify-center mr-4">
                  <Truck size={24} color="#4f46e5" />
                </View>
                <View className="flex-1 flex flex-col justify-center gap-1">
                  <Text className="text-base font-bold text-slate-900 tracking-tight">{item.name}</Text>
                  <View className="flex flex-row items-center gap-2">
                    <Text className="text-xs font-bold" style={{ color: item.balance_pending > 0 ? '#e11d48' : '#059669' }}>
                      {item.balance_pending > 0 ? `₹${item.balance_pending.toLocaleString()} Due` : `₹${Math.abs(item.balance_pending).toLocaleString()} Adv`}
                    </Text>
                    <View className="w-1 h-1 rounded-full bg-slate-300" />
                    <Text className="text-xs font-bold text-amber-600">
                      {item.cylinders_pending} Empties Pending
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={() => (
              <View className="p-8 items-center justify-center">
                <Store size={32} color="#cbd5e1" className="mb-2" />
                <Text className="text-slate-500 font-medium">No providers found</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <Pressable 
        onPress={() => setIsProviderModalOpen(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full items-center justify-center active:bg-indigo-700"
      >
        <Plus size={24} color="#ffffff" />
      </Pressable>

      {/* Add Provider Modal */}
      <Modal animationType="fade" transparent={true} visible={isProviderModalOpen} onRequestClose={() => setIsProviderModalOpen(false)}>
        <View className="flex-1 items-center justify-center p-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
          <View className="bg-white rounded-[24px] shadow-xl w-full max-w-sm overflow-hidden">
            <View className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <Text className="text-lg font-bold text-slate-900">Add Provider</Text>
              <Pressable onPress={() => setIsProviderModalOpen(false)} className="p-1.5 rounded-full bg-slate-100">
                <X size={18} color="#64748b" />
              </Pressable>
            </View>
            
            <View className="p-6 flex flex-col gap-4">
              <View>
                <Text className="text-sm font-bold text-slate-700 mb-1">Provider Name</Text>
                <TextInput 
                  placeholder="e.g. ABC Gas Agency"
                  value={newProviderName}
                  onChangeText={setNewProviderName}
                  className="w-full rounded-xl border-gray-300 border px-4 py-3 text-sm text-slate-900 bg-slate-50"
                />
              </View>
              <View>
                <Text className="text-sm font-bold text-slate-700 mb-1">Phone Number</Text>
                <TextInput 
                  placeholder="e.g. 9876543210"
                  keyboardType="phone-pad"
                  value={newProviderPhone}
                  onChangeText={setNewProviderPhone}
                  className="w-full rounded-xl border-gray-300 border px-4 py-3 text-sm text-slate-900 bg-slate-50"
                />
              </View>

              <Pressable 
                onPress={handleSaveProvider}
                disabled={createProvider.isPending || !newProviderName.trim()}
                className="w-full rounded-xl py-3.5 items-center justify-center mt-2"
                style={{ backgroundColor: (createProvider.isPending || !newProviderName.trim()) ? '#a5b4fc' : '#4f46e5' }}
              >
                <Text className="text-white font-bold text-sm">
                  {createProvider.isPending ? 'Saving...' : 'Save Provider'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
