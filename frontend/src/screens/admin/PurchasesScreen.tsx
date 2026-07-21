import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Pressable, ScrollView, FlatList, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Plus, X, Search, Store, ArrowLeft, Download, FileText, Receipt, PackageOpen, Truck, RefreshCw } from 'lucide-react-native';
import { usePurchases, useProviders, useCreatePurchase, useCreateProvider, useUpdateProvider } from '../../hooks/usePurchases';
import { useItems } from '../../hooks/useItems';
import type { Provider } from '../../types/api';
import CustomAlert from '../../components/CustomAlert';

export default function PurchasesScreen() {
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const { 
    data: purchasesData = [], 
    isLoading: isPurchasesLoading, 
    refetch: refetchPurchases, 
    isRefetching: isPurchasesRefetching,
    fetchNextPage: fetchNextPurchasesPage,
    hasNextPage: hasNextPurchasesPage,
    isFetchingNextPage: isFetchingNextPurchasesPage
  } = usePurchases();
  const purchases = purchasesData || [];
  
  const { data: providers = [], isLoading: isProvidersLoading, refetch: refetchProviders, isRefetching: isProvidersRefetching } = useProviders();
  const selectedProvider = providers.find(p => p.id === selectedProviderId) || null;

  useFocusEffect(
    useCallback(() => {
      refetchPurchases();
      refetchProviders();
    }, [refetchPurchases, refetchProviders])
  );

  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderPhone, setNewProviderPhone] = useState('');
  const [newProviderGstin, setNewProviderGstin] = useState('');
  const [newProviderPricePerKg, setNewProviderPricePerKg] = useState('');
  const [newProviderFinBal, setNewProviderFinBal] = useState('');
  const [newProviderInventory, setNewProviderInventory] = useState<Record<string, string>>({});

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [billNumber, setBillNumber] = useState('');
  const [itemStates, setItemStates] = useState<Record<string, { fullBought: string; emptyReturned: string }>>({});
  const [amountPaid, setAmountPaid] = useState('');
  const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState(false);
  const [editPricePerKg, setEditPricePerKg] = useState('');

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error' as 'error'|'success'|'info' });

  const showAlert = (title: string, message: string, type: 'error'|'success'|'info' = 'error') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const { data: items = [] } = useItems();
  const createPurchase = useCreatePurchase();
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();

  const handleSaveProvider = () => {
    if (!newProviderName.trim()) return;
    createProvider.mutate(
      { 
        name: newProviderName.trim(), 
        phone: newProviderPhone.trim(),
        gstin: newProviderGstin.trim(),
        price_per_kg: newProviderPricePerKg ? parseFloat(newProviderPricePerKg) : undefined,
        balance_pending: parseFloat(newProviderFinBal) || 0,
        inventory: Object.entries(newProviderInventory)
          .map(([item_id, cylinders_pending]) => ({ item_id, cylinders_pending: parseInt(cylinders_pending) || 0 }))
          .filter(inv => inv.cylinders_pending > 0),
      },
      {
        onSuccess: () => {
          setIsProviderModalOpen(false);
          setNewProviderName('');
          setNewProviderPhone('');
          setNewProviderGstin('');
          setNewProviderPricePerKg('');
          setNewProviderFinBal('');
          setNewProviderInventory({});
        }
      }
    );
  };

  const handleUpdatePrice = () => {
    if (!selectedProvider) return;
    const priceVal = parseFloat(editPricePerKg);
    updateProvider.mutate(
      {
        id: selectedProvider.id,
        data: {
          price_per_kg: isNaN(priceVal) ? undefined : priceVal
        }
      },
      {
        onSuccess: (updated) => {
          setIsEditPriceModalOpen(false);
          // Provider refetch will update selectedProvider automatically
        }
      }
    );
  };

  const calculatedTotalCost = React.useMemo(() => {
    if (!selectedProvider?.price_per_kg) return 0;
    let total = 0;
    Object.entries(itemStates).forEach(([id, state]) => {
      const full = parseInt(state.fullBought) || 0;
      const item = items.find(i => i.id === id);
      if (item && item.capacity_kg) {
        total += selectedProvider.price_per_kg! * item.capacity_kg * full;
      }
    });
    return total;
  }, [itemStates, selectedProvider?.price_per_kg, items]);

  const handleSavePurchase = () => {
    if (!selectedProvider) return;
    
    const itemsPayload = Object.entries(itemStates).map(([id, state]) => {
      const full = parseInt(state.fullBought) || 0;
      const empty = parseInt(state.emptyReturned) || 0;
      if (full === 0 && empty === 0) return null;
      
      const item = items.find(i => i.id === id);
      const cost = (selectedProvider.price_per_kg || 0) * (item?.capacity_kg || 0) * full;
      
      return {
        item_id: id,
        full_received: full,
        empty_returned: empty,
        total_cost: cost
      };
    }).filter(Boolean) as any[];

    if (itemsPayload.length === 0) return;

    for (const payload of itemsPayload) {
      const item = items.find(i => i.id === payload.item_id);
      if (item && payload.empty_returned > (item.current_empty || 0)) {
        showAlert("No Stock", `Not enough empty cylinders in warehouse for ${item.name}. Available: ${item.current_empty || 0}`);
        return;
      }
      
      const providerPending = selectedProvider.inventory?.find(inv => inv.item_id === payload.item_id)?.cylinders_pending || 0;
      if (payload.full_received > providerPending) {
        showAlert("Invalid", `Provider only holds ${providerPending} empty cylinders of ${item?.name || 'this item'} pending refill.`);
        return;
      }
    }

    createPurchase.mutate({
      provider_id: selectedProvider.id,
      bill_number: billNumber.trim() || undefined,
      total_cost: calculatedTotalCost,
      amount_paid: parseFloat(amountPaid) || 0,
      items: itemsPayload
    }, {
      onSuccess: () => {
        setIsPurchaseModalOpen(false);
        setBillNumber('');
        setItemStates({});
        setAmountPaid('');
      }
    });
  };

  const getItemName = (id: string) => items.find(i => i.id === id)?.name || id.split('-')[0];

  const getItemsSummary = (entries: any[]) => {
    if (!entries || entries.length === 0) return 'No items';
    return entries.map(e => {
      const name = getItemName(e.item_id);
      return `${e.full_received}x ${name}`;
    }).join(', ');
  };

  const renderPurchaseRow = ({ item }: { item: typeof purchases[0] }) => (
    <View className="flex flex-row items-center border-b border-gray-100 bg-white min-h-[64px]">
      <View className="w-32 px-4 py-4 flex flex-col justify-center">
        <Text className="font-medium text-slate-900 text-sm">{new Date(item.created_at || Date.now()).toLocaleDateString()}</Text>
      </View>
      <View className="w-32 px-4 py-4 flex flex-col justify-center">
        <Text className="font-mono text-slate-700 text-sm">{item.bill_number || '-'}</Text>
      </View>
      <View className="w-56 px-4 py-4 justify-center">
        <Text className="text-sm font-medium text-slate-700" numberOfLines={2}>{getItemsSummary(item.entries)}</Text>
      </View>
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
              onPress={() => setSelectedProviderId(null)}
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
          
          <View className="flex-1 bg-white rounded-xl border border-gray-200 p-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Empty Cylinders</Text>
              <Store size={18} color="#f59e0b" />
            </View>
            <View className="flex-row flex-wrap gap-2 mt-1">
              {selectedProvider.inventory && selectedProvider.inventory.length > 0 ? (
                selectedProvider.inventory.map(inv => {
                  const itemDetails = items.find(i => i.id === inv.item_id);
                  if (inv.cylinders_pending === 0) return null; // Don't show 0 items
                  return (
                    <View key={inv.item_id} className="flex-row items-center bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 shadow-sm">
                      <Text className="text-base font-bold text-amber-700 mr-1.5">{inv.cylinders_pending}</Text>
                      <Text className="text-xs font-bold text-amber-600 uppercase tracking-wide">{itemDetails?.name || 'Item'}</Text>
                    </View>
                  );
                })
              ) : (
                <Text className="text-sm text-slate-400 font-medium">No pending empties</Text>
              )}
            </View>
          </View>
        </View>

        <View className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Custom Pricing Tier</Text>
            <Text className="text-lg font-bold text-slate-900">
              {selectedProvider.price_per_kg ? `₹${selectedProvider.price_per_kg} / kg` : 'Standard Pricing'}
            </Text>
          </View>
          <Pressable 
            onPress={() => {
              setEditPricePerKg(selectedProvider.price_per_kg ? selectedProvider.price_per_kg.toString() : '');
              setIsEditPriceModalOpen(true);
            }}
            className="bg-indigo-50 px-4 py-2 rounded-lg active:bg-indigo-100"
          >
            <Text className="text-indigo-700 font-bold text-sm">Update Price</Text>
          </Pressable>
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
                <Text className="w-32 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill No</Text>
                <Text className="w-56 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</Text>
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
                  onEndReached={() => {
                    if (hasNextPurchasesPage && !isFetchingNextPurchasesPage) {
                      fetchNextPurchasesPage();
                    }
                  }}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={isFetchingNextPurchasesPage ? <ActivityIndicator className="my-4" /> : null}
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
                <View className="mb-2">
                  <Text className="text-sm font-medium text-slate-700 mb-1">Purchase Bill Number (Optional)</Text>
                  <TextInput 
                    placeholder="e.g. INV-2026-9042"
                    value={billNumber}
                    onChangeText={setBillNumber}
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm text-slate-900"
                  />
                </View>
                
                <View className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 max-h-64">
                  <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                    <View className="flex flex-row px-3 py-2 bg-gray-100 border-b border-gray-200">
                      <Text className="flex-1 text-xs font-semibold text-gray-500 uppercase">Item Name</Text>
                      <Text className="w-20 text-center text-xs font-semibold text-gray-500 uppercase">Full In</Text>
                      <Text className="w-20 text-center text-xs font-semibold text-gray-500 uppercase">Empty Out</Text>
                    </View>
                    {items.map((item, index) => {
                      const state = itemStates[item.id] || { fullBought: '', emptyReturned: '' };
                      const isLast = index === items.length - 1;
                      return (
                        <View key={item.id} className={`flex flex-row items-center px-3 py-2 ${!isLast ? 'border-b border-gray-200' : ''}`}>
                          <Text className="flex-1 text-sm font-medium text-slate-700">{item.name}</Text>
                          <TextInput 
                            placeholder="0"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={state.fullBought}
                            onChangeText={(val) => setItemStates(prev => ({ ...prev, [item.id]: { ...state, fullBought: val } }))}
                            className="w-16 h-10 p-1 bg-white border border-gray-300 rounded text-center text-sm font-mono mx-2 text-slate-900"
                          />
                          <TextInput 
                            placeholder="0"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={state.emptyReturned}
                            onChangeText={(val) => setItemStates(prev => ({ ...prev, [item.id]: { ...state, emptyReturned: val } }))}
                            className="w-16 h-10 p-1 bg-white border border-gray-300 rounded text-center text-sm font-mono text-slate-900"
                          />
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>

                <View className="flex flex-row gap-3 pt-2">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Grand Total (₹)</Text>
                    <View className="w-full rounded-lg bg-gray-100 border-gray-200 border px-3 py-2">
                      <Text className="text-sm text-slate-700 font-mono font-bold">{calculatedTotalCost.toLocaleString()}</Text>
                    </View>
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
                  disabled={createPurchase.isPending || calculatedTotalCost === 0}
                  className="w-full rounded-lg py-3 items-center justify-center mt-2"
                  style={{ backgroundColor: (createPurchase.isPending || calculatedTotalCost === 0) ? '#a5b4fc' : '#4f46e5' }}
                >
                  <Text className="text-white font-medium text-sm">
                    {createPurchase.isPending ? 'Saving...' : 'Save Purchase Bill'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Edit Price Modal */}
        <Modal animationType="fade" transparent={true} visible={isEditPriceModalOpen} onRequestClose={() => setIsEditPriceModalOpen(false)}>
          <View className="flex-1 items-center justify-center p-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
            <View className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
              <View className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                <Text className="text-lg font-bold text-slate-900">Custom Price / Kg</Text>
                <Pressable onPress={() => setIsEditPriceModalOpen(false)} className="p-1 rounded-full bg-slate-100">
                  <X size={20} color="#64748b" />
                </Pressable>
              </View>
              
              <View className="p-6">
                <Text className="text-sm text-slate-500 mb-4">
                  Set a custom pricing rate for <Text className="font-bold text-slate-700">{selectedProvider.name}</Text>. Leave blank to use standard pricing.
                </Text>
                
                <View className="mb-4">
                  <Text className="text-sm font-medium text-slate-700 mb-1">Price per Kg (₹)</Text>
                  <TextInput 
                    placeholder="e.g. 55.50"
                    keyboardType="numeric"
                    value={editPricePerKg}
                    onChangeText={setEditPricePerKg}
                    className="w-full rounded-lg border-gray-300 border px-4 py-3 text-sm text-slate-900 font-mono"
                  />
                </View>
                
                <Pressable 
                  onPress={handleUpdatePrice}
                  disabled={updateProvider.isPending}
                  className="w-full rounded-lg py-3 items-center justify-center bg-indigo-600"
                >
                  <Text className="text-white font-medium text-sm">
                    {updateProvider.isPending ? 'Saving...' : 'Save Custom Price'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <CustomAlert 
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => setAlertVisible(false)}
        />
      </View>
    );
  }

  // --- Main Provider List View ---
  return (
    <View className="flex-1 bg-gray-50 p-4 pt-12">
      <View className="flex flex-row justify-between items-start mb-6">
        <View className="flex-1 mr-4">
          <Text className="text-2xl font-semibold text-slate-900">Providers</Text>
          <Text className="text-slate-500 text-sm mt-1">Manage suppliers, purchases, and outstanding balances.</Text>
        </View>
        <Pressable 
          onPress={() => {
            refetchProviders();
            refetchPurchases();
          }}
          disabled={isProvidersRefetching || isPurchasesRefetching}
          className="p-2.5 bg-white border border-gray-200 rounded-xl active:bg-slate-50 shadow-sm"
          style={{ opacity: (isProvidersRefetching || isPurchasesRefetching) ? 0.5 : 1 }}
        >
          <RefreshCw size={20} color="#475569" />
        </Pressable>
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
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => setSelectedProviderId(item.id)}
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
                      {item.inventory?.length > 0
                        ? item.inventory.map(inv => {
                            const iName = items.find(i => i.id === inv.item_id)?.name || 'Cyl';
                            return `${inv.cylinders_pending}x ${iName}`;
                          }).join(', ')
                        : '0 Empties'}
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
                <Text className="text-sm font-bold text-slate-700 mb-1">GSTIN</Text>
                <TextInput 
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  autoCapitalize="characters"
                  value={newProviderGstin}
                  onChangeText={setNewProviderGstin}
                  className="w-full rounded-xl border-gray-300 border px-4 py-3 text-sm text-slate-900 bg-slate-50 uppercase"
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
              <View>
                <Text className="text-sm font-bold text-slate-700 mb-1">Price per Kg (Optional)</Text>
                <TextInput 
                  placeholder="e.g. 55.50"
                  keyboardType="numeric"
                  value={newProviderPricePerKg}
                  onChangeText={setNewProviderPricePerKg}
                  className="w-full rounded-xl border-gray-300 border px-4 py-3 text-sm text-slate-900 bg-slate-50"
                />
              </View>
              <View className="flex flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-700 mb-1">Initial Fin Bal</Text>
                  <TextInput 
                    placeholder="e.g. 5000"
                    keyboardType="numeric"
                    value={newProviderFinBal}
                    onChangeText={setNewProviderFinBal}
                    className="w-full rounded-xl border-gray-300 border px-4 py-3 text-sm text-slate-900 bg-slate-50"
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-sm font-bold text-slate-700 mb-1">Initial Empties</Text>
                  {items.map(item => (
                    <View key={item.id} className="flex flex-row items-center justify-between mb-2">
                      <Text className="text-xs text-slate-600 w-1/2" numberOfLines={1}>{item.name}</Text>
                      <TextInput 
                        value={newProviderInventory[item.id] || ''} 
                        onChangeText={(val) => setNewProviderInventory(prev => ({...prev, [item.id]: val}))} 
                        keyboardType="numeric" 
                        placeholder="0" 
                        className="w-1/2 rounded-xl border-gray-300 border px-3 py-1.5 text-xs text-slate-900 bg-slate-50 font-mono" 
                      />
                    </View>
                  ))}
                </View>
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

      <CustomAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
}
