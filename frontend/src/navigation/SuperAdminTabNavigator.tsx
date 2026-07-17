import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ShieldAlert } from 'lucide-react-native';
import SuperAdminDashboardStack from './SuperAdminDashboardStack';

export type SuperAdminTabParamList = {
  Dashboard: undefined;
};

const Tab = createBottomTabNavigator<SuperAdminTabParamList>();

export default function SuperAdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#f4f4f5',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#a1a1aa',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={SuperAdminDashboardStack} 
        options={{
          tabBarIcon: ({ color }) => <ShieldAlert size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
