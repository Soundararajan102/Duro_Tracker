import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DeliveryReceiptData } from '../../utils/printer';
import { useReceiptImagePrintJob } from '../../hooks/use-receipt-image-print-job';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

import { usePrinterStore } from '../../store/printer-store';

export default function DebtCollectionScreen() {
  const { userToken } = useAuth();
  const { preferredPrinter } = usePrinterStore();
  const queryClient = useQueryClient();
  const { startReceiptImagePrintJob, receiptImagePrintBridge } = useReceiptImagePrintJob();
  
  const [buyerModalVisible, setBuyerModalVisible] = useState(false);
  const [buyerId, setBuyerId] = useState('');
  const [cashCollected, setCashCollected] = useState('');
  const [upiCollected, setUpiCollected] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(() => Date.now().toString(36) + Math.random().toString(36).substring(2));

  // Fetch Buyers
  const { data: buyers, isLoading: buyersLoading } = useQuery({
    queryKey: ['driver_buyers'],
    queryFn: async () => {
      const res = await api.get(`/driver/buyers`);
      return res.data as { id: string, name: string, address: string, balance_pending: number }[];
    },
    enabled: !!userToken
  });

  const selectedBuyer = buyers?.find(b => b.id === buyerId);

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post(`/driver/collections`, payload, {
        headers: { 
          'X-Idempotency-Key': idempotencyKey
        }
      });
    },
    onSuccess: (data) => {
      Alert.alert("Success", "Payment collected successfully.");
      
      if (selectedBuyer && preferredPrinter) {
        const cash_paid = parseFloat(cashCollected || '0');
        const upi_paid = parseFloat(upiCollected || '0');
        
        const receiptData: DeliveryReceiptData = {
          receipt_type: 'PAYMENT',
          receipt_number: data?.data?.bill_number || Math.random().toString(36).substring(2, 8).toUpperCase(),
          date: data?.data?.timestamp || new Date().toISOString(),
          agency_name: "Sree Hari Agencies",
          agency_address: "Namakkal",
          buyer_name: selectedBuyer.name,
          buyer_address: selectedBuyer.address || "",
          opening_balance: parseFloat(selectedBuyer.balance_pending.toString()),
          items: [],
          total_bill: 0,
          cash_collected: cash_paid,
          upi_collected: upi_paid,
          closing_balance: parseFloat(selectedBuyer.balance_pending.toString()) - (cash_paid + upi_paid),
        };
        startReceiptImagePrintJob([receiptData], preferredPrinter).catch(err => {
          Alert.alert("Print Error", err.message || "Failed to print receipt");
        });
      }

      // Reset form
      setBuyerId('');
      setCashCollected('');
      setUpiCollected('');
      setIdempotencyKey(Date.now().toString(36) + Math.random().toString(36).substring(2));
      queryClient.invalidateQueries({ queryKey: ['driver_history'] });
      queryClient.invalidateQueries({ queryKey: ['driver_buyers'] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.detail || "Failed to log collection.");
    }
  });

  if (buyersLoading) {
    return (
      <View className="flex-1 bg-zinc-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-50">
      <View className="bg-white px-4 pt-12 pb-4 shadow-sm border-b border-zinc-200">
        <Text className="text-2xl font-bold text-zinc-800">Debt Collection</Text>
        <Text className="text-zinc-500 mt-1">Collect pending payments from buyers</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        
        {/* Buyer Selection */}
        <View className="mb-6">
          <Text className="text-zinc-800 font-semibold mb-2">Select Buyer *</Text>
          <TouchableOpacity 
            className="bg-white border border-zinc-200 rounded-xl p-4 flex-row justify-between items-center"
            onPress={() => setBuyerModalVisible(true)}
          >
            {selectedBuyer ? (
              <View>
                <Text className="text-zinc-800 font-semibold">{selectedBuyer.name}</Text>
                <Text className="text-zinc-500 text-sm mt-1">Pending: ₹ {parseFloat(selectedBuyer.balance_pending.toString()).toFixed(2)}</Text>
              </View>
            ) : (
              <Text className="text-zinc-400">Tap to select a buyer</Text>
            )}
            <Ionicons name="chevron-down" size={20} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {/* Payment Collection */}
        {selectedBuyer && (
          <View className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm mb-6">
            <Text className="text-zinc-800 font-bold text-lg mb-4">Payment Details</Text>
            
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

            <View className="mt-6 p-4 bg-zinc-50 rounded-xl">
              <View className="flex-row justify-between mb-2">
                <Text className="text-zinc-500">Current Pending</Text>
                <Text className="text-zinc-800">₹ {parseFloat(selectedBuyer.balance_pending.toString()).toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-emerald-600">Total Collected</Text>
                <Text className="text-emerald-600 font-semibold">- ₹ {(parseFloat(cashCollected || '0') + parseFloat(upiCollected || '0')).toFixed(2)}</Text>
              </View>
              <View className="h-px bg-zinc-200 my-2" />
              <View className="flex-row justify-between">
                <Text className="text-zinc-800 font-bold">New Pending</Text>
                <Text className="text-zinc-800 font-bold">
                  ₹ {(parseFloat(selectedBuyer.balance_pending.toString()) - (parseFloat(cashCollected || '0') + parseFloat(upiCollected || '0'))).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          className="py-4 rounded-xl items-center mb-12"
          style={{ backgroundColor: submitMutation.isPending ? '#60a5fa' : '#10b981', opacity: !buyerId ? 0.5 : 1 }}
          onPress={() => {
            if (!buyerId) {
              Alert.alert("Required", "Please select a buyer.");
              return;
            }
            const cash = parseFloat(cashCollected || '0');
            const upi = parseFloat(upiCollected || '0');
            
            if (cash + upi <= 0) {
              Alert.alert("Invalid", "Please enter an amount to collect.");
              return;
            }

            if (cash + upi > parseFloat(selectedBuyer?.balance_pending?.toString() || '0')) {
               Alert.alert("Invalid", "Cannot collect more than the pending balance.");
               return;
            }

            submitMutation.mutate({
              buyer_id: buyerId,
              cash_collected: cash,
              upi_collected: upi
            });
          }}
          disabled={submitMutation.isPending || !buyerId}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-semibold flex-row items-center">
              Submit Payment <Ionicons name="checkmark-circle" size={20} color="white" />
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Buyer Modal */}
      <Modal visible={buyerModalVisible} transparent={true} animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <View className="bg-white rounded-t-3xl h-3/4 p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-zinc-800">Select Buyer with Debt</Text>
              <TouchableOpacity onPress={() => setBuyerModalVisible(false)} className="p-2 bg-zinc-100 rounded-full">
                <Ionicons name="close" size={24} color="#52525b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {buyers?.filter(b => b.balance_pending > 0).map(b => (
                <TouchableOpacity 
                  key={b.id} 
                  className="py-4 border-b border-zinc-100"
                  onPress={() => { setBuyerId(b.id); setBuyerModalVisible(false); }}
                >
                  <Text className="text-lg font-semibold text-zinc-800">{b.name}</Text>
                  <Text className="text-zinc-500 mt-1">Pending: ₹{parseFloat(b.balance_pending.toString()).toFixed(2)} | {b.address || "No Address"}</Text>
                </TouchableOpacity>
              ))}
              {buyers?.filter(b => b.balance_pending > 0).length === 0 && (
                <View className="py-12 items-center">
                  <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" />
                  <Text className="text-zinc-500 mt-4 text-center">No buyers currently have pending debt.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {receiptImagePrintBridge}
    </View>
  );
}
