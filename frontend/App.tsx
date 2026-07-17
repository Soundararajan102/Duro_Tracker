import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { View, Text, ScrollView } from 'react-native';
import React from 'react';
import "./global.css"

const queryClient = new QueryClient();

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null, info: React.ErrorInfo | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, info.componentStack);
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center', padding: 20}}>
          <Text style={{color: 'red', fontSize: 18, fontWeight: 'bold'}}>Fatal Error Caught!</Text>
          <Text style={{color: 'black', marginTop: 10, fontWeight: 'bold'}}>{this.state.error?.message}</Text>
          <Text style={{color: 'gray', marginTop: 10, fontSize: 10}}>{this.state.info?.componentStack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
            <StatusBar style="dark" />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
