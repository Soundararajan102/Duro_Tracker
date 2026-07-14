import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Package, ShoppingCart, Warehouse, Users, Settings } from 'lucide-react-native';

import DashboardScreen from '../screens/admin/DashboardScreen';
import ItemsScreen from '../screens/admin/ItemsScreen';
import PurchasesScreen from '../screens/admin/PurchasesScreen';
import InventoryScreen from '../screens/admin/InventoryScreen';
import BuyersScreen from '../screens/admin/BuyersScreen';
import SettingsScreen from '../screens/admin/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5', // indigo-600
        tabBarInactiveTintColor: '#94a3b8', // slate-400
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 20,
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={22} strokeWidth={2.5} />,
        }}
      />
      <Tab.Screen 
        name="Items" 
        component={ItemsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Package color={color} size={22} strokeWidth={2.5} />,
        }}
      />
      <Tab.Screen 
        name="Purchases" 
        component={PurchasesScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={22} strokeWidth={2.5} />,
        }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Warehouse color={color} size={22} strokeWidth={2.5} />,
        }}
      />
      <Tab.Screen 
        name="Buyers" 
        component={BuyersScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color} size={22} strokeWidth={2.5} />,
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Settings color={color} size={22} strokeWidth={2.5} />,
        }}
      />
    </Tab.Navigator>
  );
}
