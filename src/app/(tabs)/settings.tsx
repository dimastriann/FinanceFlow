import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useExpenseStore } from '../../store/useExpenseStore';
import { GlassCard } from '../../components/common/GlassCard';
import * as exportUtils from '../../utils/exportUtils';

interface SettingItemProps {
  icon: string;
  iconColor: string;
  label: string;
  value?: string;
  type?: 'toggle' | 'arrow';
  isLast?: boolean;
  onPress?: () => void;
}

const SettingItem = ({
  icon,
  iconColor,
  label,
  value,
  type = 'arrow',
  isLast = false,
  onPress,
  isDark,
}: SettingItemProps & { isDark?: boolean }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className={`flex-row items-center py-4 ${!isLast ? 'border-b border-gray-100 dark:border-white/5' : ''}`}
  >
    <View
      style={{ backgroundColor: `${iconColor}20` }}
      className="mr-4 h-10 w-10 items-center justify-center rounded-xl"
    >
      <Ionicons name={icon as any} size={20} color={iconColor} />
    </View>
    <Text className="flex-1 text-base font-medium text-gray-900 dark:text-white">
      {label}
    </Text>
    {type === 'toggle' ? (
      <Switch
        value={true}
        trackColor={{ false: '#333', true: iconColor }}
        thumbColor="#FFF"
      />
    ) : (
      <View className="flex-row items-center">
        {value && (
          <Text className="mr-2 text-sm text-gray-500 dark:text-gray-400">
            {value}
          </Text>
        )}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={iconColor === '#FF3B30' ? '#FF3B30' : isDark ? '#555' : '#CCC'}
        />
      </View>
    )}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const {
    userSettings,
    updateProfile,
    setCurrency,
    setTheme,
    toggleBiometric,
    initialize,
  } = useExpenseStore();
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempName, setTempName] = React.useState(userSettings.userName);
  const [exportModalVisible, setExportModalVisible] = React.useState(false);
  const [selectedPeriod, setSelectedPeriod] =
    React.useState<exportUtils.ExportType>('monthly');
  const [isExporting, setIsExporting] = React.useState(false);

  const handleLogout = () => {
    router.replace('/(auth)');
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      updateProfile(tempName.trim());
      setIsEditing(false);
    }
  };

  const initials = userSettings.userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isDark = userSettings.theme === 'dark';

  return (
    <ScrollView
      className="flex-1 px-6 pb-32 pt-16"
      style={{ backgroundColor: isDark ? '#0A0A0A' : '#F5F5F7' }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
        Profile
      </Text>

      <View className="mb-10 items-center">
        <TouchableOpacity
          onPress={() => setIsEditing(true)}
          className="mb-4 h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-accent shadow-2xl shadow-accent/40 dark:border-white/5"
        >
          <Text className="text-3xl font-bold text-white">{initials}</Text>
          <View className="bg-success absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-4 border-white dark:border-[#0A0A0A]">
            <Ionicons name="pencil" size={14} color="#FFF" />
          </View>
        </TouchableOpacity>

        {isEditing ? (
          <View className="mt-2 w-full flex-row items-center rounded-xl border border-gray-300 bg-gray-200 px-4 dark:border-white/10 dark:bg-white/5">
            <TextInput
              className="flex-1 py-2 text-xl font-bold text-gray-900 dark:text-white"
              value={tempName}
              onChangeText={setTempName}
              autoFocus
              onBlur={handleSaveName}
              onSubmitEditing={handleSaveName}
            />
            <TouchableOpacity onPress={handleSaveName}>
              <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {userSettings.userName}
            </Text>
          </TouchableOpacity>
        )}
        <Text className="mt-1 font-medium text-gray-500 dark:text-gray-400">
          Premium Member
        </Text>
      </View>

      <View className="mb-8">
        <Text className="mb-4 ml-1 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Account Settings
        </Text>
        <GlassCard intensity={10} className="p-0 px-4">
          <SettingItem
            isDark={isDark}
            icon="pie-chart"
            iconColor="#FF2D55"
            label="Budgeting"
            value="Set Limits"
            onPress={() => router.push('/budget')}
          />
          <SettingItem
            isDark={isDark}
            icon="person"
            iconColor="#007AFF"
            label="Personal Information"
          />
          <SettingItem
            icon="card"
            iconColor="#5856D6"
            label="Payment Methods"
            value="Visa ••••"
          />
          <SettingItem
            icon="notifications"
            iconColor="#FF9500"
            label="Notifications"
            isLast
          />
        </GlassCard>
      </View>

      <View className="mb-8">
        <Text className="mb-4 ml-1 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Security & Privacy
        </Text>
        <GlassCard intensity={10} className="p-0 px-4">
          <View className="flex-row items-center border-b border-gray-100 py-4 dark:border-white/5">
            <View className="bg-success/20 mr-4 h-10 w-10 items-center justify-center rounded-xl">
              <Ionicons name="finger-print" size={20} color="#34C759" />
            </View>
            <Text className="flex-1 text-base font-medium text-gray-900 dark:text-white">
              Biometric Unlock
            </Text>
            <Switch
              value={userSettings.isBiometricEnabled}
              onValueChange={async (val) => {
                try {
                  await toggleBiometric(val);
                } catch (err: any) {
                  Alert.alert(
                    'Security Error',
                    err.message || 'Could not enable biometrics'
                  );
                }
              }}
              trackColor={{ false: '#333', true: '#34C759' }}
              thumbColor="#FFF"
            />
          </View>
          <SettingItem
            icon="lock-closed"
            iconColor="#FF3B30"
            label="Two-Factor Auth"
            isLast
          />
        </GlassCard>
      </View>

      <View className="mb-10">
        <Text className="mb-4 ml-1 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          App Settings
        </Text>
        <GlassCard intensity={10} className="p-0 px-4">
          <SettingItem
            isDark={isDark}
            icon="color-palette"
            iconColor="#AF52DE"
            label="Appearance"
            value={userSettings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            onPress={() => {
              const newTheme = userSettings.theme === 'dark' ? 'light' : 'dark';
              setTheme(newTheme);
            }}
          />
          <SettingItem
            isDark={isDark}
            icon="earth"
            iconColor="#007AFF"
            label="Currency"
            value={
              userSettings.currency === 'USD'
                ? 'USD ($)'
                : userSettings.currency === 'IDR'
                  ? 'IDR (Rp)'
                  : 'EUR (€)'
            }
            onPress={() => {
              Alert.alert('Select Currency', 'Choose your preferred currency', [
                { text: 'USD ($)', onPress: () => setCurrency('USD') },
                { text: 'IDR (Rp)', onPress: () => setCurrency('IDR') },
                { text: 'EUR (€)', onPress: () => setCurrency('EUR') },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          />
          <SettingItem
            isDark={isDark}
            icon="help-circle"
            iconColor="#8E8E93"
            label="Help & Support"
            isLast
          />
        </GlassCard>
      </View>

      <View className="mb-10">
        <Text className="mb-4 ml-1 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Data Management
        </Text>
        <GlassCard intensity={10} className="p-0 px-4">
          <SettingItem
            isDark={isDark}
            icon="share-outline"
            iconColor="#007AFF"
            label="Export Report"
            onPress={() => setExportModalVisible(true)}
          />
          <SettingItem
            isDark={isDark}
            icon="cloud-upload-outline"
            iconColor="#34C759"
            label="Backup Data"
            onPress={async () => {
              try {
                await exportUtils.backupData();
              } catch (err: any) {
                Alert.alert('Backup Error', err.message);
              }
            }}
          />
          <SettingItem
            isDark={isDark}
            icon="cloud-download-outline"
            iconColor="#FF9500"
            label="Restore Data"
            isLast
            onPress={async () => {
              Alert.alert(
                'Restore Data',
                'This will overwrite all current data. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Restore',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const success = await exportUtils.restoreData();
                        if (success) {
                          await initialize();
                          Alert.alert('Success', 'Data restored successfully');
                        }
                      } catch (err: any) {
                        Alert.alert('Restore Error', err.message);
                      }
                    },
                  },
                ]
              );
            }}
          />
        </GlassCard>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        className="dark:bg-error/10 bg-error/5 dark:border-error/20 border-error/10 mb-20 flex-row items-center justify-center rounded-2xl border py-4 dark:border-white/20"
      >
        <Ionicons name="log-out" size={20} color="#FF3B30" />
        <Text className="text-error ml-2 text-base font-bold dark:text-white">
          Sign Out
        </Text>
      </TouchableOpacity>

      <View className="items-center pb-20">
        <Text className="text-xs font-bold text-gray-400 dark:text-gray-600">
          FINANCE FLOW v1.0.0
        </Text>
        <Text className="mt-1 text-[10px] uppercase tracking-tighter text-gray-500 dark:text-gray-700">
          Powered by Google Gemini AI
        </Text>
      </View>

      <Modal
        visible={exportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-6 dark:bg-[#1A1A1A]">
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Export Report
              </Text>
              <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-500">
              Period
            </Text>
            <View className="mb-6 flex-row flex-wrap gap-2">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setSelectedPeriod(p)}
                  className={`rounded-xl px-4 py-2 ${selectedPeriod === p ? 'bg-accent' : 'bg-gray-100 dark:bg-white/5'}`}
                >
                  <Text
                    className={`font-bold ${selectedPeriod === p ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}
                  >
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-500">
              Choose Format
            </Text>
            <View className="gap-3">
              {[
                {
                  id: 'csv',
                  label: 'CSV (Spreadsheet)',
                  icon: 'document-text',
                  color: '#007AFF',
                },
                {
                  id: 'xlsx',
                  label: 'Excel (XLSX)',
                  icon: 'grid',
                  color: '#34C759',
                },
                {
                  id: 'pdf',
                  label: 'PDF Report',
                  icon: 'document',
                  color: '#FF3B30',
                },
              ].map((f) => (
                <TouchableOpacity
                  key={f.id}
                  disabled={isExporting}
                  onPress={async () => {
                    setIsExporting(true);
                    try {
                      await exportUtils.exportReport(
                        selectedPeriod,
                        f.id as any
                      );
                      setExportModalVisible(false);
                    } catch (err: any) {
                      Alert.alert('Export Error', err.message);
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                  className="flex-row items-center rounded-2xl bg-gray-100 p-4 dark:bg-white/5"
                >
                  <View
                    style={{ backgroundColor: `${f.color}20` }}
                    className="mr-4 h-10 w-10 items-center justify-center rounded-xl"
                  >
                    <Ionicons name={f.icon as any} size={20} color={f.color} />
                  </View>
                  <Text className="text-base font-bold text-gray-900 dark:text-white">
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
