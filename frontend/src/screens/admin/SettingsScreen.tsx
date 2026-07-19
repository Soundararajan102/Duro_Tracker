import React from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, Modal, TextInput, Platform } from 'react-native';
import { LogOut, Plus, FileSpreadsheet, Info, CheckCircle, PauseCircle, Edit } from 'lucide-react-native';
import { useDrivers, useToggleDriver, useCreateDriver, useOrganization } from '../../hooks/useDrivers';
import { useProviders } from '../../hooks/usePurchases';
import { adminReportsApi } from '../../services/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, API_BASE_URL } from '../../services/api';
import type { Driver } from '../../types/api';
import { useAuth } from '../../context/AuthContext';


const CustomDatePickerModal = ({ visible, onClose, onSelect, initialDate }: { visible: boolean; onClose: () => void; onSelect: (date: string) => void; initialDate?: string }) => {
  const [currentMonth, setCurrentMonth] = React.useState(initialDate ? parseISO(initialDate) : new Date());

  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const dateFormat = "yyyy-MM-dd";
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 justify-center items-center bg-black/50 p-4" onPress={onClose}>
        <Pressable className="bg-white rounded-3xl p-4 w-full max-w-[340px]" onPress={(e) => e.stopPropagation()}>
          <View className="flex-row justify-between items-center mb-4 px-2">
            <Pressable onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-slate-100 rounded-full">
              <Text className="font-bold text-slate-600">{'<'}</Text>
            </Pressable>
            <Text className="text-lg font-bold text-slate-800">{format(currentMonth, 'MMMM yyyy')}</Text>
            <Pressable onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-slate-100 rounded-full">
              <Text className="font-bold text-slate-600">{'>'}</Text>
            </Pressable>
          </View>

          <View className="flex-row mb-2">
            {days.map(day => (
              <View key={day} className="flex-1 items-center">
                <Text className="text-xs font-bold text-slate-400">{day}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {calendarDays.map((day, i) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isSelected = initialDate ? isSameDay(day, parseISO(initialDate)) : false;
              
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    onSelect(format(day, dateFormat));
                    onClose();
                  }}
                  className="w-[14.28%] aspect-square justify-center items-center p-1"
                >
                  <View className={`w-full h-full justify-center items-center rounded-full ${isSelected ? 'bg-indigo-600' : ''}`}>
                    <Text className={`font-medium ${!isCurrentMonth ? 'text-slate-300' : isSelected ? 'text-white' : 'text-slate-700'}`}>
                      {format(day, 'd')}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          
          <Pressable onPress={onClose} className="mt-4 py-3 bg-slate-100 rounded-xl items-center">
            <Text className="font-bold text-slate-700">Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default function SettingsScreen() {
  const { data: drivers = [], isLoading } = useDrivers();
  const { data: org } = useOrganization();
  const toggleMutation = useToggleDriver();
  const createMutation = useCreateDriver();
  const { logout } = useAuth();

  const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
  const [reportTypes, setReportTypes] = React.useState<string[]>(['Purchase']);
  const [dateMode, setDateMode] = React.useState('single');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [selectedProviders, setSelectedProviders] = React.useState<string[]>([]);
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);
  const { data: providers = [] } = useProviders();

const renderDatePicker = (value: string, onChange: (val: string) => void, placeholder: string, isEnd = false) => {
    if (Platform.OS === 'web') {
      return (
        <input
          type="date"
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
          style={{ outline: 'none' }}
        />
      );
    }

    const showPicker = isEnd ? showEndPicker : showStartPicker;
    const setShowPicker = isEnd ? setShowEndPicker : setShowStartPicker;

    return (
      <>
        <Pressable 
          onPress={() => setShowPicker(true)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
        >
          <Text className={value ? "text-slate-900" : "text-slate-400"}>
            {value || placeholder}
          </Text>
        </Pressable>
        <CustomDatePickerModal 
          visible={showPicker} 
          onClose={() => setShowPicker(false)} 
          onSelect={(d) => onChange(d)} 
          initialDate={value || undefined}
        />
      </>
    );
  };


  const handleGenerateReport = async () => {
    if (reportTypes.includes('Purchase')) {
      try {
        const providerStr = selectedProviders.length > 0 ? selectedProviders.join(',') : undefined;
        const params = new URLSearchParams();
        params.append('date_mode', dateMode);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (providerStr) params.append('provider_ids', providerStr);
        
        const urlSuffix = `/admin/reports/purchases/pdf?${params.toString()}`;
        
        if (Platform.OS === 'web') {
          // Download via axios to attach interceptor token automatically
          const response = await api.get(urlSuffix, { responseType: 'blob' });
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `Purchase_Report_${Date.now()}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(blobUrl);
        } else {
          // Native download with token
          const token = await AsyncStorage.getItem('@auth_token');
          const uri = `${API_BASE_URL}${urlSuffix}`;
          const fileUri = `${FileSystem.documentDirectory}Purchase_Report_${Date.now()}.pdf`;
          const result = await FileSystem.downloadAsync(uri, fileUri, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(result.uri);
          }
        }
      } catch (error) {
        console.error('Download failed', error);
      }
    }
  };

  const toggleReportType = (type: string) => {
    if (type !== 'Purchase') return; // only purchase enabled for now
    if (reportTypes.includes(type)) {
      setReportTypes(reportTypes.filter(t => t !== type));
    } else {
      setReportTypes([...reportTypes, type]);
    }
  };

  const toggleProvider = (id: string) => {
    if (selectedProviders.includes(id)) {
      setSelectedProviders(selectedProviders.filter(p => p !== id));
    } else {
      setSelectedProviders([...selectedProviders, id]);
    }
  };

  
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
      <View className="bg-white rounded-3xl border border-slate-200 mb-4 overflow-hidden">
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
          <View className="px-2.5 py-1 flex flex-row items-center gap-1.5 rounded-full" style={{ backgroundColor: item.is_active ? '#ecfdf5' : '#f1f5f9' }}>
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: item.is_active ? '#10b981' : '#94a3b8' }} />
            <Text className="text-[11px] font-bold uppercase" style={{ color: item.is_active ? '#047857' : '#475569' }}>
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
            className="flex-1 rounded-xl py-3 items-center justify-center flex flex-row gap-2 active:opacity-80"
            style={{ backgroundColor: item.is_active ? '#fef3c7' : '#d1fae5' }}
          >
            {item.is_active ? <PauseCircle size={16} color="#b45309" /> : <CheckCircle size={16} color="#047857" />}
            <Text className="text-sm font-bold" style={{ color: item.is_active ? '#b45309' : '#047857' }}>
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
            {org && (
              <Text className="text-slate-500 text-sm font-semibold mb-4">
                Driver Account Usage: {drivers.length}/{org.max_users} used · {Math.max(0, org.max_users - drivers.length)} remaining
              </Text>
            )}

            {/* Primary Action Buttons */}
            <Pressable onPress={() => setIsModalOpen(true)} className="w-full bg-indigo-600 rounded-[16px] py-4 items-center justify-center flex flex-row gap-2 active:bg-indigo-700 mb-3">
              <Plus size={20} color="#ffffff" />
              <Text className="text-white font-bold text-[15px]">+ Create New Driver</Text>
            </Pressable>

            <Pressable onPress={() => setIsReportModalOpen(true)} className="w-full bg-white border border-slate-200 rounded-[16px] py-4 items-center justify-center flex flex-row gap-2 active:bg-slate-50 mb-2">
              <FileSpreadsheet size={20} color="#4f46e5" />
              <Text className="text-slate-900 font-bold text-[15px]">Generate Reports</Text>
            </Pressable>
          </View>
        }
      />
      )}

      {/* Create Driver Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
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
                className="w-full rounded-2xl py-4 items-center mt-4"
                style={{ backgroundColor: (!newUsername.trim() || !newPassword.trim()) ? '#e2e8f0' : '#4f46e5' }}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="font-bold text-base" style={{ color: (!newUsername.trim() || !newPassword.trim()) ? '#94a3b8' : '#ffffff' }}>
                    Create Driver Account
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Generate Reports Modal */}
      <Modal visible={isReportModalOpen} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View className="bg-white rounded-t-3xl p-6 h-[85%]">
            <View className="flex flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-900">Generate Reports</Text>
              <Pressable onPress={() => setIsReportModalOpen(false)} className="p-2 bg-slate-100 rounded-full">
                <Text className="text-slate-600 font-bold">✕</Text>
              </Pressable>
            </View>

            <View className="flex-1">
              {/* Report Types */}
              <Text className="text-sm font-bold text-slate-700 mb-3 ml-1">Report Types</Text>
              <View className="flex flex-row flex-wrap gap-2 mb-6">
                {['Purchase', 'Inventory', 'Sales', 'Billing'].map(type => (
                  <Pressable
                    key={type}
                    onPress={() => toggleReportType(type)}
                    className="flex flex-row items-center gap-2 px-4 py-2.5 rounded-xl border"
                    style={{ 
                      backgroundColor: reportTypes.includes(type) ? '#e0e7ff' : '#f8fafc',
                      borderColor: reportTypes.includes(type) ? '#4f46e5' : '#e2e8f0',
                      opacity: type === 'Purchase' ? 1 : 0.5
                    }}
                  >
                    <View className="w-4 h-4 rounded-full border items-center justify-center" style={{ borderColor: reportTypes.includes(type) ? '#4f46e5' : '#cbd5e1' }}>
                      {reportTypes.includes(type) && <View className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                    </View>
                    <Text className="font-bold text-sm" style={{ color: reportTypes.includes(type) ? '#4338ca' : '#64748b' }}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Date Filters */}
              <Text className="text-sm font-bold text-slate-700 mb-3 ml-1">Date Range</Text>
              <View className="flex flex-row flex-wrap gap-2 mb-4">
                {['single', 'range', 'month', 'year'].map(mode => (
                  <Pressable
                    key={mode}
                    onPress={() => setDateMode(mode)}
                    className="px-4 py-2 rounded-xl border"
                    style={{
                      backgroundColor: dateMode === mode ? '#fef3c7' : '#f8fafc',
                      borderColor: dateMode === mode ? '#d97706' : '#e2e8f0'
                    }}
                  >
                    <Text className="font-bold text-[13px] capitalize" style={{ color: dateMode === mode ? '#b45309' : '#64748b' }}>
                      {mode}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View className="flex flex-row gap-3 mb-6">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-500 mb-1 ml-1">
                    {dateMode === 'range' ? 'Start Date' : 'Date'} (YYYY-MM-DD)
                  </Text>
                  {renderDatePicker(startDate, setStartDate, "2026-07-17")}
                </View>
                {dateMode === 'range' && (
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-500 mb-1 ml-1">End Date (YYYY-MM-DD)</Text>
                    {renderDatePicker(endDate, setEndDate, "2026-07-18", true)}
                  </View>
                )}
              </View>

              {/* Provider Selection (only if Purchase selected) */}
              {reportTypes.includes('Purchase') && (
                <View className="mb-6">
                  <Text className="text-sm font-bold text-slate-700 mb-3 ml-1">Providers</Text>
                  <View className="flex flex-row flex-wrap gap-2">
                    <Pressable
                      onPress={() => setSelectedProviders([])}
                      className="px-4 py-2 rounded-xl border"
                      style={{
                        backgroundColor: selectedProviders.length === 0 ? '#ecfccb' : '#f8fafc',
                        borderColor: selectedProviders.length === 0 ? '#65a30d' : '#e2e8f0'
                      }}
                    >
                      <Text className="font-bold text-[13px]" style={{ color: selectedProviders.length === 0 ? '#4d7c0f' : '#64748b' }}>
                        All Providers
                      </Text>
                    </Pressable>
                    
                    {providers.map(p => (
                      <Pressable
                        key={p.id}
                        onPress={() => toggleProvider(p.id)}
                        className="px-4 py-2 rounded-xl border"
                        style={{
                          backgroundColor: selectedProviders.includes(p.id) ? '#ecfccb' : '#f8fafc',
                          borderColor: selectedProviders.includes(p.id) ? '#65a30d' : '#e2e8f0'
                        }}
                      >
                        <Text className="font-bold text-[13px]" style={{ color: selectedProviders.includes(p.id) ? '#4d7c0f' : '#64748b' }}>
                          {p.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <Pressable
              onPress={handleGenerateReport}
              disabled={reportTypes.length === 0 || !startDate.trim()}
              className="w-full rounded-2xl py-4 items-center mt-4"
              style={{ backgroundColor: (reportTypes.length === 0 || !startDate.trim()) ? '#e2e8f0' : '#4f46e5' }}
            >
              <Text className="font-bold text-base" style={{ color: (reportTypes.length === 0 || !startDate.trim()) ? '#94a3b8' : '#ffffff' }}>
                Download PDF
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </View>
  );
}
