import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, Modal, TextInput, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Plus, Edit2, X, PackageOpen, CheckCircle, PauseCircle, Trash2 } from 'lucide-react-native';
import { useItems, useToggleItem, useCreateItem, useUpdateItem, useDeleteItem } from '../../hooks/useItems';
import type { Item, ItemCategory } from '../../types/api';

export default function ItemsScreen() {
  const { data: items = [], isLoading } = useItems();
  const toggleMutation = useToggleItem();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  // Add State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [newFull, setNewFull] = useState('');
  const [newEmpty, setNewEmpty] = useState('');

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCapacity, setEditCapacity] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    createItem.mutate({
      name: newName.trim(),
      category: 'commercial',
      price: 0,
      capacity_kg: parseFloat(newCapacity) || 0,
      initial_full: parseInt(newFull) || 0,
      initial_empty: parseInt(newEmpty) || 0,
      is_active: true
    }, {
      onSuccess: () => {
        setIsModalOpen(false);
        setNewName('');
        setNewCapacity('');
        setNewFull('');
        setNewEmpty('');
      }
    });
  };

  const openEditModal = (item: Item) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditCapacity(item.capacity_kg ? item.capacity_kg.toString() : '');
    setIsEditModalOpen(true);
  };

  const handleEdit = () => {
    if (!editId || !editName.trim()) return;
    updateItem.mutate({
      id: editId,
      data: {
        name: editName.trim(),
        category: 'commercial',
        price: 0,
        capacity_kg: parseFloat(editCapacity) || 0,
      }
    }, {
      onSuccess: () => {
        setIsEditModalOpen(false);
      }
    });
  };

  const handleDelete = () => {
    if (!editId) return;
    deleteItem.mutate(editId, {
      onSuccess: () => {
        setIsEditModalOpen(false);
      }
    });
  };

  const toggleItem = (item: Item) => {
    toggleMutation.mutate({ id: item.id, isActive: !item.is_active });
  };

  const renderItemCard = ({ item }: { item: Item }) => {
    return (
      <View className="bg-white rounded-[24px] p-3 border border-slate-200 shadow-sm mb-4">
        <View className="flex flex-row gap-3">
          {/* Thumbnail Placeholder */}
          <View className="w-[84px] h-[84px] bg-slate-100 rounded-xl items-center justify-center border border-slate-200">
            <PackageOpen size={32} color="#94a3b8" />
          </View>
          
          {/* Details */}
          <View className="flex-1 flex flex-col gap-2.5">
            {/* Header Row */}
            <View className="flex flex-row items-start justify-between gap-2">
              <View className="flex-1 flex flex-col gap-0.5">
                <Text className="text-slate-900 font-bold text-sm" numberOfLines={1}>{item.name}</Text>
                {item.capacity_kg ? <Text className="text-slate-500 text-[11px] font-medium">{item.capacity_kg} kg</Text> : null}
              </View>
            </View>

            {/* Chips Row */}
            <View className="flex flex-row flex-wrap gap-2">
              <View className="bg-indigo-50 border border-indigo-100 rounded-full px-2 py-1 flex flex-row items-center gap-1">
                <Text className="text-indigo-700 text-[11px] font-bold">Total: {item.current_full + item.current_empty}</Text>
              </View>
              <View className="bg-amber-50 border border-amber-100 rounded-full px-2 py-1 flex flex-row items-center gap-1">
                <Text className="text-amber-700 text-[11px] font-bold">{item.current_full} Full</Text>
              </View>
              <View className="bg-slate-50 border border-slate-200 rounded-full px-2 py-1 flex flex-row items-center gap-1">
                <Text className="text-slate-600 text-[11px] font-bold">{item.current_empty} Empty</Text>
              </View>
            </View>

            {/* Actions Row */}
            <View className="flex flex-row gap-2 mt-1">
              <Pressable 
                onPress={() => openEditModal(item)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 items-center justify-center flex flex-row gap-1 active:bg-slate-100"
              >
                <Edit2 size={14} color="#475569" />
                <Text className="text-slate-700 text-xs font-bold">Edit</Text>
              </Pressable>
              <Pressable 
                onPress={() => toggleItem(item)}
                className={`flex-1 border rounded-xl py-2 items-center justify-center flex flex-row gap-1 active:opacity-80 ${item.is_active ? 'bg-white border-slate-200' : 'bg-emerald-50 border-emerald-200'}`}
              >
                {item.is_active ? <PauseCircle size={14} color="#475569" /> : <CheckCircle size={14} color="#10b981" />}
                <Text className={`text-xs font-bold ${item.is_active ? 'text-slate-700' : 'text-emerald-700'}`}>
                  {item.is_active ? 'Pause' : 'Activate'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 p-4 pt-12">
      {/* Header */}
      <View className="flex flex-col mb-6">
        <Text className="text-2xl font-semibold text-slate-900">Manage Cylinder Variants</Text>
        <Text className="text-slate-500 text-sm mt-1">Configure your product catalog and initial inventory counts.</Text>
      </View>

      {/* Main List */}
      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : items.length === 0 ? (
          <View className="flex-1 items-center justify-center p-12 bg-white rounded-2xl border border-gray-200">
            <View className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <PackageOpen size={32} color="#94a3b8" />
            </View>
            <Text className="text-lg font-medium text-slate-900">No items found</Text>
            <Text className="text-slate-500 text-sm mt-1 text-center max-w-xs">You haven't added any cylinder variants yet. Click the button above to get started.</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItemCard}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <Pressable 
        onPress={() => setIsModalOpen(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full items-center justify-center shadow-lg active:bg-indigo-700"
      >
        <Plus size={24} color="#ffffff" />
      </Pressable>

      {/* Add Item Modal */}
      <Modal animationType="fade" transparent={true} visible={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <View className="flex-1 items-center justify-center p-4 bg-slate-900/50">
          <View className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden">
            <View className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <Text className="text-lg font-bold text-slate-900">Add Cylinder Variant</Text>
              <Pressable onPress={() => setIsModalOpen(false)} className="p-1.5 rounded-full bg-slate-100">
                <X size={18} color="#64748b" />
              </Pressable>
            </View>
            
            <View className="p-6 flex flex-col gap-4">
              <View className="flex flex-row gap-3">
                <View className="flex-[2]">
                  <Text className="text-sm font-bold text-slate-700 mb-1">Item Name</Text>
                  <TextInput 
                    placeholder="e.g. 19kg Commercial"
                    value={newName}
                    onChangeText={setNewName}
                    className="w-full rounded-xl border-gray-300 border px-4 py-3 text-sm text-slate-900 bg-slate-50"
                  />
                </View>
                <View className="flex-[1]">
                  <Text className="text-sm font-bold text-slate-700 mb-1">Capacity (kg)</Text>
                  <TextInput 
                    placeholder="19"
                    keyboardType="numeric"
                    value={newCapacity}
                    onChangeText={setNewCapacity}
                    className="w-full rounded-xl border-gray-300 border px-4 py-3 text-sm text-slate-900 bg-slate-50 font-mono"
                  />
                </View>
              </View>

              <View className="bg-amber-50 p-4 rounded-xl border border-amber-100 mt-2">
                <Text className="text-sm font-bold text-amber-900 mb-3">Initial Stock Entry</Text>
                <View className="flex flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-amber-800 mb-1">Full Cylinders</Text>
                    <TextInput 
                      placeholder="0"
                      keyboardType="numeric"
                      value={newFull}
                      onChangeText={setNewFull}
                      className="w-full rounded-xl border-amber-200 border bg-white px-4 py-3 text-sm text-slate-900 font-mono"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-amber-800 mb-1">Empty Cylinders</Text>
                    <TextInput 
                      placeholder="0"
                      keyboardType="numeric"
                      value={newEmpty}
                      onChangeText={setNewEmpty}
                      className="w-full rounded-xl border-amber-200 border bg-white px-4 py-3 text-sm text-slate-900 font-mono"
                    />
                  </View>
                </View>
              </View>

              <Pressable 
                onPress={handleCreate}
                disabled={createItem.isPending}
                className={`w-full rounded-xl py-3.5 items-center justify-center mt-3 ${createItem.isPending ? 'bg-indigo-400' : 'bg-indigo-600 active:bg-indigo-700'}`}
              >
                <Text className="text-white font-bold text-sm">
                  {createItem.isPending ? 'Saving...' : 'Save Item'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Item Modal */}
      <Modal animationType="fade" transparent={true} visible={isEditModalOpen} onRequestClose={() => setIsEditModalOpen(false)}>
        <View className="flex-1 items-center justify-center p-4 bg-slate-900/50">
          <View className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden">
            <View className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <Text className="text-lg font-bold text-slate-900">Edit Cylinder Variant</Text>
              <Pressable onPress={() => setIsEditModalOpen(false)} className="p-1.5 rounded-full bg-slate-100">
                <X size={18} color="#64748b" />
              </Pressable>
            </View>
            
            <View className="p-6 flex flex-col gap-4">
              <View className="flex flex-row gap-3">
                <View className="flex-[2]">
                  <Text className="text-sm font-bold text-slate-700 mb-1">Item Name</Text>
                  <TextInput 
                    placeholder="e.g. 19kg Commercial"
                    value={editName}
                    onChangeText={setEditName}
                    className="w-full rounded-xl border-gray-300 border px-4 py-3 text-sm text-slate-900 bg-slate-50"
                  />
                </View>
                <View className="flex-[1]">
                  <Text className="text-sm font-bold text-slate-700 mb-1">Capacity (kg)</Text>
                  <TextInput 
                    placeholder="19"
                    keyboardType="numeric"
                    value={editCapacity}
                    onChangeText={setEditCapacity}
                    className="w-full rounded-xl border-gray-300 border px-4 py-3 text-sm text-slate-900 bg-slate-50 font-mono"
                  />
                </View>
              </View>

              <View className="flex flex-row justify-between mt-3 gap-3">
                <Pressable 
                  onPress={handleDelete}
                  disabled={deleteItem.isPending}
                  className="rounded-xl px-4 py-3.5 bg-rose-50 items-center justify-center border border-rose-100 flex-1"
                >
                  <Text className="text-rose-600 font-bold text-sm flex flex-row items-center gap-2">
                    <Trash2 size={16} color="#e11d48" /> Delete
                  </Text>
                </Pressable>
                
                <Pressable 
                  onPress={handleEdit}
                  disabled={updateItem.isPending}
                  className={`rounded-xl py-3.5 items-center justify-center flex-[2] ${updateItem.isPending ? 'bg-indigo-400' : 'bg-indigo-600 active:bg-indigo-700'}`}
                >
                  <Text className="text-white font-bold text-sm">
                    {updateItem.isPending ? 'Updating...' : 'Update Item'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
