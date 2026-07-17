import React, { useState, useMemo, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PrinterSettingsModal from '../../components/PrinterSettingsModal';
import { usePrinterStore } from '../../store/printer-store';
import { DeliveryReceiptData } from '../../utils/printer';
import { useReceiptImagePrintJob } from '../../hooks/use-receipt-image-print-job';


interface Item { id: string; name: string; price: number; capacity_kg?: number; }
interface Buyer { id: string; name: string; price_per_kg?: number; balance_pending?: number; address?: string; }

export default function DeliveryScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [buyerId, setBuyerId] = useState('');
  const [itemId, setItemId] = useState('');
  const [fullDelivered, setFullDelivered] = useState('');
  const [emptyReceived, setEmptyReceived] = useState('');
  const [cashCollected, setCashCollected] = useState('');
  const [upiCollected, setUpiCollected] = useState('');
  
  // Modals state
  const [buyerModalVisible, setBuyerModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [printerModalVisible, setPrinterModalVisible] = useState(false);

  const { receiptImagePrintBridge, startReceiptImagePrintJob } = useReceiptImagePrintJob();

  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    Date.now().toString(36) + Math.random().toString(36).substring(2)
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setPrinterModalVisible(true)} className="mr-4 p-2 bg-zinc-100 rounded-full">
            <Ionicons name="print-outline" size={20} color="#52525b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} className="mr-4 p-2">
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, logout]);

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

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/driver/entries', payload, {
        headers: { 'X-Idempotency-Key': idempotencyKey }
      });
    },
    onSuccess: (data) => {
      Alert.alert("Success", "Delivery logged successfully!");
      
      const preferredPrinter = usePrinterStore.getState().preferredPrinter;
        if (preferredPrinter && selectedBuyer && selectedItem) {
          let unitPrice = selectedItem.price;
          if (selectedBuyer.price_per_kg && selectedItem.capacity_kg) {
            unitPrice = selectedBuyer.price_per_kg * selectedItem.capacity_kg;
          }
          const total_bill = parseFloat((unitPrice * parseInt(fullDelivered || '0')).toFixed(2));

          let receipt_price_per_kg = selectedBuyer.price_per_kg || 0;
          if (!receipt_price_per_kg && selectedItem.capacity_kg) {
             receipt_price_per_kg = selectedItem.price / selectedItem.capacity_kg;
          }

          const cash_paid = parseFloat(cashCollected || '0');
          const upi_paid = parseFloat(upiCollected || '0');
          const opening_balance = selectedBuyer.balance_pending || 0;
          const closing_balance = opening_balance + total_bill - (cash_paid + upi_paid);

          const receiptData: DeliveryReceiptData = {
            receipt_number: data?.data?.id ? data.data.id.split('-')[0].toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase(),
            date: data?.data?.created_at || new Date().toISOString(),
            agency_name: "Sree Hari Agencies",
            agency_address: "Namakkal",
            buyer_name: selectedBuyer.name,
            buyer_address: selectedBuyer.address || "",
            opening_balance: opening_balance,
            item_capacity_kg: selectedItem.capacity_kg || 0,
            full_delivered: parseInt(fullDelivered || '0'),
            price_per_kg: receipt_price_per_kg,
            total_bill: total_bill,
            cash_collected: cash_paid,
            upi_collected: upi_paid,
            closing_balance: closing_balance,
          };
          startReceiptImagePrintJob([receiptData], preferredPrinter).catch(err => {
            Alert.alert("Print Error", err.message || "Failed to print receipt");
          });
        }

      // Reset form
      setBuyerId('');
      setItemId('');
      setFullDelivered('');
      setEmptyReceived('');
      setCashCollected('');
      setUpiCollected('');
      setIdempotencyKey(Date.now().toString(36) + Math.random().toString(36).substring(2));
      queryClient.invalidateQueries({ queryKey: ['driver_history'] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.detail || "Failed to log delivery.");
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

  const totalBill = useMemo(() => {
    if (selectedItem && fullDelivered) {
      const unitPrice = getUnitPrice(selectedItem);
      return (unitPrice * parseInt(fullDelivered || '0')).toFixed(2);
    }
    return '0.00';
  }, [selectedItem, selectedBuyer, fullDelivered]);

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

        {/* Item Selection */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-zinc-100">
          <Text className="text-zinc-500 font-medium mb-2">Select Item</Text>
          <TouchableOpacity 
            className="flex-row items-center justify-between bg-zinc-50 border border-zinc-200 p-4 rounded-xl"
            onPress={() => setItemModalVisible(true)}
          >
            <Text className="text-lg" style={{ color: itemId ? '#27272a' : '#a1a1aa' }}>
              {selectedItem ? `${selectedItem.name} (₹${getUnitPrice(selectedItem)})` : 'Tap to select item...'}
            </Text>
            <Ionicons name="chevron-down" size={24} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {/* Quantities */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-zinc-100 space-y-4">
          <View className="flex-row gap-4">
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
        </View>

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
          style={{ backgroundColor: submitMutation.isPending ? '#60a5fa' : '#2563eb' }}
          onPress={() => {
            if (!buyerId || !itemId) {
              Alert.alert("Required", "Please select a buyer and an item.");
              return;
            }
            if (!fullDelivered && !emptyReceived) {
              Alert.alert("Required", "Please enter either full delivered or empty received.");
              return;
            }

            submitMutation.mutate({
              buyer_id: buyerId,
              item_id: itemId,
              full_delivered: parseInt(fullDelivered || '0'),
              empty_received: parseInt(emptyReceived || '0'),
              cash_collected: parseFloat(cashCollected || '0'),
              upi_collected: parseFloat(upiCollected || '0')
            });
          }}
          disabled={submitMutation.isPending}
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
    </KeyboardAvoidingView>
  );
}
