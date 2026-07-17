import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SuperAdminDashboardStackParamList } from '../../navigation/SuperAdminDashboardStack';
import { useCreateTenantAdmin } from '../../hooks/useSuperAdmin';

type Props = NativeStackScreenProps<SuperAdminDashboardStackParamList, 'ManageOrganization'>;

export default function ManageOrganizationScreen({ route, navigation }: Props) {
  const { orgId, orgName } = route.params;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const createAdminMutation = useCreateTenantAdmin();

  const handleCreateAdmin = () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    createAdminMutation.mutate(
      {
        orgId,
        data: { username, password, role: 'tenant_admin' },
      },
      {
        onSuccess: () => {
          Alert.alert('Success', `Admin '${username}' successfully created!`);
          setUsername('');
          setPassword('');
        },
        onError: (error: any) => {
          Alert.alert('Error', error.response?.data?.detail || 'Failed to create admin');
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Admin to {orgName}</Text>
      
      <View style={styles.formCard}>
        <Text style={styles.label}>Admin Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="e.g., store_admin1"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Temporary Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password123"
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.createButton} 
          onPress={handleCreateAdmin}
          disabled={createAdminMutation.isPending}
        >
          {createAdminMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.createButtonText}>Create Tenant Admin</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#0f172a',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
