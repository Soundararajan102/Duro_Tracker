import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, FlatList, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Plus, X, ShoppingCart, Truck } from 'lucide-react-native';
import { usePurchases, useProviders, useCreatePurchase } from '../../hooks/usePurchases';
import { useItems } from '../../hooks/useItems';

export default function PurchasesScreen() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [providerId, setProviderId] = useState('');
  const [itemId, setItemId] = useState('');
  const [fullBought, setFullBought] = useState('');
  const [emptyReturned, setEmptyReturned] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  const { data: purchases = [], isLoading: isPurchasesLoading } = usePurchases();
  const { data: providers = [], isLoading: isProvidersLoading } = useProviders();
  const { data: items = [] } = useItems();
  const createPurchase = useCreatePurchase();

  const handleSave = () => {
    if (!providerId || !itemId) return;
    createPurchase.mutate({
      provider_id: providerId,
      item_id: itemId,
      full_received: parseInt(fullBought) || 0,
      empty_returned: parseInt(emptyReturned) || 0,
      total_cost: parseFloat(totalCost) || 0,
      amount_paid: parseFloat(amountPaid) || 0,
    }, {
      onSuccess: () => {
        setIsModalOpen(false);
        setProviderId('');
        setItemId('');
        setFullBought('');
        setEmptyReturned('');
        setTotalCost('');
        setAmountPaid('');
      }
    });
  };

  const getProviderName = (id: string) => providers.find(p => p.id === id)?.name || id.split('-')[0];
  const getItemName = (id: string) => items.find(i => i.id === id)?.name || id.split('-')[0];

  const totalPurchased = purchases.reduce((acc, p) => acc + Number(p.total_cost), 0);
  const balanceOwed = providers.reduce((acc, p) => acc + Number(p.balance_pending), 0);
  const providersOwedCount = providers.filter(p => Number(p.balance_pending) > 0).length;

  const renderTableRow = ({ item }: { item: typeof purchases[0] }) => (
    <View className="flex flex-row items-center border-b border-gray-100 bg-white">
      <Text className="w-28 px-4 py-4 text-sm text-slate-500">Recorded</Text>
      <Text className="w-40 px-4 py-4 font-medium text-slate-900">{getProviderName(item.provider_id)}</Text>
      <View className="w-40 px-4 py-4">
        <View className="bg-slate-100 rounded-md px-2 py-1 self-start">
          <Text className="text-xs font-medium text-slate-700">{getItemName(item.item_id)}</Text>
        </View>
      </View>
      <Text className="w-24 px-4 py-4 text-center font-mono font-medium text-emerald-600">+{item.full_received}</Text>
      <Text className="w-28 px-4 py-4 text-center font-mono font-medium text-amber-600">-{item.empty_returned}</Text>
      <Text className="w-28 px-4 py-4 text-right font-mono text-slate-900 font-medium">₹{Number(item.total_cost).toLocaleString()}</Text>
      <Text className="w-28 px-4 py-4 text-right font-mono text-slate-600">₹{Number(item.amount_paid).toLocaleString()}</Text>
      <Text className={`w-28 px-4 py-4 text-right font-mono font-bold ${(Number(item.total_cost) - Number(item.amount_paid)) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
        ₹{(Number(item.total_cost) - Number(item.amount_paid)).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50 p-4 pt-12">
      <View className="flex flex-col sm:flex-row mb-6">
        <View className="flex-1 mb-4 sm:mb-0">
          <Text className="text-2xl font-semibold text-slate-900">Inbound Purchases</Text>
          <Text className="text-slate-500 text-sm mt-1">Track inventory acquisitions and vendor balances.</Text>
        </View>
        <Pressable 
          onPress={() => setIsModalOpen(true)}
          className="flex flex-row items-center justify-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg shadow-sm"
        >
          <Plus size={16} color="#ffffff" />
          <Text className="text-white text-sm font-medium">Record Purchase</Text>
        </Pressable>
      </View>

      <View className="flex flex-row gap-4 mb-6">
        <View className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-4 relative overflow-hidden">
          <View className="flex flex-row items-center gap-2 mb-3">
            <Truck size={18} color="#4f46e5" />
            <Text className="text-slate-500 font-medium text-xs tracking-wide uppercase">Total Purchased</Text>
          </View>
          <Text className="text-2xl font-bold text-slate-900 font-mono tracking-tight">₹{totalPurchased.toLocaleString()}</Text>
        </View>

        <View className="flex-1 bg-white rounded-xl border border-rose-200 shadow-sm p-4 relative overflow-hidden">
          <View className="flex flex-row items-center gap-2 mb-3">
            <ShoppingCart size={18} color="#e11d48" />
            <Text className="text-slate-500 font-medium text-xs tracking-wide uppercase">Balance Owed</Text>
          </View>
          <Text className="text-2xl font-bold text-rose-600 font-mono tracking-tight">₹{balanceOwed.toLocaleString()}</Text>
          <Text className="mt-1 text-xs font-medium text-rose-600">Across {providersOwedCount} vendors</Text>
        </View>
      </View>

      <View className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-20">
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
          <View className="flex flex-col">
            <View className="flex flex-row bg-gray-50 border-b border-gray-200">
              <Text className="w-28 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</Text>
              <Text className="w-40 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</Text>
              <Text className="w-40 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</Text>
              <Text className="w-24 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Full In</Text>
              <Text className="w-28 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Empty Out</Text>
              <Text className="w-28 px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</Text>
              <Text className="w-28 px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid</Text>
              <Text className="w-28 px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</Text>
            </View>
            
            {isPurchasesLoading ? (
              <ActivityIndicator size="large" color="#4f46e5" className="m-8" />
            ) : (
              <FlatList
                data={purchases}
                renderItem={renderTableRow}
                keyExtractor={item => item.id.toString()}
                showsVerticalScrollIndicator={true}
              />
            )}
          </View>
        </ScrollView>
      </View>

      <Modal animationType="fade" transparent={true} visible={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <View className="flex-1 items-center justify-center p-4 bg-slate-900/50">
          <View className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <View className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-slate-900">Record Purchase</Text>
              <Pressable onPress={() => setIsModalOpen(false)} className="p-1 rounded-full">
                <X size={20} color="#94a3b8" />
              </Pressable>
            </View>
            
            <View className="p-6 flex flex-col gap-3">
              <View>
                <Text className="text-sm font-medium text-slate-700 mb-1">Provider ID</Text>
                <TextInput 
                  placeholder="UUID of Provider"
                  value={providerId}
                  onChangeText={setProviderId}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm text-slate-900"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-slate-700 mb-1">Item ID</Text>
                <TextInput 
                  placeholder="UUID of Item"
                  value={itemId}
                  onChangeText={setItemId}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm text-slate-900"
                />
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
                  <Text className="text-sm font-medium text-slate-700 mb-1">Empty Out</Text>
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
                onPress={handleSave}
                disabled={createPurchase.isPending}
                className={`w-full rounded-lg py-2.5 items-center justify-center mt-3 ${createPurchase.isPending ? 'bg-indigo-400' : 'bg-indigo-600'}`}
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
