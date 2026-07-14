import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, FlatList, Modal, TextInput } from 'react-native';
import { Plus, X, Search, Store, ArrowLeft, Download, FileText, Receipt } from 'lucide-react-native';

import { useBuyers } from '../../hooks/useBuyers';
import type { Buyer } from '../../types/api';

const globalBills = [
  { id: 'BL-1042', time: '10:45 AM', buyer: 'Metro Supermart', fullGiven: 20, emptyCollected: 18, total: 43000 },
  { id: 'BL-1043', time: '11:15 AM', buyer: 'Sharma Grocery', fullGiven: 5, emptyCollected: 5, total: 4750 },
  { id: 'BL-1044', time: '12:30 PM', buyer: 'A1 Gas Agency', fullGiven: 50, emptyCollected: 50, total: 107500 },
];

const buyerLedger = [
  { id: 'BL-1042', date: '24 Oct, 2023', type: 'bill', fullGiven: 20, emptyCollected: 18, amount: 43000, paid: 30000, finRunBal: 12500, cylRunBal: 45 },
  { id: 'PAY-892', date: '22 Oct, 2023', type: 'payment', fullGiven: 0, emptyCollected: 0, amount: 0, paid: 5000, finRunBal: -500, cylRunBal: 43 },
  { id: 'BL-1011', date: '18 Oct, 2023', type: 'bill', fullGiven: 10, emptyCollected: 10, amount: 21500, paid: 17000, finRunBal: 4500, cylRunBal: 43 },
];

export default function BuyersScreen() {
  const { data: buyers = [], isLoading } = useBuyers();
  const [activeTab, setActiveTab] = useState<'crm' | 'bills'>('crm');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);

  const renderLedgerRow = ({ item }: { item: typeof buyerLedger[0] }) => (
    <View className="flex flex-row items-center border-b border-gray-100 bg-white">
      <View className="w-32 px-4 py-4 flex flex-col justify-center">
        <Text className="font-medium text-slate-900 text-sm">{item.date}</Text>
        <Text className="text-xs text-slate-500">{item.id}</Text>
      </View>
      <View className="w-28 px-4 py-4 justify-center">
        <View className={`rounded-md px-2 py-1 items-center self-start ${item.type === 'bill' ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
          <Text className={`text-xs font-medium ${item.type === 'bill' ? 'text-indigo-700' : 'text-emerald-700'}`}>
            {item.type === 'bill' ? 'Sales Bill' : 'Payment'}
          </Text>
        </View>
      </View>
      <Text className="w-24 px-4 py-4 text-center font-mono text-sm text-slate-700">{item.fullGiven || '-'}</Text>
      <Text className="w-24 px-4 py-4 text-center font-mono text-sm text-slate-700">{item.emptyCollected || '-'}</Text>
      <View className="w-32 px-4 py-4 flex flex-col justify-center items-end">
        {item.type === 'bill' && <Text className="font-mono text-sm text-slate-900">₹{item.amount.toLocaleString()}</Text>}
        {item.paid > 0 && <Text className="font-mono text-xs text-emerald-600 mt-0.5">Paid ₹{item.paid.toLocaleString()}</Text>}
      </View>
      <Text className="w-28 px-4 py-4 text-right font-mono text-sm font-medium text-slate-900">₹{item.finRunBal.toLocaleString()}</Text>
      <Text className="w-24 px-4 py-4 text-right font-mono text-sm font-medium text-slate-700">{item.cylRunBal}</Text>
    </View>
  );

  const renderBuyerCRM = () => {
    if (selectedBuyer) {
      return (
        <ScrollView className="flex-1 pb-20">
          <View className="flex flex-row items-center gap-4 mb-6 mt-2">
            <Pressable 
              onPress={() => setSelectedBuyer(null)}
              className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              <ArrowLeft size={20} color="#475569" />
            </Pressable>
            <View>
              <Text className="text-xl font-bold text-slate-900">{selectedBuyer.name}</Text>
              <Text className="text-sm text-slate-500">{selectedBuyer.phone || 'No phone'}</Text>
            </View>
          </View>

          <View className="flex flex-row gap-4 mb-6">
            <View className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Financial Balance</Text>
                <Text className={`text-xl font-mono tracking-tight font-bold ${selectedBuyer.balance_pending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {selectedBuyer.balance_pending > 0 ? `₹${selectedBuyer.balance_pending.toLocaleString()} Due` : `₹${Math.abs(selectedBuyer.balance_pending).toLocaleString()} Adv`}
                </Text>
              </View>
              <View className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
                <Receipt size={20} color="#94a3b8" />
              </View>
            </View>
            
            <View className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-row items-center justify-between">
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

          <View className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <View className="px-4 py-4 border-b border-gray-200 bg-gray-50 flex flex-row items-center justify-between">
              <Text className="font-semibold text-slate-900">Ledger History</Text>
              <Pressable className="flex flex-row items-center gap-1">
                <Download size={14} color="#4f46e5" />
                <Text className="text-xs font-medium text-indigo-600">Download PDF</Text>
              </Pressable>
            </View>
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
              <View className="flex flex-col">
                <View className="flex flex-row bg-white border-b border-gray-200">
                  <Text className="w-32 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date / Ref</Text>
                  <Text className="w-28 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</Text>
                  <Text className="w-24 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Given</Text>
                  <Text className="w-24 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Empty Coll.</Text>
                  <Text className="w-32 px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount/Paid</Text>
                  <Text className="w-28 px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Fin. Bal</Text>
                  <Text className="w-24 px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Cyl. Bal</Text>
                </View>
                {buyerLedger.map((row, i) => <React.Fragment key={i}>{renderLedgerRow({item: row})}</React.Fragment>)}
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
            className="flex flex-row items-center justify-center gap-2 px-4 h-10 bg-indigo-600 rounded-lg shadow-sm"
          >
            <Plus size={16} color="#ffffff" />
            <Text className="text-white text-sm font-medium">Add Buyer</Text>
          </Pressable>
        </View>

        <View className="border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm">
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
                <View className="flex-1">
                  <Text className="text-base font-bold text-slate-900">{item.name}</Text>
                  <Text className="text-sm text-slate-500">{item.phone || 'No phone'}</Text>
                </View>
                <View className="items-end mr-6">
                  <Text className="text-xs text-slate-500 font-medium mb-1">Financial</Text>
                  <Text className={`font-mono font-bold text-sm ${item.balance_pending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {item.balance_pending > 0 ? `₹${item.balance_pending.toLocaleString()} Due` : `₹${Math.abs(item.balance_pending).toLocaleString()} Adv`}
                  </Text>
                </View>
                <View className="items-end w-24">
                  <Text className="text-xs text-slate-500 font-medium mb-1">Cylinders</Text>
                  <Text className="font-mono font-bold text-sm text-slate-900">{item.cylinders_pending}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      </View>
    );
  };

  const renderGlobalBills = () => (
    <View className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-20">
      <View className="px-4 py-4 border-b border-gray-200 bg-gray-50 flex flex-row items-center justify-between">
        <Text className="font-semibold text-slate-900">Today's Sales Bills</Text>
        <Text className="text-sm text-slate-500 font-medium">Oct 24, 2023</Text>
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
          
          <FlatList
            data={globalBills}
            keyExtractor={b => b.id}
            renderItem={({item}) => (
              <View className="flex flex-row items-center border-b border-gray-100 bg-white">
                <View className="w-32 px-4 py-4 flex flex-col justify-center">
                  <Text className="font-medium text-slate-900 text-sm">{item.id}</Text>
                  <Text className="text-xs text-slate-500">{item.time}</Text>
                </View>
                <View className="w-40 px-4 py-4 flex justify-center">
                  <Text className="font-medium text-indigo-600 text-sm">{item.buyer}</Text>
                </View>
                <View className="w-28 px-4 py-4 justify-center items-center">
                  <View className="bg-emerald-50 px-2 py-1 rounded">
                    <Text className="font-mono font-medium text-emerald-600 text-sm">+{item.fullGiven}</Text>
                  </View>
                </View>
                <View className="w-28 px-4 py-4 justify-center items-center">
                  <View className="bg-amber-50 px-2 py-1 rounded">
                    <Text className="font-mono font-medium text-amber-600 text-sm">+{item.emptyCollected}</Text>
                  </View>
                </View>
                <Text className="w-32 px-4 py-4 text-right font-mono font-semibold text-slate-900">
                  ₹{item.total.toLocaleString()}
                </Text>
              </View>
            )}
          />
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
            className={`flex-1 py-2 items-center justify-center rounded-lg ${activeTab === 'crm' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`text-sm font-medium ${activeTab === 'crm' ? 'text-slate-900' : 'text-slate-500'}`}>Buyer CRM</Text>
          </Pressable>
          <Pressable
            onPress={() => { setActiveTab('bills'); setSelectedBuyer(null); }}
            className={`flex-1 py-2 items-center justify-center rounded-lg ${activeTab === 'bills' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`text-sm font-medium ${activeTab === 'bills' ? 'text-slate-900' : 'text-slate-500'}`}>Global Daily Bills</Text>
          </Pressable>
        </View>
      </View>

      {activeTab === 'crm' ? renderBuyerCRM() : renderGlobalBills()}

      {/* Add Buyer Modal */}
      <Modal animationType="fade" transparent={true} visible={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <View className="flex-1 items-center justify-center p-4 bg-slate-900/50">
          <View className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90%]">
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
                  <TextInput className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm" />
                </View>
                
                <View className="mb-4">
                  <Text className="text-sm font-medium text-slate-700 mb-1">Owner Name</Text>
                  <TextInput className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm" />
                </View>
                
                <View className="flex flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Mobile</Text>
                    <TextInput keyboardType="phone-pad" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Address</Text>
                    <TextInput className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm" />
                  </View>
                </View>
              </View>

              <View className="h-px bg-gray-200 mb-6" />

              <View className="mb-4">
                <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Opening Balances</Text>
                <View className="flex flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Financial Balance (₹)</Text>
                    <TextInput keyboardType="numeric" placeholder="0" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm font-mono" />
                    <Text className="text-[10px] text-slate-500 mt-1">Amount they owe you.</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Cylinder Balance</Text>
                    <TextInput keyboardType="numeric" placeholder="0" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm font-mono" />
                    <Text className="text-[10px] text-slate-500 mt-1">Empties currently held.</Text>
                  </View>
                </View>
              </View>

              <View className="flex flex-row justify-end gap-3 mt-6 mb-4">
                <Pressable onPress={() => setIsModalOpen(false)} className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg">
                  <Text className="text-sm font-medium text-slate-700">Cancel</Text>
                </Pressable>
                <Pressable onPress={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-indigo-600 rounded-lg">
                  <Text className="text-sm font-medium text-white">Save Buyer Profile</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
