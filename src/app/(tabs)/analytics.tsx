import * as React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import {
  useExpenseStore,
  Expense,
  Category,
} from '../../store/useExpenseStore';
import { ExpenseChart } from '../../components/charts/ExpenseChart';
import { GlassCard } from '../../components/common/GlassCard';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen() {
  const { expenses, categories, categoryBudgets, formatCurrency } =
    useExpenseStore();

  const totalExpenses = expenses.reduce(
    (acc: number, exp: Expense) => acc + exp.amount,
    0
  );

  interface CategorySpending {
    id: string;
    name: string;
    icon: string;
    color: string;
    amount: number;
    budget: number;
    percentage: number;
    budgetProgress: number;
  }

  // Group spending by category
  const categorySpending: CategorySpending[] = categories
    .map((cat: Category) => {
      const amount = expenses
        .filter((exp: Expense) => exp.categoryId === cat.id)
        .reduce((acc: number, exp: Expense) => acc + exp.amount, 0);
      const budget = categoryBudgets[cat.id] || 0;
      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        amount,
        budget,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        budgetProgress: budget > 0 ? Math.min(amount / budget, 1) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return (
    <ScrollView
      className="flex-1 bg-[#F5F5F7] px-6 pb-32 pt-16 dark:bg-[#0A0A0A]"
      showsVerticalScrollIndicator={false}
    >
      <Text className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
        Insights
      </Text>

      <GlassCard
        intensity={20}
        className="mb-10 border-accent/10 p-6 dark:border-accent/10"
      >
        <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/60">
          Total Spending
        </Text>
        <Text className="mb-6 text-4xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(totalExpenses)}
        </Text>

        <View className="-mx-4 h-40 items-center">
          <ExpenseChart
            data={
              expenses.length > 1
                ? expenses.map((e: Expense) => e.amount)
                : [34, 56, 23, 89, 45, 67, 43]
            }
          />
        </View>

        <View className="mt-4 flex-row justify-between">
          <Text className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
            Last 30 Days
          </Text>
          <Text className="text-xs font-bold text-accent">AVG. $45.20/DAY</Text>
        </View>
      </GlassCard>

      <View className="mb-10">
        <Text className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
          Spending by Category
        </Text>
        {categorySpending.map((spending: CategorySpending) => (
          <View key={spending.id} className="mb-6">
            <View className="mb-2 flex-row items-end justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 dark:border-white/10 dark:bg-white/5">
                  <Text className="text-lg">{spending.icon}</Text>
                </View>
                <View>
                  <Text className="font-bold text-gray-900 dark:text-white">
                    {spending.name}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {spending.percentage.toFixed(0)}% of total
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(spending.amount)}
                </Text>
                {spending.budget > 0 && (
                  <Text className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    Limit: {formatCurrency(spending.budget)}
                  </Text>
                )}
              </View>
            </View>
            <View className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/5">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${spending.percentage}%`,
                  backgroundColor: spending.color,
                }}
              />
            </View>

            {/* Budget Progress Bar */}
            {spending.budget > 0 && (
              <View className="mt-3">
                <View className="mb-1 flex-row justify-between">
                  <Text className="text-[9px] font-bold uppercase tracking-tighter text-gray-500 dark:text-gray-400">
                    Budget Progress
                  </Text>
                  <Text
                    className={`text-[9px] font-bold ${spending.amount > spending.budget ? 'text-error' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    {Math.round(spending.budgetProgress * 100)}%
                  </Text>
                </View>
                <View className="h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-white/5">
                  <View
                    className={`h-full rounded-full ${spending.amount > spending.budget ? 'bg-error' : 'bg-success/40'}`}
                    style={{
                      width: `${Math.min(spending.budgetProgress * 100, 100)}%`,
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        ))}
      </View>

      <GlassCard
        intensity={10}
        className="mb-10 flex-row items-center border-accent/10 p-6 dark:border-accent/5"
      >
        <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-accent/20">
          <Ionicons name="bulb" size={24} color="#007AFF" />
        </View>
        <View className="flex-1">
          <Text className="mb-1 font-bold text-gray-900 dark:text-white">
            AI Suggestion
          </Text>
          <Text className="text-xs leading-5 text-gray-500 dark:text-gray-400">
            Your spending on "Food" is 15% higher than last month. Try setting a
            budget for better control.
          </Text>
        </View>
      </GlassCard>

      <View className="h-32" />
    </ScrollView>
  );
}
