import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    try {
      // Create x-www-form-urlencoded data for OAuth2
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/login`, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token } = response.data;
      await login(access_token);
    } catch (error: any) {
      console.error('Login error', error);
      Alert.alert('Login Failed', error.response?.data?.detail || 'Invalid credentials or server error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-zinc-900 justify-center items-center px-6"
    >
      <View className="w-full max-w-sm space-y-6">
        <View className="items-center mb-8">
          <Text className="text-4xl font-bold text-white mb-2 tracking-tight">Duro Tracker</Text>
          <Text className="text-zinc-400 text-base">Sign in to your account</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-zinc-400 text-sm mb-1.5 font-medium">Username</Text>
            <TextInput
              className="bg-zinc-800 text-white px-4 py-3.5 rounded-xl border border-zinc-700 focus:border-blue-500"
              placeholder="Enter your username"
              placeholderTextColor="#71717a"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View>
            <Text className="text-zinc-400 text-sm mb-1.5 font-medium">Password</Text>
            <TextInput
              className="bg-zinc-800 text-white px-4 py-3.5 rounded-xl border border-zinc-700 focus:border-blue-500"
              placeholder="Enter your password"
              placeholderTextColor="#71717a"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity 
          className={`w-full py-4 rounded-xl items-center mt-6 ${isLoading ? 'bg-blue-600/50' : 'bg-blue-600 active:bg-blue-700'}`}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-lg">Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
