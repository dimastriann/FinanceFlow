import * as React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../../drizzle/migrations';
import { db } from '../db/client';
import { useExpenseStore } from '../store/useExpenseStore';
import { useColorScheme, NativeWindStyleSheet } from 'nativewind';
import '../styles/global.css';

// Configure NativeWind output for native
NativeWindStyleSheet.setOutput({
  default: 'native',
});

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const initialize = useExpenseStore((state) => state.initialize);
  const loading = useExpenseStore((state) => state.loading);
  const userSettings = useExpenseStore((state) => state.userSettings);
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();

  // Sync theme with NativeWind
  React.useEffect(() => {
    if (userSettings?.theme) {
      const theme = userSettings.theme as 'light' | 'dark';
      console.log('[Theme] Setting color scheme to:', theme);
      setColorScheme(theme);
      NativeWindStyleSheet.setColorScheme(theme);
    }
  }, [userSettings?.theme]);

  // Initialize store
  React.useEffect(() => {
    if (success) {
      initialize();
    }
  }, [success, initialize]);

  // Handle session lock
  React.useEffect(() => {
    if (userSettings?.isBiometricEnabled && !loading) {
      router.replace('/lock');
    }
  }, [userSettings?.isBiometricEnabled, loading]);

  const isDark = (userSettings?.theme || colorScheme) === 'dark';
  const backgroundColor = isDark ? '#0A0A0A' : '#F5F5F7';

  if ((!success && !error) || loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#0A0A0A' : '#F5F5F7',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    console.error('Migration error:', error);
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="lock" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="add-expense"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="budget"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
