import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AdminTabNavigator from './AdminTabNavigator';
import DriverTabNavigator from './DriverTabNavigator';
import LoginScreen from '../screens/auth/LoginScreen';

export default function RootNavigator() {
  const { userToken, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-zinc-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!userToken || !userRole) {
    return <LoginScreen />;
  }

  if (userRole === 'delivery' || userRole === 'driver') {
    return <DriverTabNavigator />;
  }

  // Fallback to Admin for superadmin or admin
  return <AdminTabNavigator />;
}
