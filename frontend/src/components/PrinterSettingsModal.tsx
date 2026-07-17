import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePrinterStore } from '../store/printer-store';
import { PrinterDevice } from '../types/printer';
import {
  getPrinterSupportState,
  loadBluetoothPrinters,
  connectPrinterDevice,
  printTestReceipt
} from '../utils/printer';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PrinterSettingsModal({ visible, onClose }: Props) {
  const { preferredPrinter, setPreferredPrinter } = usePrinterStore();
  const [devices, setDevices] = useState<PrinterDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const supportState = getPrinterSupportState();

  useEffect(() => {
    if (visible && supportState.supported) {
      handleRefresh();
    }
  }, [visible]);

  const handleRefresh = async () => {
    if (!supportState.bluetooth) {
      Alert.alert("Unsupported", "Bluetooth printing is not available on this device.");
      return;
    }
    try {
      setLoading(true);
      const printers = await loadBluetoothPrinters();
      setDevices(printers);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load printers");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (device: PrinterDevice) => {
    try {
      setConnectingId(device.id);
      await connectPrinterDevice(device);
      setPreferredPrinter(device);
      Alert.alert("Success", `Connected to ${device.name}`);
    } catch (e: any) {
      Alert.alert("Connection Failed", e.message || "Could not connect to printer");
    } finally {
      setConnectingId(null);
    }
  };

  const handleTestPrint = async () => {
    if (!preferredPrinter) return;
    try {
      await printTestReceipt(preferredPrinter);
      Alert.alert("Success", "Test receipt sent!");
    } catch (e: any) {
      Alert.alert("Print Failed", e.message || "Could not print test receipt");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-zinc-50">
        <View className="flex-row items-center justify-between p-4 border-b border-zinc-200 bg-white">
          <Text className="text-lg font-bold text-zinc-900">Printer Settings</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#3f3f46" />
          </TouchableOpacity>
        </View>

        <View className="p-4 flex-1">
          <View className="bg-white p-4 rounded-xl border border-zinc-200 mb-6">
            <Text className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Saved Printer</Text>
            {preferredPrinter ? (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="bg-green-100 p-2 rounded-lg">
                    <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                  </View>
                  <View>
                    <Text className="text-zinc-900 font-bold">{preferredPrinter.name}</Text>
                    <Text className="text-zinc-500 text-xs">{preferredPrinter.address}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleTestPrint} className="bg-zinc-100 px-3 py-2 rounded-lg">
                  <Text className="text-blue-600 font-bold text-xs">Test Print</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text className="text-zinc-500">No printer configured yet.</Text>
            )}
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-zinc-900">Available Devices</Text>
            <TouchableOpacity onPress={handleRefresh} disabled={loading} className="bg-blue-100 px-3 py-1.5 rounded-full flex-row items-center gap-1">
              <Ionicons name="refresh" size={14} color="#2563eb" />
              <Text className="text-blue-600 font-bold text-xs">Scan</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#2563eb" />
              <Text className="text-zinc-500 mt-4">Scanning for printers...</Text>
            </View>
          ) : devices.length === 0 ? (
            <View className="py-12 items-center justify-center border-2 border-dashed border-zinc-200 rounded-xl">
              <Ionicons name="bluetooth" size={32} color="#a1a1aa" />
              <Text className="text-zinc-500 mt-2">No printers found</Text>
            </View>
          ) : (
            <FlatList
              data={devices}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = preferredPrinter?.id === item.id;
                const isConnecting = connectingId === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => handleConnect(item)}
                    disabled={isConnecting}
                    className="p-4 rounded-xl mb-3 border"
                    style={isSelected ? { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' } : { backgroundColor: '#ffffff', borderColor: '#e4e4e7' }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-lg items-center justify-center" style={{ backgroundColor: isSelected ? '#dcfce7' : '#f4f4f5' }}>
                          <Ionicons name="bluetooth" size={20} color={isSelected ? '#16a34a' : '#3f3f46'} />
                        </View>
                        <View>
                          <Text className="font-bold" style={{ color: isSelected ? '#166534' : '#18181b' }}>{item.name}</Text>
                          <Text className="text-zinc-500 text-xs font-mono">{item.address}</Text>
                        </View>
                      </View>
                      {isConnecting ? (
                        <ActivityIndicator size="small" color="#2563eb" />
                      ) : isSelected ? (
                        <Text className="text-green-600 font-bold text-xs">Connected</Text>
                      ) : (
                        <Text className="text-blue-600 font-bold text-xs">Connect</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
