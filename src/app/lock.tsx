import * as React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExpenseStore } from '../store/useExpenseStore';
import { GlassCard } from '../components/common/GlassCard';
import * as Haptics from 'expo-haptics';

export default function LockScreen() {
  const router = useRouter();
  const { userSettings } = useExpenseStore();
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // If not available, we could fallback to PIN or just let them in if they managed to enable it somehow incorrectly
        router.replace('/(tabs)');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock FinanceFlow',
        fallbackLabel: 'Enter Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  React.useEffect(() => {
    handleAuthenticate();
  }, []);

  const initials = userSettings.userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View className="flex-1 items-center justify-center bg-[#F5F5F7] px-6 dark:bg-[#0A0A0A]">
      <View className="mb-12 items-center">
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-3xl bg-accent shadow-2xl shadow-accent/40">
          <Ionicons name="lock-closed" size={48} color="#FFF" />
        </View>
        <Text className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          FinanceFlow Locked
        </Text>
        <Text className="px-8 text-center font-medium text-gray-500">
          Please use biometrics to unlock and access your account.
        </Text>
      </View>

      <TouchableOpacity onPress={handleAuthenticate} className="mb-8 w-full">
        <GlassCard
          intensity={20}
          className="items-center border-gray-200 py-5 dark:border-white/10"
        >
          <Ionicons name="finger-print" size={32} color="#007AFF" />
          <Text className="mt-2 text-lg font-bold text-accent">
            Tap to Authenticate
          </Text>
        </GlassCard>
      </TouchableOpacity>

      <View className="absolute bottom-16 items-center">
        <View className="mb-4 h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-white/5">
          <Text className="font-bold text-gray-900 dark:text-white">
            {initials}
          </Text>
        </View>
        <Text className="text-xs font-bold uppercase tracking-widest text-gray-500">
          {userSettings.userName}
        </Text>
      </View>
    </View>
  );
}
