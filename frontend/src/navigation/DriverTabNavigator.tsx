import React from 'react';
// Force Metro Bundler cache invalidation
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DeliveryScreen from '../screens/driver/DeliveryScreen';
import DebtCollectionScreen from '../screens/driver/DebtCollectionScreen';
import BillsScreen from '../screens/driver/BillsScreen';
import { useAuth } from '../context/AuthContext';
import { TouchableOpacity } from 'react-native';

const Tab = createBottomTabNavigator();

export default function DriverTabNavigator() {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#a1a1aa',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f4f4f5',
          minHeight: 65 + insets.bottom,
          paddingBottom: bottomPadding,
          paddingTop: 10,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f4f4f5',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#18181b',
        },
        headerRight: () => (
          <TouchableOpacity onPress={logout} className="mr-4">
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tab.Screen 
        name="Delivery" 
        component={DeliveryScreen} 
        options={{
          title: 'New Delivery',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="navigate-circle-outline" size={size} color={color} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Collections" 
        component={DebtCollectionScreen} 
        options={{
          title: 'Collections',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Bills" 
        component={BillsScreen} 
        options={{
          title: 'Bills',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }} 
      />
    </Tab.Navigator>
  );
}
