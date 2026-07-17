import React from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, Modal, TextInput } from 'react-native';
import { LogOut, Plus, FileSpreadsheet, Info, CheckCircle, PauseCircle, Edit } from 'lucide-react-native';
import { useDrivers, useToggleDriver, useCreateDriver } from '../../hooks/useDrivers';
import type { Driver } from '../../types/api';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const { data: drivers = [], isLoading } = useDrivers();
  const toggleMutation = useToggleDriver();
  const createMutation = useCreateDriver();
  const { logout } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newUsername, setNewUsername] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');

  const handleCreate = () => {
    if (!newUsername.trim() || !newPassword.trim()) return;
    createMutation.mutate({ username: newUsername.trim(), password: newPassword.trim(), is_active: true }, {
      onSuccess: () => {
        setIsModalOpen(false);
        setNewUsername('');
        setNewPassword('');
      }
    });
  };

  const toggleDriver = (driver: Driver) => {
    toggleMutation.mutate({ id: driver.id, isActive: !driver.is_active });
  };

  const renderDriverCard = ({ item, index }: { item: Driver, index: number }) => {
    return (
      <View className="bg-white rounded-3xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
        {/* Header */}
        <View className="flex flex-row items-start justify-between p-4 pb-3">
          <View className="flex flex-row items-center gap-3">
            <View className="bg-slate-100 px-2 py-1 rounded-md">
              <Text className="text-slate-500 font-bold text-xs">#{index + 1}</Text>
            </View>
            <View>
              <Text className="text-slate-900 font-extrabold text-lg">{item.username}</Text>
              <Text className="text-slate-500 text-sm">Role: {item.role}</Text>
            </View>
          </View>
          <View className={`px-2.5 py-1 flex flex-row items-center gap-1.5 rounded-full ${item.is_active ? 'bg-emerald-50' : 'bg-slate-100'}`}>
            <View className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <Text className={`text-[11px] font-bold uppercase ${item.is_active ? 'text-emerald-700' : 'text-slate-600'}`}>
              {item.is_active ? 'ACTIVE' : 'IDLE'}
            </Text>
          </View>
        </View>

        {/* Metrics Row */}
        <View className="flex flex-row px-4 gap-3 mb-4">
          <View className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3">
            <Text className="text-slate-500 text-[11px] font-bold mb-1">Collections</Text>
            <Text className="text-slate-900 font-extrabold text-sm font-mono">₹{((item.collected || 0) / 1000).toFixed(1)}k</Text>
          </View>
          <View className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3">
            <Text className="text-slate-500 text-[11px] font-bold mb-1">Deliveries</Text>
            <Text className="text-slate-900 font-extrabold text-sm">{item.deliveries || 0}</Text>
          </View>
          <View className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3">
            <Text className="text-slate-500 text-[11px] font-bold mb-1">Last Active</Text>
            <Text className="text-slate-900 font-extrabold text-xs">{item.lastActive || 'N/A'}</Text>
          </View>
        </View>

        {/* Footer Actions */}
        <View className="flex flex-row gap-3 px-4 py-4 border-t border-slate-100 bg-white">
          <Pressable className="flex-1 bg-white border border-slate-200 rounded-xl py-3 items-center justify-center flex flex-row gap-2 active:bg-slate-50">
            <Edit size={16} color="#4f46e5" />
            <Text className="text-indigo-600 text-sm font-bold">Manage Access</Text>
          </Pressable>
          <Pressable
            onPress={() => toggleDriver(item)}
            className={`flex-1 rounded-xl py-3 items-center justify-center flex flex-row gap-2 active:opacity-80 ${item.is_active ? 'bg-amber-100' : 'bg-emerald-100'}`}
          >
            {item.is_active ? <PauseCircle size={16} color="#b45309" /> : <CheckCircle size={16} color="#047857" />}
            <Text className={`text-sm font-bold ${item.is_active ? 'text-amber-700' : 'text-emerald-700'}`}>
              {item.is_active ? 'Pause' : 'Activate'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 p-4 pt-12">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={drivers}
        renderItem={renderDriverCard}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <View className="mb-6">
            {/* Header Row */}
            <View className="flex flex-row items-center justify-between mb-4">
              <View className="flex-1 pr-4">
                <Text className="text-[22px] font-extrabold text-slate-900">Driver Access & Settings</Text>
              </View>
              <Pressable onPress={logout} className="w-[72px] h-[72px] bg-rose-50 rounded-xl items-center justify-center active:bg-rose-100">
                <LogOut size={24} color="#e11d48" style={{ marginBottom: 4 }} />
                <Text className="text-rose-600 text-[13px] font-semibold">Logout</Text>
              </Pressable>
            </View>

            {/* Section Hint */}
            <View className="flex flex-row items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
              <Info size={20} color="#4f46e5" />
              <Text className="text-indigo-900 text-sm flex-1 leading-relaxed">
                Open a driver profile to update access or delete an account that has no delivery history.
              </Text>
            </View>

            {/* Quota Text */}
            <Text className="text-slate-500 text-sm font-semibold mb-4">
              Driver quota: {drivers.length}/5 used · {5 - drivers.length} remaining
            </Text>

            {/* Primary Action Buttons */}
            <Pressable onPress={() => setIsModalOpen(true)} className="w-full bg-indigo-600 rounded-[16px] py-4 items-center justify-center flex flex-row gap-2 active:bg-indigo-700 mb-3">
              <Plus size={20} color="#ffffff" />
              <Text className="text-white font-bold text-[15px]">+ Create New Driver</Text>
            </Pressable>

            <Pressable className="w-full bg-white border border-slate-200 rounded-[16px] py-4 items-center justify-center flex flex-row gap-2 shadow-sm active:bg-slate-50 mb-2">
              <FileSpreadsheet size={20} color="#4f46e5" />
              <Text className="text-slate-900 font-bold text-[15px]">Generate Reports</Text>
            </Pressable>
          </View>
        }
      />
      )}

      {/* Create Driver Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 h-[80%]">
            <View className="flex flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-900">Create New Driver</Text>
              <Pressable onPress={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full">
                <Text className="text-slate-600 font-bold">✕</Text>
              </Pressable>
            </View>

            <View className="flex flex-col gap-4">
              <View>
                <Text className="text-sm font-bold text-slate-700 mb-1.5 ml-1">Username</Text>
                <TextInput
                  value={newUsername}
                  onChangeText={setNewUsername}
                  placeholder="e.g. driver_john"
                  autoCapitalize="none"
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base"
                />
              </View>

              <View>
                <Text className="text-sm font-bold text-slate-700 mb-1.5 ml-1">Password</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter a secure password"
                  secureTextEntry
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base"
                />
              </View>

              <Pressable
                onPress={handleCreate}
                disabled={createMutation.isPending || !newUsername.trim() || !newPassword.trim()}
                className={`w-full rounded-2xl py-4 items-center mt-4 shadow-sm ${
                  (!newUsername.trim() || !newPassword.trim()) ? 'bg-slate-200' : 'bg-indigo-600 active:bg-indigo-700'
                }`}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className={`font-bold text-base ${(!newUsername.trim() || !newPassword.trim()) ? 'text-slate-400' : 'text-white'}`}>
                    Create Driver Account
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
