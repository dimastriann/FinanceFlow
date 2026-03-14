import * as React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  useExpenseStore,
  Expense,
  Category,
} from '../../store/useExpenseStore';
import { ExpenseChart } from '../../components/charts/ExpenseChart';
import { GlassCard } from '../../components/common/GlassCard';

interface ExpenseItemProps {
  expense: Expense;
  category?: Category;
}

const ExpenseItem: React.FC<
  ExpenseItemProps & { formatCurrency: (a: number) => string }
> = ({ expense, category, formatCurrency }) => {
  return (
    <Animated.View entering={FadeInDown.delay(100).duration(500)}>
      <TouchableOpacity activeOpacity={0.7} className="mb-4">
        <GlassCard intensity={10} className="flex-row items-center p-4">
          <View
            className="mr-4 h-12 w-12 items-center justify-center rounded-2xl border"
            style={{
              backgroundColor: `${category?.color || '#007AFF'}20`,
              borderColor: `${category?.color || '#007AFF'}40`,
            }}
          >
            <Text className="text-xl">{category?.icon || '💸'}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900 dark:text-white">
              {expense.merchant || 'Expense'}
            </Text>
            <Text className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {new Date(expense.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}{' '}
              • {category?.name || 'General'}
            </Text>
          </View>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            -{formatCurrency(expense.amount)}
          </Text>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function DashboardScreen() {
  const router = useRouter();
  const { expenses, categories, monthlyBudget, userSettings, formatCurrency } =
    useExpenseStore();

  const initials = userSettings.userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const fabScale = useSharedValue(1);

  const totalBalance = 12450.0;
  const totalExpenses = expenses.reduce(
    (acc: number, exp: Expense) => acc + exp.amount,
    0
  );

  const getCategoryForExpense = (categoryId: string) => {
    return categories.find((c: Category) => c.id === categoryId);
  };

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const onPressFabIn = () => {
    fabScale.value = withSpring(0.8);
  };
  const onPressFabOut = () => {
    fabScale.value = withSpring(1);
  };

  const isDark = userSettings.theme === 'dark';

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: isDark ? '#0A0A0A' : '#F5F5F7' }}
    >
      <ScrollView
        className="flex-1 px-6 pb-32 pt-16"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(600)}>
          <View className="mb-10 flex-row items-center justify-between">
            <View>
              <Text className="mb-1 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Welcome Back
              </Text>
              <Text className="text-3xl font-bold text-gray-900 dark:text-white">
                {userSettings.userName.split(' ')[0]}
              </Text>
            </View>
            <TouchableOpacity className="h-12 w-12 items-center justify-center rounded-2xl border border-gray-300 bg-gray-200 dark:border-white/10 dark:bg-white/5">
              <Text className="font-bold text-gray-900 dark:text-white">
                {initials}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <GlassCard
            intensity={45}
            className="mb-10 border-accent/10 p-6 dark:border-accent/20"
          >
            <View className="mb-8 flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/60">
                  Monthly Spending
                </Text>
                <View className="flex-row items-baseline">
                  <Text className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(totalExpenses)}
                  </Text>
                  <Text className="ml-2 text-xs text-gray-400 dark:text-white/40">
                    / {formatCurrency(monthlyBudget)}
                  </Text>
                </View>
              </View>
              <View className="rounded-full border border-accent/30 bg-accent/20 px-3 py-1.5">
                <Text className="text-xs font-bold text-accent">
                  {Math.round((totalExpenses / monthlyBudget) * 100)}%
                </Text>
              </View>
            </View>

            <View className="mb-8">
              <View className="h-2 overflow-hidden rounded-full bg-white/10">
                <View
                  className={`h-full rounded-full ${totalExpenses > monthlyBudget ? 'bg-error' : 'bg-accent'}`}
                  style={{
                    width: `${Math.min((totalExpenses / monthlyBudget) * 100, 100)}%`,
                  }}
                />
              </View>
            </View>

            <View className="-mx-4 items-center">
              <ExpenseChart
                data={
                  expenses.length > 1
                    ? expenses.map((e: Expense) => e.amount)
                    : [12, 45, 23, 67, 34, 89, 56]
                }
              />
            </View>

            <View className="mt-6 flex-row justify-between border-t border-black/5 pt-6 dark:border-white/10">
              <View>
                <View className="mb-1 flex-row items-center">
                  <View className="bg-success mr-2 h-2 w-2 rounded-full" />
                  <Text className="text-xs font-medium text-gray-500 dark:text-white/60">
                    Income
                  </Text>
                </View>
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(6400)}
                </Text>
              </View>
              <View className="mx-4 w-[1px] bg-black/5 dark:bg-white/10" />
              <View>
                <View className="mb-1 flex-row items-center">
                  <View className="bg-error mr-2 h-2 w-2 rounded-full" />
                  <Text className="text-xs font-medium text-gray-500 dark:text-white/60">
                    Outcome
                  </Text>
                </View>
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalExpenses)}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <View className="mb-20">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Latest Activity
            </Text>
            <TouchableOpacity onPress={() => router.push('/transactions')}>
              <Text className="font-bold text-accent">View all</Text>
            </TouchableOpacity>
          </View>

          {expenses.length === 0 ? (
            <GlassCard
              intensity={5}
              className="items-center border-dashed border-white/10 py-12"
            >
              <Ionicons name="receipt-outline" size={40} color="#333" />
              <Text className="mt-4 px-10 text-center font-medium text-gray-500">
                Your expense list is empty. Start tracking by adding your first
                transaction.
              </Text>
            </GlassCard>
          ) : (
            expenses
              .slice(0, 4)
              .map((exp: Expense) => (
                <ExpenseItem
                  key={exp.id}
                  expense={exp}
                  category={getCategoryForExpense(exp.categoryId)}
                  formatCurrency={formatCurrency}
                />
              ))
          )}
        </View>

        <View className="h-20" />
      </ScrollView>

      <Animated.View
        style={fabAnimatedStyle}
        className="absolute bottom-28 right-6"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={onPressFabIn}
          onPressOut={onPressFabOut}
          onPress={() => router.push('/add-expense')}
          className="h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-accent shadow-2xl shadow-accent/50 dark:border-[#0A0A0A]"
        >
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
