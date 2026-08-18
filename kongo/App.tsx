import 'react-native-url-polyfill/auto';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { CountryProvider } from './src/context/CountryContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <CountryProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </CountryProvider>
    </SafeAreaProvider>
  );
}
