import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useExpenseStore,
  Expense,
  Category,
} from '../../store/useExpenseStore';
import { GlassCard } from '../../components/common/GlassCard';

const TransactionItem: React.FC<{
  expense: Expense;
  category?: Category;
  formatCurrency: (a: number) => string;
  onPress?: () => void;
  isAmountHidden?: boolean;
}> = ({ expense, category, formatCurrency, onPress, isAmountHidden }) => (
  <TouchableOpacity activeOpacity={0.7} className="mb-4" onPress={onPress}>
    <GlassCard intensity={8} className="flex-row items-center p-4">
      <View
        className="mr-4 h-12 w-12 items-center justify-center rounded-2xl border"
        style={{
          backgroundColor: `${category?.color || '#007AFF'}15`,
          borderColor: `${category?.color || '#007AFF'}30`,
        }}
      >
        <Text className="text-xl">{category?.icon || '🧾'}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-gray-900 dark:text-white">
          {expense.merchant || 'Expense'}
        </Text>
        <Text className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {new Date(expense.date).toLocaleDateString()} •{' '}
          {category?.name || 'General'}
        </Text>
      </View>
      <Text className="text-lg font-bold text-gray-900 dark:text-white">
        -{isAmountHidden ? '•••' : formatCurrency(expense.amount)}
      </Text>
    </GlassCard>
  </TouchableOpacity>
);

export default function TransactionsScreen() {
  const router = useRouter();
  const { expenses, categories, deleteExpense, formatCurrency, userSettings } =
    useExpenseStore();

  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  );

  const filteredExpenses = expenses.filter((exp: Expense) => {
    const matchesSearch = exp.merchant
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      !selectedCategory || exp.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryForExpense = (categoryId: string) => {
    return categories.find((c: Category) => c.id === categoryId);
  };

  return (
    <View className="flex-1 bg-[#F5F5F7] dark:bg-[#0A0A0A]">
      <View className="bg-[#F5F5F7] px-6 pb-6 pt-16 dark:bg-[#0A0A0A]">
        <Text className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
          Activity
        </Text>

        <View className="mb-6 flex-row items-center rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/5">
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            placeholder="Search transactions..."
            placeholderTextColor="#999"
            className="ml-3 flex-1 font-medium text-gray-900 dark:text-white"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            className={`mr-3 rounded-full border px-5 py-2.5 ${!selectedCategory ? 'border-accent bg-accent' : 'border-gray-200 bg-white dark:border-white/10 dark:bg-white/5'}`}
          >
            <Text
              className={`text-xs font-bold ${!selectedCategory ? 'text-white' : 'text-gray-500'}`}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat: Category) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className={`mr-3 rounded-full border px-5 py-2.5 ${selectedCategory === cat.id ? 'border-accent bg-accent' : 'border-gray-200 bg-white dark:border-white/10 dark:bg-white/5'}`}
            >
              <Text
                className={`text-xs font-bold ${selectedCategory === cat.id ? 'text-white' : 'text-gray-500'}`}
              >
                <Text className="mr-1 text-sm">{cat.icon}</Text> {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1 px-6 pb-32"
        showsVerticalScrollIndicator={false}
      >
        {filteredExpenses.length === 0 ? (
          <View className="items-center py-20">
            <Ionicons name="search-outline" size={48} color="#222" />
            <Text className="mt-4 text-center font-medium text-gray-600">
              No transactions found matching your criteria.
            </Text>
          </View>
        ) : (
          filteredExpenses.map((exp: Expense) => (
            <TransactionItem
              key={exp.id}
              expense={exp}
              category={getCategoryForExpense(exp.categoryId)}
              formatCurrency={formatCurrency}
              onPress={() => router.push(`/add-expense?id=${exp.id}`)}
              isAmountHidden={userSettings.isAmountHidden}
            />
          ))
        )}
        <View className="h-32" />
      </ScrollView>
    </View>
  );
}
