import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  useWindowDimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import {
  useExpenseStore,
  Expense,
  Category,
} from '../../store/useExpenseStore';
import { GlassCard } from '../../components/common/GlassCard';
import { TransactionGridItem } from '../../components/common/TransactionGridItem';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Date Filter Types ───
type DateFilterKey = 'all' | 'today' | 'week' | 'month' | '30days' | 'custom';

interface DateFilter {
  key: DateFilterKey;
  label: string;
  icon?: string;
}

const DATE_FILTERS: DateFilter[] = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: '30days', label: '30 Days' },
  { key: 'custom', label: 'Custom' },
];

// ─── Helper: get start-of-day ───
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDateRange(filter: DateFilterKey): { from: Date; to: Date } | null {
  const now = new Date();
  const today = startOfDay(now);

  switch (filter) {
    case 'all':
      return null;
    case 'today':
      return { from: today, to: now };
    case 'week': {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return { from: weekStart, to: now };
    }
    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: monthStart, to: now };
    }
    case '30days': {
      const thirtyAgo = new Date(today);
      thirtyAgo.setDate(today.getDate() - 30);
      return { from: thirtyAgo, to: now };
    }
    default:
      return null;
  }
}

// ─── Transaction List Item ───
const TransactionItem: React.FC<{
  expense: Expense;
  category?: Category;
  formatCurrency: (a: number) => string;
  onPress?: () => void;
  isAmountHidden?: boolean;
  index?: number;
}> = ({
  expense,
  category,
  formatCurrency,
  onPress,
  isAmountHidden,
  index = 0,
}) => (
  <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
    <TouchableOpacity activeOpacity={0.7} className="mb-4" onPress={onPress}>
      <View className="flex-row items-center">
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-xl border"
          style={{
            backgroundColor: `${category?.color || '#007AFF'}15`,
            borderColor: `${category?.color || '#007AFF'}25`,
          }}
        >
          <Text className="text-lg">{category?.icon || '🧾'}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-bold text-gray-900 dark:text-white">
            {expense.merchant || 'Expense'}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(expense.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}{' '}
            • {category?.name || 'General'}
          </Text>
        </View>
        <Text className="text-base font-bold text-gray-900 dark:text-white">
          -{isAmountHidden ? '•••' : formatCurrency(expense.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  </Animated.View>
);

// ─── View Toggle Button ───
const ViewToggle: React.FC<{
  viewMode: 'list' | 'grid';
  onToggle: (mode: 'list' | 'grid') => void;
  isDark: boolean;
}> = ({ viewMode, onToggle, isDark }) => (
  <View className="flex-row items-center rounded-2xl border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-white/5">
    <TouchableOpacity
      onPress={() => onToggle('list')}
      className={`rounded-xl px-3 py-2 ${viewMode === 'list' ? 'bg-accent' : ''}`}
    >
      <Ionicons
        name="list"
        size={18}
        color={viewMode === 'list' ? '#FFF' : isDark ? '#999' : '#666'}
      />
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => onToggle('grid')}
      className={`rounded-xl px-3 py-2 ${viewMode === 'grid' ? 'bg-accent' : ''}`}
    >
      <Ionicons
        name="grid"
        size={18}
        color={viewMode === 'grid' ? '#FFF' : isDark ? '#999' : '#666'}
      />
    </TouchableOpacity>
  </View>
);

// ─── Date Filter Chip ───
const DateFilterChip: React.FC<{
  filter: DateFilter;
  isSelected: boolean;
  onPress: () => void;
}> = ({ filter, isSelected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`mr-2 rounded-full border px-4 py-2 ${
      isSelected
        ? 'border-accent bg-accent'
        : 'border-gray-200 bg-white dark:border-white/10 dark:bg-white/5'
    }`}
  >
    <Text
      className={`text-xs font-bold ${
        isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'
      }`}
    >
      {filter.label}
    </Text>
  </TouchableOpacity>
);

// ─── Custom Date Range Input ───
const CustomDateRange: React.FC<{
  fromDate: string;
  toDate: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  isDark: boolean;
}> = ({ fromDate, toDate, onFromChange, onToChange, isDark }) => (
  <Animated.View
    entering={FadeInDown.duration(300)}
    className="mb-4 flex-row items-center"
  >
    <View className="mr-2 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
      <Text className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        From
      </Text>
      <TextInput
        placeholder="DD/MM/YYYY"
        placeholderTextColor="#999"
        className="text-sm font-medium text-gray-900 dark:text-white"
        value={fromDate}
        onChangeText={onFromChange}
        keyboardType="numbers-and-punctuation"
      />
    </View>
    <Ionicons name="arrow-forward" size={16} color={isDark ? '#666' : '#999'} />
    <View className="ml-2 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
      <Text className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        To
      </Text>
      <TextInput
        placeholder="DD/MM/YYYY"
        placeholderTextColor="#999"
        className="text-sm font-medium text-gray-900 dark:text-white"
        value={toDate}
        onChangeText={onToChange}
        keyboardType="numbers-and-punctuation"
      />
    </View>
  </Animated.View>
);

// ─── Parse DD/MM/YYYY ───
function parseDateString(s: string): Date | null {
  const parts = s.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return null;
  return d;
}

// ═══════════════════════════════════════════
// ─── Main Screen ───
// ═══════════════════════════════════════════
export default function TransactionsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { expenses, categories, deleteExpense, formatCurrency, userSettings } =
    useExpenseStore();

  // ─── State ───
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  );
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  const [dateFilter, setDateFilter] = React.useState<DateFilterKey>('all');
  const [customFrom, setCustomFrom] = React.useState('');
  const [customTo, setCustomTo] = React.useState('');

  const isDark = userSettings.theme === 'dark';

  // Calculate grid columns based on screen width
  const numColumns = viewMode === 'grid' ? (width >= 600 ? 3 : 2) : 1;

  // ─── Filtering ───
  const filteredExpenses = React.useMemo(() => {
    return expenses.filter((exp: Expense) => {
      // Search filter
      const matchesSearch = exp.merchant
        ?.toLowerCase()
        .includes(search.toLowerCase());

      // Category filter
      const matchesCategory =
        !selectedCategory || exp.categoryId === selectedCategory;

      // Date filter
      let matchesDate = true;
      if (dateFilter === 'custom') {
        const from = parseDateString(customFrom);
        const to = parseDateString(customTo);
        if (from) matchesDate = exp.date >= from.getTime();
        if (to && matchesDate) {
          const toEnd = new Date(to);
          toEnd.setHours(23, 59, 59, 999);
          matchesDate = exp.date <= toEnd.getTime();
        }
      } else {
        const range = getDateRange(dateFilter);
        if (range) {
          matchesDate =
            exp.date >= range.from.getTime() && exp.date <= range.to.getTime();
        }
      }

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [expenses, search, selectedCategory, dateFilter, customFrom, customTo]);

  const getCategoryForExpense = (categoryId: string) => {
    return categories.find((c: Category) => c.id === categoryId);
  };

  // ─── Toggle handler with layout animation ───
  const handleViewToggle = (mode: 'list' | 'grid') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewMode(mode);
  };

  const handleDateFilterChange = (key: DateFilterKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDateFilter(key);
    if (key !== 'custom') {
      setCustomFrom('');
      setCustomTo('');
    }
  };

  // ─── Render item based on view mode ───
  const renderItem = ({ item, index }: { item: Expense; index: number }) => {
    const category = getCategoryForExpense(item.categoryId);

    if (viewMode === 'grid') {
      return (
        <TransactionGridItem
          expense={item}
          category={category}
          formatCurrency={formatCurrency}
          onPress={() => router.push(`/add-expense?id=${item.id}`)}
          isAmountHidden={userSettings.isAmountHidden}
          index={index}
        />
      );
    }

    return (
      <TransactionItem
        expense={item}
        category={getCategoryForExpense(item.categoryId)}
        formatCurrency={formatCurrency}
        onPress={() => router.push(`/add-expense?id=${item.id}`)}
        isAmountHidden={userSettings.isAmountHidden}
        index={index}
      />
    );
  };

  // ─── Empty state ───
  const renderEmpty = () => (
    <View className="items-center py-20">
      <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl border border-gray-200 bg-gray-100 dark:border-white/10 dark:bg-white/5">
        <Ionicons
          name="search-outline"
          size={36}
          color={isDark ? '#555' : '#BBB'}
        />
      </View>
      <Text className="text-center text-base font-bold text-gray-500 dark:text-gray-400">
        No transactions found
      </Text>
      <Text className="mt-1 text-center text-sm text-gray-400 dark:text-gray-500">
        Try adjusting your filters or search term.
      </Text>
    </View>
  );

  // ─── Summary bar ───
  const totalFiltered = filteredExpenses.reduce(
    (acc: number, e: Expense) => acc + e.amount,
    0
  );

  // ─── Header component for FlatList ───
  const ListHeader = () => (
    <View>
      {/* Summary Bar */}
      {dateFilter !== 'all' && (
        <Animated.View entering={FadeIn.duration(300)} className="mb-4">
          <GlassCard
            intensity={12}
            className="flex-row items-center justify-between p-4"
          >
            <View>
              <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Period Total
              </Text>
              <Text className="mt-0.5 text-xl font-bold text-gray-900 dark:text-white">
                {userSettings.isAmountHidden
                  ? '••••••'
                  : formatCurrency(totalFiltered)}
              </Text>
            </View>
            <View className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5">
              <Text className="text-xs font-bold text-accent">
                {filteredExpenses.length} transactions
              </Text>
            </View>
          </GlassCard>
        </Animated.View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-[#F5F5F7] dark:bg-[#0A0A0A]">
      {/* ─── Fixed Header ─── */}
      <View className="bg-[#F5F5F7] px-6 pb-4 pt-16 dark:bg-[#0A0A0A]">
        {/* Title + View Toggle */}
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            Activity
          </Text>
          <ViewToggle
            viewMode={viewMode}
            onToggle={handleViewToggle}
            isDark={isDark}
          />
        </View>

        {/* Search Bar */}
        <View className="mb-4 flex-row items-center rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/5">
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            placeholder="Search transactions..."
            placeholderTextColor="#999"
            className="ml-3 flex-1 font-medium text-gray-900 dark:text-white"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={isDark ? '#666' : '#CCC'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Date Period Filter */}
        <FlatList
          horizontal
          data={DATE_FILTERS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          renderItem={({ item }) => (
            <DateFilterChip
              filter={item}
              isSelected={dateFilter === item.key}
              onPress={() => handleDateFilterChange(item.key)}
            />
          )}
        />

        {/* Custom Date Range (conditionally shown) */}
        {dateFilter === 'custom' && (
          <CustomDateRange
            fromDate={customFrom}
            toDate={customTo}
            onFromChange={setCustomFrom}
            onToChange={setCustomTo}
            isDark={isDark}
          />
        )}

        {/* Category Filter */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { id: '__all__', name: 'All', icon: '', color: '' },
            ...categories,
          ]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isAll = item.id === '__all__';
            const isSelected = isAll
              ? !selectedCategory
              : selectedCategory === item.id;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(isAll ? null : item.id)}
                className={`mr-2 rounded-full border px-4 py-2 ${
                  isSelected
                    ? 'border-accent bg-accent'
                    : 'border-gray-200 bg-white dark:border-white/10 dark:bg-white/5'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isSelected
                      ? 'text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {!isAll && <Text className="text-sm">{item.icon} </Text>}
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ─── Transaction List / Grid ─── */}
      <FlatList
        key={`flatlist-${numColumns}`}
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={renderEmpty}
        renderItem={renderItem}
      />
    </View>
  );
}
