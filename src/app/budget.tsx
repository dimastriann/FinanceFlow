import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useExpenseStore, Category } from '../store/useExpenseStore';
import { GlassCard } from '../components/common/GlassCard';
import { CustomInput } from '../components/common/CustomInput';
import { CustomButton } from '../components/common/CustomButton';

const CategoryBudgetCard: React.FC<{
  cat: Category;
  budget: number;
  spent: number;
  formatCurrency: (a: number) => string;
  onSetBudget: (amount: string) => void;
}> = ({ cat, budget, spent, formatCurrency, onSetBudget }) => {
  const progress = budget > 0 ? Math.min(spent / budget, 1) : 0;
  const isOverBudget = spent > budget && budget > 0;

  return (
    <GlassCard
      intensity={10}
      className="mb-4 border-gray-100 p-4 dark:border-white/5"
    >
      <View className="mb-3 flex-row items-center">
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${cat.color}20` }}
        >
          <Text className="text-xl">{cat.icon}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-bold text-gray-900 dark:text-white">
            {cat.name}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Spent: {formatCurrency(spent)}
          </Text>
        </View>
        <View className="w-32">
          <TextInput
            className="rounded-lg border border-gray-200 bg-gray-100 px-2 py-1 text-right font-bold text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
            keyboardType="numeric"
            placeholder="Set limit"
            placeholderTextColor={
              budget > 0 ? (spent > budget ? '#FF3B30' : '#888') : '#999'
            }
            defaultValue={budget > 0 ? budget.toString() : ''}
            onEndEditing={(e) => onSetBudget(e.nativeEvent.text)}
          />
        </View>
      </View>

      <View className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/5">
        <View
          className={`h-full rounded-full ${isOverBudget ? 'bg-error' : 'bg-accent'}`}
          style={{ width: `${progress * 100}%` }}
        />
      </View>
      {isOverBudget && (
        <Text className="text-error mt-1 text-[10px] font-bold uppercase">
          Exceeded by {formatCurrency(spent - budget)}
        </Text>
      )}
    </GlassCard>
  );
};

export default function BudgetScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {
    expenses,
    categories,
    monthlyBudget,
    categoryBudgets,
    setMonthlyBudget,
    setCategoryBudget,
    formatCurrency,
  } = useExpenseStore();

  const totalSpent = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const [overallBudget, setOverallBudget] = React.useState(
    monthlyBudget.toString()
  );

  const getSpentForCategory = (categoryId: string) => {
    return expenses
      .filter((e) => e.categoryId === categoryId)
      .reduce((acc, exp) => acc + exp.amount, 0);
  };

  const handleSaveOverall = async () => {
    const amount = parseFloat(overallBudget);
    if (!isNaN(amount)) {
      await setMonthlyBudget(amount);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
              Monthly Goal
            </Text>
            <View className="flex-row items-center">
              <Text className="mr-2 text-3xl font-bold text-gray-900 opacity-50 dark:text-white">
                $
              </Text>
              <TextInput
                placeholder="0.00"
                keyboardType="numeric"
                value={overallBudget}
                onChangeText={setOverallBudget}
                onBlur={handleSaveOverall}
                style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  minWidth: 150,
                  textAlign: 'center',
                }}
                className="text-gray-900 dark:text-white"
                placeholderTextColor={
                  isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }
              />
            </View>
            <Text className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Total budget for all categories
            </Text>
          </View>

          <GlassCard
            intensity={20}
            className="mb-10 border-accent/10 p-6 dark:border-accent/20"
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Overall Progress
              </Text>
              <Text className="font-medium text-gray-500 dark:text-white/60">
                {Math.round((totalSpent / monthlyBudget) * 100)}%
              </Text>
            </View>
            <View className="mb-2 h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-white/5">
              <View
                className={`h-full rounded-full ${totalSpent > monthlyBudget ? 'bg-error' : 'bg-success'}`}
                style={{
                  width: `${Math.min((totalSpent / monthlyBudget) * 100, 100)}%`,
                }}
              />
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Spent: {formatCurrency(totalSpent)}
              </Text>
              <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Remaining: {formatCurrency(monthlyBudget - totalSpent)}
              </Text>
            </View>
          </GlassCard>

          <View className="mb-6">
            <Text className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
              Category Limits
            </Text>
            {categories.map((cat) => (
              <CategoryBudgetCard
                key={cat.id}
                cat={cat}
                budget={categoryBudgets[cat.id] || 0}
                spent={getSpentForCategory(cat.id)}
                formatCurrency={formatCurrency}
                onSetBudget={async (val) => {
                  const amount = parseFloat(val);
                  if (!isNaN(amount)) {
                    await setCategoryBudget(cat.id, amount);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              />
            ))}
          </View>
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
