import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { CustomInput } from '../components/common/CustomInput';
import { CustomButton } from '../components/common/CustomButton';
import { GlassCard } from '../components/common/GlassCard';
import { useExpenseStore, Category } from '../store/useExpenseStore';
import { parseReceipt } from '../core/api/gemini';

const CategoryButton: React.FC<{
  cat: Category;
  selected: boolean;
  onPress: () => void;
}> = ({ cat, selected, onPress }) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(selected ? 1.05 : 1);
  }, [selected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      className="w-1/3 p-1"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View style={animatedStyle}>
        <GlassCard
          intensity={selected ? 60 : 10}
          className={`items-center border py-4 ${selected ? 'border-accent' : 'border-white/5'}`}
        >
          <Text className="mb-1 text-2xl">{cat.icon}</Text>
          <Text
            className={`text-[10px] font-bold uppercase tracking-tight ${selected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {cat.name}
          </Text>
        </GlassCard>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function AddExpenseScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {
    expenses,
    addExpense,
    categories,
    monthlyBudget,
    categoryBudgets,
    formatCurrency,
  } = useExpenseStore();

  const [amount, setAmount] = React.useState('');
  const [merchant, setMerchant] = React.useState('');
  const [note, setNote] = React.useState('');
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<
    string | null
  >(categories.length > 0 ? categories[0].id : null);
  const [loading, setLoading] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);

  const handleScan = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].base64) {
      setIsScanning(true);
      try {
        const parsed = await parseReceipt(result.assets[0].uri);
        if (parsed) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setAmount(parsed.amount.toString());
          setMerchant(parsed.merchant);
          const matchedCat = categories.find(
            (c) => c.name.toLowerCase() === parsed.category.toLowerCase()
          );
          if (matchedCat) setSelectedCategoryId(matchedCat.id);
        }
      } catch (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        console.error('Scan failed:', error);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    if (!selectedCategoryId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    try {
      addExpense({
        amount: parseFloat(amount),
        merchant,
        note,
        categoryId: selectedCategoryId,
        date: new Date().getTime(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#F5F5F7] dark:bg-[#0A0A0A]"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
      >
        <Animated.View
          entering={FadeInDown.duration(600)}
          layout={Layout.springify()}
        >
          <View className="mb-10 mt-4 items-center">
            <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Enter Amount
            </Text>
            <View className="flex-row items-center">
              <Text className="mr-2 text-3xl font-bold text-gray-900 opacity-50 dark:text-white">
                $
              </Text>
              <CustomInput
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                className="mb-0"
                style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  minWidth: 150,
                  textAlign: 'center',
                }}
                placeholderTextColor={
                  isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }
              />
            </View>

            {/* Budget Warning */}
            {(() => {
              const val = parseFloat(amount);
              if (isNaN(val) || val <= 0) return null;

              const totalSpent = expenses.reduce((acc, e) => acc + e.amount, 0);
              const catSpent = selectedCategoryId
                ? expenses
                    .filter((e) => e.categoryId === selectedCategoryId)
                    .reduce((acc, e) => acc + e.amount, 0)
                : 0;
              const catBudget = selectedCategoryId
                ? categoryBudgets[selectedCategoryId]
                : 0;

              const overMonthly = totalSpent + val > monthlyBudget;
              const overCategory = catBudget > 0 && catSpent + val > catBudget;

              if (overMonthly || overCategory) {
                return (
                  <View className="bg-error/10 border-error/20 mt-4 flex-row items-center rounded-xl border px-4 py-2">
                    <Ionicons name="warning" size={16} color="#FF3B30" />
                    <Text className="text-error ml-2 text-xs font-bold">
                      Budget Alert: Exceeds {overMonthly ? 'monthly' : ''}
                      {overMonthly && overCategory ? ' and ' : ''}
                      {overCategory ? 'category' : ''} limit!
                    </Text>
                  </View>
                );
              }
              return null;
            })()}
          </View>

          <TouchableOpacity
            onPress={handleScan}
            activeOpacity={0.8}
            className="mb-10"
          >
            <GlassCard
              intensity={30}
              className="flex-row items-center justify-center border-accent/20 py-6"
            >
              {isScanning ? (
                <View className="flex-row items-center">
                  <ActivityIndicator color="#007AFF" />
                  <Text className="ml-3 font-bold text-accent">
                    AI is analyzing...
                  </Text>
                </View>
              ) : (
                <>
                  <Ionicons name="scan" size={24} color="#007AFF" />
                  <Text className="ml-3 text-base font-bold text-accent">
                    Scan Receipt with AI
                  </Text>
                </>
              )}
            </GlassCard>
          </TouchableOpacity>

          <View className="mb-8">
            <Text className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              Details
            </Text>
            <CustomInput
              label="Merchant"
              placeholder="e.g. Apple, Starbucks"
              value={merchant}
              onChangeText={setMerchant}
            />
            <CustomInput
              label="Note"
              placeholder="What was this for?"
              value={note}
              onChangeText={setNote}
              multiline
            />
          </View>

          <View className="mb-10">
            <Text className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              Category
            </Text>
            <View className="-mx-1 flex-row flex-wrap">
              {categories.map((cat) => (
                <CategoryButton
                  key={cat.id}
                  cat={cat}
                  selected={selectedCategoryId === cat.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedCategoryId(cat.id);
                  }}
                />
              ))}
            </View>
          </View>

          <CustomButton
            title="Confirm Transaction"
            onPress={handleSave}
            loading={loading}
            disabled={!amount}
            className="mb-10 shadow-2xl shadow-accent/40"
          />
        </Animated.View>
      </ScrollView>

      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute left-6 top-12 h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/5"
      >
        <Ionicons
          name="close"
          size={24}
          color={colorScheme === 'dark' ? '#FFF' : '#000'}
        />
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
