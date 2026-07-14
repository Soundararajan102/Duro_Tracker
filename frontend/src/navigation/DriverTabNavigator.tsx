import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DeliveryScreen from '../screens/driver/DeliveryScreen';
import HistoryScreen from '../screens/driver/HistoryScreen';
import { useAuth } from '../context/AuthContext';
import { TouchableOpacity } from 'react-native';

const Tab = createBottomTabNavigator();

export default function DriverTabNavigator() {
  const { logout } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#a1a1aa',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f4f4f5',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
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
        name="History" 
        component={HistoryScreen} 
        options={{
          title: 'Route History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }} 
      />
    </Tab.Navigator>
  );
}
