import React, { useState, useMemo, useLayoutEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CustomAlert from '../../components/CustomAlert';
import PrinterSettingsModal from '../../components/PrinterSettingsModal';
import { usePrinterStore } from '../../store/printer-store';
import { DeliveryReceiptData, DeliveryReceiptItem } from '../../utils/printer';
import { useReceiptImagePrintJob } from '../../hooks/use-receipt-image-print-job';


interface Item { id: string; name: string; price: number; capacity_kg?: number; current_full?: number; current_empty?: number; }
interface BuyerInventory { item_id: string; cylinders_pending: number; }
interface Buyer { id: string; name: string; price_per_kg?: number; balance_pending?: number; address?: string; inventory?: BuyerInventory[]; }

interface CartItem {
  item: Item;
  fullDelivered: number;
  emptyReceived: number;
  unitPrice: number;
  lineTotal: number;
}

export default function DeliveryScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [buyerId, setBuyerId] = useState('');
  
  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [itemId, setItemId] = useState('');
  const [fullDelivered, setFullDelivered] = useState('');
  const [emptyReceived, setEmptyReceived] = useState('');
  
  const [cashCollected, setCashCollected] = useState('');
  const [upiCollected, setUpiCollected] = useState('');
  
  // Modals state
  const [buyerModalVisible, setBuyerModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [printerModalVisible, setPrinterModalVisible] = useState(false);
  
  // Date Time state
  const [billDate, setBillDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error' as 'error'|'success'|'info' });

  const showAlert = (title: string, message: string, type: 'error'|'success'|'info' = 'error') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const { receiptImagePrintBridge, startReceiptImagePrintJob } = useReceiptImagePrintJob();

  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    Date.now().toString(36) + Math.random().toString(36).substring(2)
  );

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['driver_items'] });
    queryClient.invalidateQueries({ queryKey: ['driver_buyers'] });
  }, [queryClient]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setPrinterModalVisible(true)} className="mr-4 p-2 bg-zinc-100 rounded-full">
            <Ionicons name="print-outline" size={20} color="#52525b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRefresh} className="mr-4 p-2 bg-zinc-100 rounded-full">
            <Ionicons name="refresh-outline" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} className="mr-4 p-2">
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, logout, handleRefresh]);

  const { data: items, isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ['driver_items'],
    queryFn: async () => {
      const res = await api.get('/driver/items');
      return res.data;
    }
  });

  const { data: buyers, isLoading: buyersLoading } = useQuery<Buyer[]>({
    queryKey: ['driver_buyers'],
    queryFn: async () => {
      const res = await api.get('/driver/buyers');
      return res.data;
    }
  });

  const selectedBuyer = useMemo(() => buyers?.find(b => b.id === buyerId), [buyers, buyerId]);
  const selectedItem = useMemo(() => items?.find(i => i.id === itemId), [items, itemId]);

  const getUnitPrice = (item: Item) => {
    let unitPrice = item.price;
    if (selectedBuyer && selectedBuyer.price_per_kg && item.capacity_kg) {
      unitPrice = selectedBuyer.price_per_kg * item.capacity_kg;
    }
    return unitPrice;
  };

  const handleAddToCart = () => {
    if (!selectedItem) {
      showAlert("Required", "Please select an item.", "info");
      return;
    }
    const full = parseInt(fullDelivered || '0');
    const empty = parseInt(emptyReceived || '0');
    if (full === 0 && empty === 0) {
      showAlert("Required", "Please enter either full delivered or empty received.", "info");
      return;
    }

    const existingFullInCart = cartItems.filter(c => c.item.id === selectedItem.id).reduce((sum, c) => sum + c.fullDelivered, 0);
    const existingEmptyInCart = cartItems.filter(c => c.item.id === selectedItem.id).reduce((sum, c) => sum + c.emptyReceived, 0);

    const availableFull = selectedItem.current_full || 0;
    if (existingFullInCart + full > availableFull) {
      showAlert("No Stock", `Not enough full cylinders in warehouse. Available: ${availableFull}`, "error");
      return;
    }

    const buyerPending = selectedBuyer?.inventory?.find(i => i.item_id === selectedItem.id)?.cylinders_pending || 0;
    if (existingEmptyInCart + empty > buyerPending) {
      showAlert("Invalid", `Buyer only holds ${buyerPending} empty cylinders of this type.`, "error");
      return;
    }

    const unitPrice = getUnitPrice(selectedItem);
    const lineTotal = parseFloat((unitPrice * full).toFixed(2));

    setCartItems(prev => [...prev, {
      item: selectedItem,
      fullDelivered: full,
      emptyReceived: empty,
      unitPrice,
      lineTotal
    }]);

    // Reset item form
    setItemId('');
    setFullDelivered('');
    setEmptyReceived('');
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalBill = useMemo(() => {
    return cartItems.reduce((sum, current) => sum + current.lineTotal, 0).toFixed(2);
  }, [cartItems]);

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/driver/entries', payload, {
        headers: { 'X-Idempotency-Key': idempotencyKey }
      });
    },
    onSuccess: (data) => {
      showAlert("Success", "Delivery logged successfully!", "success");
      
      const preferredPrinter = usePrinterStore.getState().preferredPrinter;
      if (preferredPrinter && selectedBuyer && cartItems.length > 0) {
        const cash_paid = parseFloat(cashCollected || '0');
        const upi_paid = parseFloat(upiCollected || '0');
        const opening_balance = selectedBuyer.balance_pending || 0;
        const total = parseFloat(totalBill);
        const closing_balance = opening_balance + total - (cash_paid + upi_paid);

        const receiptItems: DeliveryReceiptItem[] = cartItems.map(c => ({
          name: c.item.name,
          quantity: c.fullDelivered,
          price: c.unitPrice,
          total: c.lineTotal
        }));

        const receiptData: DeliveryReceiptData = {
          receipt_number: data?.data?.bill_number || (data?.data?.id ? data.data.id.split('-')[0].toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase()),
          date: data?.data?.timestamp || new Date().toISOString(),
          agency_name: "Sree Hari Agencies",
          agency_address: "Namakkal",
          buyer_name: selectedBuyer.name,
          buyer_address: selectedBuyer.address || "",
          opening_balance: opening_balance,
          items: receiptItems,
          total_bill: total,
          cash_collected: cash_paid,
          upi_collected: upi_paid,
          closing_balance: closing_balance,
        };
        startReceiptImagePrintJob([receiptData], preferredPrinter).catch(err => {
          showAlert("Print Error", err.message || "Failed to print receipt", "error");
        });
      }

      // Reset form
      setBuyerId('');
      setCartItems([]);
      setItemId('');
      setFullDelivered('');
      setEmptyReceived('');
      setCashCollected('');
      setUpiCollected('');
      setIdempotencyKey(Date.now().toString(36) + Math.random().toString(36).substring(2));
      queryClient.invalidateQueries({ queryKey: ['driver_history'] });
      queryClient.invalidateQueries({ queryKey: ['driver_items'] });
      queryClient.invalidateQueries({ queryKey: ['driver_buyers'] });
    },
    onError: (err: any) => {
      showAlert("Error", err.response?.data?.detail || "Failed to log delivery.", "error");
    }
  });

  if (itemsLoading || buyersLoading) {
    return (
      <View className="flex-1 bg-zinc-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-zinc-50">
      <ScrollView className="p-4 pt-6">
        
        {/* Buyer Selection */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-zinc-100">
          <Text className="text-zinc-500 font-medium mb-2">Select Buyer</Text>
          <TouchableOpacity 
            className="flex-row items-center justify-between bg-zinc-50 border border-zinc-200 p-4 rounded-xl"
            onPress={() => setBuyerModalVisible(true)}
          >
            <Text className="text-lg" style={{ color: buyerId ? '#27272a' : '#a1a1aa' }}>
              {selectedBuyer?.name || 'Tap to select buyer...'}
            </Text>
            <Ionicons name="chevron-down" size={24} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {/* Add Item Form */}
        {buyerId && (
          <View className="bg-white rounded-2xl p-4 mb-4 border border-zinc-100">
            <Text className="text-zinc-500 font-medium mb-2">Add Item to Bill</Text>
            
            <TouchableOpacity 
              className="flex-row items-center justify-between bg-zinc-50 border border-zinc-200 p-4 rounded-xl mb-4"
              onPress={() => setItemModalVisible(true)}
            >
              <Text className="text-lg" style={{ color: itemId ? '#27272a' : '#a1a1aa' }}>
                {selectedItem ? `${selectedItem.name} (₹${getUnitPrice(selectedItem)})` : 'Tap to select item...'}
              </Text>
              <Ionicons name="chevron-down" size={24} color="#a1a1aa" />
            </TouchableOpacity>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-zinc-500 font-medium mb-1">Full Delivered</Text>
                <TextInput
                  className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-lg text-center font-bold"
                  keyboardType="numeric"
                  value={fullDelivered}
                  onChangeText={setFullDelivered}
                  placeholder="0"
                />
              </View>
              <View className="flex-1">
                <Text className="text-zinc-500 font-medium mb-1">Empty Received</Text>
                <TextInput
                  className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-lg text-center font-bold"
                  keyboardType="numeric"
                  value={emptyReceived}
                  onChangeText={setEmptyReceived}
                  placeholder="0"
                />
              </View>
            </View>

            <TouchableOpacity
              className="bg-zinc-800 py-3 rounded-xl items-center"
              onPress={handleAddToCart}
            >
              <Text className="text-white font-medium text-base flex-row items-center">
                <Ionicons name="add" size={20} color="white" /> Add to Cart
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cart Items List */}
        {cartItems.length > 0 && (
          <View className="bg-white rounded-2xl p-4 mb-4 border border-zinc-100">
            <Text className="text-zinc-800 font-semibold text-lg mb-3">Cart Items</Text>
            {cartItems.map((cartItem, index) => (
              <View key={index} className="flex-row justify-between items-center py-3 border-b border-zinc-50">
                <View>
                  <Text className="text-zinc-800 font-medium text-base">{cartItem.item.name}</Text>
                  <Text className="text-zinc-500 text-sm">
                    {cartItem.fullDelivered} Full, {cartItem.emptyReceived} Empty
                  </Text>
                </View>
                <View className="flex-row items-center gap-4">
                  <Text className="text-zinc-800 font-semibold text-base">₹{cartItem.lineTotal}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFromCart(index)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Date and Time Selection */}
        {buyerId && (
          <View className="bg-white rounded-2xl p-4 mb-4 border border-zinc-100">
            <Text className="text-zinc-500 font-medium mb-3">Delivery Date & Time</Text>
            <View className="flex-row gap-4">
              <TouchableOpacity 
                className="flex-1 bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex-row items-center justify-between"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className="text-zinc-800 text-base">{billDate.toLocaleDateString()}</Text>
                <Ionicons name="calendar-outline" size={20} color="#71717a" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex-row items-center justify-between"
                onPress={() => setShowTimePicker(true)}
              >
                <Text className="text-zinc-800 text-base">
                  {billDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
                <Ionicons name="time-outline" size={20} color="#71717a" />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={billDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setBillDate(selectedDate);
                }}
              />
            )}
            
            {showTimePicker && (
              <DateTimePicker
                value={billDate}
                mode="time"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (selectedDate) setBillDate(selectedDate);
                }}
              />
            )}
          </View>
        )}

        {/* Payments */}
        <View className="bg-white rounded-2xl p-4 mb-6 border border-zinc-100 space-y-4">
          <View className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4 flex-row justify-between items-center">
            <Text className="text-blue-800 font-medium text-lg">Total Bill:</Text>
            <Text className="text-blue-900 font-bold text-2xl">₹{totalBill}</Text>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-zinc-500 font-medium mb-1">Cash Collected</Text>
              <TextInput
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-lg text-center"
                keyboardType="numeric"
                value={cashCollected}
                onChangeText={setCashCollected}
                placeholder="₹ 0"
              />
            </View>
            <View className="flex-1">
              <Text className="text-zinc-500 font-medium mb-1">UPI Collected</Text>
              <TextInput
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-lg text-center"
                keyboardType="numeric"
                value={upiCollected}
                onChangeText={setUpiCollected}
                placeholder="₹ 0"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          className="py-4 rounded-xl items-center mb-12"
          style={{ backgroundColor: submitMutation.isPending ? '#60a5fa' : '#2563eb', opacity: cartItems.length === 0 ? 0.5 : 1 }}
          onPress={() => {
            if (!buyerId || cartItems.length === 0) {
              showAlert("Required", "Please select a buyer and add items to cart.");
              return;
            }

            const payloadItems = cartItems.map(c => ({
              item_id: c.item.id,
              full_delivered: c.fullDelivered,
              empty_received: c.emptyReceived
            }));

            submitMutation.mutate({
              buyer_id: buyerId,
              items: payloadItems,
              cash_collected: parseFloat(cashCollected || '0'),
              upi_collected: parseFloat(upiCollected || '0'),
              timestamp: billDate.toISOString()
            });
          }}
          disabled={submitMutation.isPending || cartItems.length === 0}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-semibold flex-row items-center">
              Complete Delivery <Ionicons name="checkmark-circle" size={20} color="white" />
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Buyer Modal */}
      <Modal visible={buyerModalVisible} transparent={true} animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <View className="bg-white rounded-t-3xl h-3/4 p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-zinc-800">Select Buyer</Text>
              <TouchableOpacity onPress={() => setBuyerModalVisible(false)} className="p-2 bg-zinc-100 rounded-full">
                <Ionicons name="close" size={24} color="#52525b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {buyers?.map(b => (
                <TouchableOpacity 
                  key={b.id} 
                  className="py-4 border-b border-zinc-100"
                  onPress={() => { setBuyerId(b.id); setBuyerModalVisible(false); }}
                >
                  <Text className="text-lg" style={{ color: buyerId === b.id ? '#2563eb' : '#3f3f46', fontWeight: buyerId === b.id ? 'bold' : 'normal' }}>{b.name}</Text>
                </TouchableOpacity>
              ))}
              <View className="h-10" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Item Modal */}
      <Modal visible={itemModalVisible} transparent={true} animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <View className="bg-white rounded-t-3xl h-2/3 p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-zinc-800">Select Item</Text>
              <TouchableOpacity onPress={() => setItemModalVisible(false)} className="p-2 bg-zinc-100 rounded-full">
                <Ionicons name="close" size={24} color="#52525b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {items?.map(i => {
                const itemPrice = getUnitPrice(i);
                return (
                  <TouchableOpacity 
                    key={i.id} 
                    className="py-4 border-b border-zinc-100 flex-row justify-between items-center"
                    onPress={() => { setItemId(i.id); setItemModalVisible(false); }}
                  >
                    <Text className="text-lg" style={{ color: itemId === i.id ? '#2563eb' : '#3f3f46', fontWeight: itemId === i.id ? 'bold' : 'normal' }}>{i.name}</Text>
                    <Text className="text-zinc-500">₹{itemPrice}</Text>
                  </TouchableOpacity>
                );
              })}
              <View className="h-10" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PrinterSettingsModal 
        visible={printerModalVisible} 
        onClose={() => setPrinterModalVisible(false)} 
      />

      {receiptImagePrintBridge}

      <CustomAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}
