import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, FlatList, Modal, TextInput } from 'react-native';
import { Plus, X, Search, Store, ArrowLeft, Download, FileText, Receipt, Edit2, Trash2 } from 'lucide-react-native';

import { useBuyers, useCreateBuyer, useUpdateBuyer, useDeleteBuyer, useGlobalBills, useBuyerLedger } from '../../hooks/useBuyers';
import type { Buyer } from '../../types/api';
import { format } from 'date-fns';


export default function BuyersScreen() {
  const { data: buyers = [], isLoading } = useBuyers();
  const { data: globalBillsData = [], isLoading: isGlobalBillsLoading } = useGlobalBills();
  const [activeTab, setActiveTab] = useState<'crm' | 'bills'>('crm');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  
  const { data: buyerLedgerData = [], isLoading: isLedgerLoading } = useBuyerLedger(selectedBuyer?.id);

  const createBuyer = useCreateBuyer();
  const updateBuyer = useUpdateBuyer();
  const deleteBuyer = useDeleteBuyer();
  
  const [newName, setNewName] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newFinBal, setNewFinBal] = useState('');
  const [newCylBal, setNewCylBal] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBuyerId, setEditBuyerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editFinBal, setEditFinBal] = useState('');
  const [editCylBal, setEditCylBal] = useState('');

  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [editPricePerKg, setEditPricePerKg] = useState('');

  const handleSaveBuyer = () => {
    if (!newName.trim()) return;
    createBuyer.mutate({
      name: newName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim(),
      type: 'commercial',
      balance_pending: parseFloat(newFinBal) || 0,
      cylinders_pending: parseInt(newCylBal) || 0,
    }, {
      onSuccess: () => {
        setIsModalOpen(false);
        setNewName('');
        setNewOwner('');
        setNewPhone('');
        setNewAddress('');
        setNewFinBal('');
        setNewCylBal('');
      }
    });
  };

  const openEditModal = (buyer: Buyer) => {
    setEditBuyerId(buyer.id);
    setEditName(buyer.name);
    setEditPhone(buyer.phone || '');
    setEditAddress(buyer.address || '');
    setEditFinBal(buyer.balance_pending.toString());
    setEditCylBal(buyer.cylinders_pending.toString());
    setIsEditModalOpen(true);
  };

  const handleEditBuyer = () => {
    if (!editBuyerId || !editName.trim()) return;
    updateBuyer.mutate({
      id: editBuyerId,
      data: {
        name: editName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
        balance_pending: parseFloat(editFinBal) || 0,
        cylinders_pending: parseInt(editCylBal) || 0,
      }
    }, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        if (selectedBuyer && selectedBuyer.id === editBuyerId) {
          // Temporarily updating local selected buyer for instant UI update
          setSelectedBuyer(prev => prev ? { 
            ...prev, 
            name: editName.trim(),
            phone: editPhone.trim(),
            address: editAddress.trim(),
            balance_pending: parseFloat(editFinBal) || 0,
            cylinders_pending: parseInt(editCylBal) || 0,
          } : null);
        }
      }
    });
  };

  const handleDeleteBuyer = () => {
    if (!editBuyerId) return;
    deleteBuyer.mutate(editBuyerId, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        setSelectedBuyer(null);
      }
    });
  };

  const handleUpdatePrice = () => {
    if (!selectedBuyer) return;
    const priceVal = parseFloat(editPricePerKg);
    updateBuyer.mutate({
      id: selectedBuyer.id,
      data: {
        price_per_kg: isNaN(priceVal) ? undefined : priceVal
      }
    }, {
      onSuccess: (updatedData) => {
        setIsPriceModalOpen(false);
        setSelectedBuyer(updatedData);
      }
    });
  };

  const renderLedgerRow = ({ item, isHeader }: { item?: any, isHeader?: boolean }) => {
    if (isHeader) {
      return (
        <View className="flex flex-row bg-white border-b border-gray-200">
          <Text className="w-32 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date / Ref</Text>
          <Text className="w-28 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</Text>
          <Text className="w-24 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Full</Text>
          <Text className="w-24 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Empty</Text>
          <Text className="w-32 px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount / Paid</Text>
          <Text className="w-28 px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Fin. Bal</Text>
          <Text className="w-24 px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Cyl. Bal</Text>
        </View>
      );
    }
    
    if (!item) return null;

    let formattedDate = 'N/A';
    try {
      if (item.timestamp || item.date) {
        formattedDate = format(new Date(item.timestamp || item.date), 'MMM dd, yyyy');
      }
    } catch (e) {}

    return (
      <View className="flex flex-row items-center border-b border-gray-100 bg-white">
        <View className="w-32 px-4 py-4 flex flex-col justify-center">
          <Text className="font-medium text-slate-900 text-sm">{formattedDate}</Text>
          <Text className="text-xs text-slate-500">{item.id ? String(item.id).substring(0,8) : '-'}</Text>
        </View>
        <View className="w-28 px-4 py-4 justify-center items-center">
          <View className="rounded-md px-2 py-1 items-center self-center" style={{ backgroundColor: item.type === 'bill' ? '#eef2ff' : '#ecfdf5' }}>
            <Text className="text-xs font-medium" style={{ color: item.type === 'bill' ? '#4338ca' : '#047857' }}>
              {item.type === 'bill' ? 'Sales Bill' : 'Payment'}
            </Text>
          </View>
        </View>
        <Text className="w-24 px-4 py-4 text-center font-mono text-sm text-slate-700">{item.fullGiven !== undefined ? item.fullGiven : '-'}</Text>
        <Text className="w-24 px-4 py-4 text-center font-mono text-sm text-slate-700">{item.emptyCollected !== undefined ? item.emptyCollected : '-'}</Text>
        <View className="w-32 px-4 py-4 flex flex-col justify-center items-end">
          {item.type === 'bill' && <Text className="font-mono text-sm text-slate-900">₹{item.amount ? item.amount.toLocaleString() : '0'}</Text>}
          {item.paid > 0 && <Text className="font-mono text-xs text-emerald-600 mt-0.5">Paid ₹{item.paid.toLocaleString()}</Text>}
        </View>
        <Text className="w-28 px-4 py-4 text-right font-mono text-sm font-medium text-slate-900">₹{item.finRunBal !== undefined ? item.finRunBal.toLocaleString() : '0'}</Text>
        <Text className="w-24 px-4 py-4 text-right font-mono text-sm font-medium text-slate-700">{item.cylRunBal !== undefined ? item.cylRunBal : '0'}</Text>
      </View>
    );
  };

  const renderBuyerCRM = () => {
    if (selectedBuyer) {
      return (
        <ScrollView className="flex-1 pb-20">
          <View className="flex flex-row items-center justify-between mb-6 mt-2">
            <View className="flex flex-row items-center gap-4">
              <Pressable 
                onPress={() => setSelectedBuyer(null)}
                className="p-2 bg-white border border-gray-200 rounded-lg"
              >
                <ArrowLeft size={20} color="#475569" />
              </Pressable>
              <View>
                <Text className="text-xl font-bold text-slate-900">{selectedBuyer.name}</Text>
                <Text className="text-sm text-slate-500">{selectedBuyer.phone || 'No phone'}</Text>
              </View>
            </View>
            
            <Pressable 
              onPress={() => openEditModal(selectedBuyer)}
              className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-row items-center gap-2 active:bg-indigo-100"
            >
              <Edit2 size={16} color="#4f46e5" />
              <Text className="text-indigo-700 font-bold text-xs">Edit</Text>
            </Pressable>
          </View>

          <View className="flex flex-row gap-4 mb-6">
            <View className="flex-1 bg-white rounded-xl border border-gray-200 p-4 flex flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Financial Balance</Text>
                <Text className="text-xl font-mono tracking-tight font-bold" style={{ color: selectedBuyer.balance_pending > 0 ? '#e11d48' : '#059669' }}>
                  {selectedBuyer.balance_pending > 0 ? `₹${selectedBuyer.balance_pending.toLocaleString()} Due` : `₹${Math.abs(selectedBuyer.balance_pending).toLocaleString()} Adv`}
                </Text>
              </View>
              <View className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
                <Receipt size={20} color="#94a3b8" />
              </View>
            </View>
            
            <View className="flex-1 bg-white rounded-xl border border-gray-200 p-4 flex flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cylinder Holding</Text>
                <Text className="text-xl font-mono tracking-tight font-bold text-amber-600">
                  {selectedBuyer.cylinders_pending} <Text className="text-sm text-amber-400 font-medium">Empties</Text>
                </Text>
              </View>
              <View className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Store size={20} color="#f59e0b" />
              </View>
            </View>
          </View>

          <View className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Custom Pricing Tier</Text>
              <Text className="text-lg font-bold text-slate-900">
                {selectedBuyer.price_per_kg ? `₹${selectedBuyer.price_per_kg} / kg` : 'Standard Pricing'}
              </Text>
            </View>
            <Pressable 
              onPress={() => {
                setEditPricePerKg(selectedBuyer.price_per_kg ? selectedBuyer.price_per_kg.toString() : '');
                setIsPriceModalOpen(true);
              }}
              className="bg-indigo-50 px-4 py-2 rounded-lg active:bg-indigo-100"
            >
              <Text className="text-indigo-700 font-bold text-sm">Update Price</Text>
            </Pressable>
          </View>

          <View className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <View className="px-4 py-4 border-b border-gray-200 bg-gray-50 flex flex-row items-center justify-between">
              <Text className="font-semibold text-slate-900">Ledger History</Text>
              <Pressable className="flex flex-row items-center gap-1">
                <Download size={14} color="#4f46e5" />
                <Text className="text-xs font-medium text-indigo-600">Download PDF</Text>
              </Pressable>
            </View>
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
              <View className="flex flex-col">
                {renderLedgerRow({ isHeader: true })}
                {buyerLedgerData.map((row, i) => <React.Fragment key={i}>{renderLedgerRow({item: row})}</React.Fragment>)}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      );
    }

    return (
      <View className="flex-1 pb-20">
        <View className="flex flex-row items-center justify-between mb-6">
          <View className="flex-1 bg-white border border-gray-300 rounded-lg flex flex-row items-center px-3 mr-4 h-10">
            <Search size={16} color="#94a3b8" />
            <TextInput 
              placeholder="Search buyers..." 
              className="flex-1 ml-2 text-sm text-slate-900"
            />
          </View>
          <Pressable 
            onPress={() => setIsModalOpen(true)}
            className="flex flex-row items-center justify-center gap-2 px-4 h-10 bg-indigo-600 rounded-lg"
          >
            <Plus size={16} color="#ffffff" />
            <Text className="text-white text-sm font-medium">Add Buyer</Text>
          </Pressable>
        </View>

        <View className="border border-gray-200 rounded-2xl bg-white overflow-hidden">
          <FlatList
            data={buyers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => setSelectedBuyer(item)}
                className="flex flex-row items-center border-b border-gray-100 p-4 active:bg-slate-50"
              >
                <View className="w-12 h-12 bg-indigo-50 rounded-full items-center justify-center mr-4">
                  <Store size={24} color="#4f46e5" />
                </View>
                <View className="flex-1 flex flex-col justify-center gap-1">
                  <Text className="text-base font-bold text-slate-900 tracking-tight">{item.name}</Text>
                  <View className="flex flex-row items-center gap-2">
                    <Text className="text-xs font-bold" style={{ color: item.balance_pending > 0 ? '#e11d48' : '#059669' }}>
                      {item.balance_pending > 0 ? `₹${item.balance_pending.toLocaleString()} Due` : `₹${Math.abs(item.balance_pending).toLocaleString()} Adv`}
                    </Text>
                    <View className="w-1 h-1 rounded-full bg-slate-300" />
                    <Text className="text-xs font-bold text-amber-600">
                      +{item.cylinders_pending} Empties Owed
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}
          />
        </View>
      </View>
    );
  };

  const renderGlobalBills = () => (
    <View className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden mb-20">
      <View className="px-4 py-4 border-b border-gray-200 bg-gray-50 flex flex-row items-center justify-between">
        <Text className="font-semibold text-slate-900">Today's Sales Bills</Text>
        <Text className="text-sm text-slate-500 font-medium">{format(new Date(), 'MMM dd, yyyy')}</Text>
      </View>
      <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
        <View className="flex flex-col">
          <View className="flex flex-row bg-white border-b border-gray-200">
            <Text className="w-32 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill No / Time</Text>
            <Text className="w-40 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Retailer / Buyer</Text>
            <Text className="w-28 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Given</Text>
            <Text className="w-28 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Empty Collected</Text>
            <Text className="w-32 px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill Amount</Text>
          </View>
          
          {isGlobalBillsLoading ? (
            <View className="p-8 items-center justify-center w-full">
              <Text className="text-slate-500">Loading bills...</Text>
            </View>
          ) : !Array.isArray(globalBillsData) || globalBillsData.length === 0 ? (
            <View className="p-8 items-center justify-center w-full">
              <Text className="text-slate-500">No bills found today.</Text>
            </View>
          ) : (
            globalBillsData.map((item, index) => {
              let formattedTime = 'N/A';
              try {
                if (item?.time) {
                  formattedTime = format(new Date(item.time), 'hh:mm a');
                }
              } catch (e) {}

              return (
                <View key={item?.id || index} className="flex flex-row items-center border-b border-gray-100 bg-white">
                  <View className="w-32 px-4 py-4 flex flex-col justify-center">
                    <Text className="font-medium text-slate-900 text-sm">{item?.id ? String(item.id).substring(0,8) : 'N/A'}</Text>
                    <Text className="text-xs text-slate-500">{formattedTime}</Text>
                  </View>
                  <View className="w-40 px-4 py-4 flex justify-center">
                    <Text className="font-medium text-indigo-600 text-sm">{item?.buyer || 'N/A'}</Text>
                  </View>
                  <View className="w-28 px-4 py-4 justify-center items-center">
                    <View className="bg-emerald-50 px-2 py-1 rounded">
                      <Text className="font-mono font-medium text-emerald-600 text-sm">+{item?.fullGiven || 0}</Text>
                    </View>
                  </View>
                  <View className="w-28 px-4 py-4 justify-center items-center">
                    <View className="bg-amber-50 px-2 py-1 rounded">
                      <Text className="font-mono font-medium text-amber-600 text-sm">+{item?.emptyCollected || 0}</Text>
                    </View>
                  </View>
                  <Text className="w-32 px-4 py-4 text-right font-mono font-semibold text-slate-900">
                    ₹{item?.total ? Number(item.total).toLocaleString() : '0'}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50 p-4 pt-12">
      {/* Header & Tabs */}
        <View className="flex flex-col mb-4">
          <View className="mb-4">
            <Text className="text-2xl font-semibold text-slate-900">Buyers & Sales</Text>
            <Text className="text-slate-500 text-sm mt-1">Manage retailer accounts and daily sales records.</Text>
          </View>
          
          <View className="flex flex-row p-1 bg-gray-200 rounded-xl">
            <Pressable
              onPress={() => { setActiveTab('crm'); setSelectedBuyer(null); }}
              className="flex-1 py-2 items-center justify-center rounded-lg"
              style={activeTab === 'crm' ? { backgroundColor: '#ffffff', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 } : {}}
            >
              <Text className="text-sm font-medium" style={{ color: activeTab === 'crm' ? '#0f172a' : '#64748b' }}>Buyer CRM</Text>
            </Pressable>
            <Pressable
              onPress={() => { setActiveTab('bills'); setSelectedBuyer(null); }}
              className="flex-1 py-2 items-center justify-center rounded-lg"
              style={activeTab === 'bills' ? { backgroundColor: '#ffffff', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 } : {}}
            >
              <Text className="text-sm font-medium" style={{ color: activeTab === 'bills' ? '#0f172a' : '#64748b' }}>Global Daily Bills</Text>
            </Pressable>
          </View>
        </View>

        {activeTab === 'crm' ? renderBuyerCRM() : renderGlobalBills()}

        {/* Add Buyer Modal */}
        <Modal animationType="fade" transparent={true} visible={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
          <View className="flex-1 items-center justify-center p-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
            <View className="bg-white rounded-2xl w-full max-w-lg overflow-hidden max-h-[90%]">
              <View className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                <Text className="text-lg font-semibold text-slate-900">Add New Buyer</Text>
                <Pressable onPress={() => setIsModalOpen(false)} className="p-1 rounded-full">
                  <X size={20} color="#94a3b8" />
                </Pressable>
              </View>
              
              <ScrollView className="p-6">
                <View className="mb-6">
                  <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Business Details</Text>
                  
                  <View className="mb-4">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Shop Name</Text>
                    <TextInput value={newName} onChangeText={setNewName} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm" />
                  </View>
                  
                  <View className="mb-4">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Owner Name</Text>
                    <TextInput value={newOwner} onChangeText={setNewOwner} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm" />
                  </View>
                  
                  <View className="flex flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-slate-700 mb-1">Mobile</Text>
                      <TextInput value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-slate-700 mb-1">Address</Text>
                      <TextInput value={newAddress} onChangeText={setNewAddress} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm" />
                    </View>
                  </View>
                </View>

                <View className="h-px bg-gray-200 mb-6" />

                <View className="mb-4">
                  <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Opening Balances</Text>
                  <View className="flex flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Financial Balance (₹)</Text>
                    <TextInput value={newFinBal} onChangeText={setNewFinBal} keyboardType="numeric" placeholder="0" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm font-mono" />
                    <Text className="text-[10px] text-slate-500 mt-1">Amount they owe you.</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Cylinder Balance</Text>
                    <TextInput value={newCylBal} onChangeText={setNewCylBal} keyboardType="numeric" placeholder="0" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm font-mono" />
                    <Text className="text-[10px] text-slate-500 mt-1">Empties currently held.</Text>
                  </View>
                </View>
              </View>

              <View className="flex flex-row justify-end gap-3 mt-6 mb-4">
                <Pressable onPress={() => setIsModalOpen(false)} className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg">
                  <Text className="text-sm font-medium text-slate-700">Cancel</Text>
                </Pressable>
                <Pressable onPress={handleSaveBuyer} disabled={createBuyer.isPending} className="px-6 py-2.5 rounded-lg" style={{ backgroundColor: createBuyer.isPending ? '#818cf8' : '#4f46e5' }}>
                  <Text className="text-sm font-medium text-white">{createBuyer.isPending ? 'Saving...' : 'Save Buyer Profile'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Buyer Modal */}
      <Modal animationType="fade" transparent={true} visible={isEditModalOpen} onRequestClose={() => setIsEditModalOpen(false)}>
        <View className="flex-1 items-center justify-center p-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
          <View className="bg-white rounded-2xl w-full max-w-lg overflow-hidden max-h-[90%]">
            <View className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <Text className="text-lg font-semibold text-slate-900">Edit Buyer Profile</Text>
              <Pressable onPress={() => setIsEditModalOpen(false)} className="p-1 rounded-full">
                <X size={20} color="#94a3b8" />
              </Pressable>
            </View>
            
            <ScrollView className="p-6">
              <View className="mb-6">
                <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Business Details</Text>
                
                <View className="mb-4">
                  <Text className="text-sm font-medium text-slate-700 mb-1">Shop Name</Text>
                  <TextInput value={editName} onChangeText={setEditName} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm" />
                </View>
                
                <View className="mb-4">
                  <Text className="text-sm font-medium text-slate-700 mb-1">Owner Name</Text>
                  <TextInput value={editOwner} onChangeText={setEditOwner} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm" />
                </View>
                
                <View className="flex flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Mobile</Text>
                    <TextInput value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Address</Text>
                    <TextInput value={editAddress} onChangeText={setEditAddress} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm" />
                  </View>
                </View>
              </View>

              <View className="h-px bg-gray-200 mb-6" />

              <View className="mb-4">
                <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Opening Balances</Text>
                <View className="flex flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Financial Balance (₹)</Text>
                    <TextInput value={editFinBal} onChangeText={setEditFinBal} keyboardType="numeric" placeholder="0" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm font-mono" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Cylinder Balance</Text>
                    <TextInput value={editCylBal} onChangeText={setEditCylBal} keyboardType="numeric" placeholder="0" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm font-mono" />
                  </View>
                </View>
              </View>

              <View className="flex flex-row justify-between mt-6 mb-4 gap-3">
                <Pressable onPress={handleDeleteBuyer} disabled={deleteBuyer.isPending} className="px-4 py-2.5 bg-rose-50 border border-rose-100 rounded-lg flex-1 items-center justify-center">
                  <Text className="text-sm font-bold text-rose-600 flex flex-row items-center gap-2">
                    Delete
                  </Text>
                </Pressable>
                <Pressable onPress={handleEditBuyer} disabled={updateBuyer.isPending} className="px-6 py-2.5 flex-[2] items-center justify-center rounded-lg" style={{ backgroundColor: updateBuyer.isPending ? '#818cf8' : '#4f46e5' }}>
                  <Text className="text-sm font-medium text-white">{updateBuyer.isPending ? 'Saving...' : 'Update Buyer Profile'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Update Price Modal */}
      <Modal animationType="fade" transparent={true} visible={isPriceModalOpen} onRequestClose={() => setIsPriceModalOpen(false)}>
        <View className="flex-1 items-center justify-center p-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
          <View className="bg-white rounded-[24px] w-full max-w-md overflow-hidden">
            <View className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <Text className="text-lg font-bold text-slate-900">Update Custom Pricing</Text>
              <Pressable onPress={() => setIsPriceModalOpen(false)} className="p-1.5 rounded-full bg-slate-100">
                <X size={18} color="#64748b" />
              </Pressable>
            </View>
            
            <View className="p-6 flex flex-col gap-4">
              <Text className="text-sm text-slate-600 mb-2">
                Set a custom price per kg for this buyer. Item prices will be automatically calculated as (Capacity × Price/kg) for this buyer during billing. Leave blank to use standard pricing.
              </Text>
              
              <View>
                <Text className="text-sm font-bold text-slate-700 mb-1">Price per kg (₹)</Text>
                <TextInput 
                  placeholder="e.g. 50"
                  keyboardType="numeric"
                  value={editPricePerKg}
                  onChangeText={setEditPricePerKg}
                  className="w-full rounded-xl border-gray-300 border px-4 py-3 text-sm text-slate-900 bg-slate-50 font-mono"
                />
              </View>

              <Pressable 
                onPress={handleUpdatePrice}
                disabled={updateBuyer.isPending}
                className="w-full rounded-xl py-3.5 items-center justify-center mt-4"
                style={{ backgroundColor: updateBuyer.isPending ? '#818cf8' : '#4f46e5' }}
              >
                <Text className="text-white font-bold text-sm">
                  {updateBuyer.isPending ? 'Saving...' : 'Save Pricing'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
