import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import uuid from 'react-native-uuid';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface Item { id: string; name: string; price: number; }
interface Buyer { id: string; name: string; }

export default function DeliveryScreen() {
  const queryClient = useQueryClient();
  const [buyerId, setBuyerId] = useState('');
  const [itemId, setItemId] = useState('');
  const [fullDelivered, setFullDelivered] = useState('');
  const [emptyReceived, setEmptyReceived] = useState('');
  const [cashCollected, setCashCollected] = useState('');
  const [upiCollected, setUpiCollected] = useState('');
  
  // Idempotency key generated on mount / after success
  const [idempotencyKey, setIdempotencyKey] = useState<string>(uuid.v4().toString());

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
    onSuccess: () => {
      Alert.alert("Success", "Delivery logged successfully!");
      // Reset form
      setBuyerId('');
      setItemId('');
      setFullDelivered('');
      setEmptyReceived('');
      setCashCollected('');
      setUpiCollected('');
      setIdempotencyKey(uuid.v4().toString()); // new key for next submission
      queryClient.invalidateQueries({ queryKey: ['driver_history'] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.detail || "Failed to log delivery.");
    }
  });

  if (itemsLoading || buyersLoading) {
    return (
      <View className="flex-1 bg-zinc-100 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-zinc-100">
      <ScrollView className="p-4">
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="text-zinc-500 font-medium mb-2">Select Buyer</Text>
          <View className="flex-row flex-wrap gap-2">
            {buyers?.map(b => (
              <TouchableOpacity
                key={b.id}
                onPress={() => setBuyerId(b.id)}
                className={`px-4 py-2 rounded-lg border ${buyerId === b.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-zinc-200'}`}
              >
                <Text className={buyerId === b.id ? 'text-blue-700 font-medium' : 'text-zinc-700'}>{b.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="text-zinc-500 font-medium mb-2">Select Item</Text>
          <View className="flex-row flex-wrap gap-2">
            {items?.map(i => (
              <TouchableOpacity
                key={i.id}
                onPress={() => setItemId(i.id)}
                className={`px-4 py-2 rounded-lg border ${itemId === i.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-zinc-200'}`}
              >
                <Text className={itemId === i.id ? 'text-blue-700 font-medium' : 'text-zinc-700'}>{i.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-4">
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-zinc-500 font-medium mb-1">Full Delivered</Text>
              <TextInput
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-lg"
                keyboardType="numeric"
                value={fullDelivered}
                onChangeText={setFullDelivered}
                placeholder="0"
              />
            </View>
            <View className="flex-1">
              <Text className="text-zinc-500 font-medium mb-1">Empty Received</Text>
              <TextInput
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-lg"
                keyboardType="numeric"
                value={emptyReceived}
                onChangeText={setEmptyReceived}
                placeholder="0"
              />
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-zinc-500 font-medium mb-1">Cash Collected (₹)</Text>
              <TextInput
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-lg"
                keyboardType="numeric"
                value={cashCollected}
                onChangeText={setCashCollected}
                placeholder="0"
              />
            </View>
            <View className="flex-1">
              <Text className="text-zinc-500 font-medium mb-1">UPI Collected (₹)</Text>
              <TextInput
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-lg"
                keyboardType="numeric"
                value={upiCollected}
                onChangeText={setUpiCollected}
                placeholder="0"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          className={`py-4 rounded-xl items-center mb-8 ${submitMutation.isPending ? 'bg-blue-400' : 'bg-blue-600'}`}
          onPress={() => {
            if (!buyerId || !itemId) {
              Alert.alert("Required", "Please select a buyer and an item.");
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
              Submit Delivery <Ionicons name="checkmark-circle" size={20} color="white" />
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
