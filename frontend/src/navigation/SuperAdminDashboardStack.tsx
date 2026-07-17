import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SuperAdminDashboard from '../screens/superadmin/SuperAdminDashboard';
import ManageOrganizationScreen from '../screens/superadmin/ManageOrganizationScreen';

export type SuperAdminDashboardStackParamList = {
  DashboardHome: undefined;
  ManageOrganization: { orgId: string; orgName: string };
};

const Stack = createNativeStackNavigator<SuperAdminDashboardStackParamList>();

export default function SuperAdminDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={SuperAdminDashboard} />
      <Stack.Screen 
        name="ManageOrganization" 
        component={ManageOrganizationScreen} 
        options={{
          headerShown: true,
          title: 'Manage Organization',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}
