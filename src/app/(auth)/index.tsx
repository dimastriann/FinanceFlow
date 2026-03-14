import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { GlassCard } from '../../components/common/GlassCard';
import { CustomButton } from '../../components/common/CustomButton';
import { CustomInput } from '../../components/common/CustomInput';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuthenticate = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      router.replace('/(tabs)');
      return;
    }

    const { success } = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Finance Flow',
      fallbackLabel: 'Use Passcode',
    });

    if (success) {
      router.replace('/(tabs)');
    }
  };

  const handleAuthAction = () => {
    // Simple bypass for UI flow simulation
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#0A0A0A]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        className="px-6"
      >
        <View className="mb-10 items-center">
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-3xl bg-accent shadow-2xl shadow-accent/50">
            <Ionicons name="wallet" size={40} color="#FFF" />
          </View>
          <Text className="mb-2 text-4xl font-bold text-white">
            Finance Flow
          </Text>
          <Text className="text-center text-gray-500">
            Smart. Secure. Private.
          </Text>
        </View>

        <GlassCard intensity={25} className="p-6">
          <View className="mb-8 flex-row rounded-xl bg-white/5 p-1">
            <TouchableOpacity
              onPress={() => setIsLogin(true)}
              className={`flex-1 items-center rounded-lg py-3 ${isLogin ? 'bg-accent shadow-sm' : ''}`}
            >
              <Text
                className={`font-semibold ${isLogin ? 'text-white' : 'text-gray-400'}`}
              >
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsLogin(false)}
              className={`flex-1 items-center rounded-lg py-3 ${!isLogin ? 'bg-accent shadow-sm' : ''}`}
            >
              <Text
                className={`font-semibold ${!isLogin ? 'text-white' : 'text-gray-400'}`}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <CustomInput
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <CustomInput
            label="Email Address"
            placeholder="hello@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <CustomInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <CustomButton
            title={isLogin ? 'Sign In' : 'Create Account'}
            onPress={handleAuthAction}
            className="mt-4"
          />

          <View className="my-6 flex-row items-center">
            <View className="h-[1px] flex-1 bg-white/10" />
            <Text className="px-4 text-xs font-medium uppercase text-gray-500">
              Or continue with
            </Text>
            <View className="h-[1px] flex-1 bg-white/10" />
          </View>

          <CustomButton
            title="Biometric Unlock"
            variant="outline"
            onPress={handleAuthenticate}
          />
        </GlassCard>

        <Text className="mt-8 px-10 text-center text-xs text-gray-600">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
