import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ShieldAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SuperAdminDashboardStack from './SuperAdminDashboardStack';

export type SuperAdminTabParamList = {
  Dashboard: undefined;
};

const Tab = createBottomTabNavigator<SuperAdminTabParamList>();

export default function SuperAdminTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#f4f4f5',
          minHeight: 65 + insets.bottom,
          paddingBottom: bottomPadding,
          paddingTop: 10,
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
