import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from './GlassCard';

interface TransactionGridItemProps {
  expense: {
    id: string;
    amount: number;
    merchant: string;
    date: number;
    categoryId: string;
  };
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  formatCurrency: (a: number) => string;
  onPress?: () => void;
  isAmountHidden?: boolean;
  index?: number;
}

export const TransactionGridItem: React.FC<TransactionGridItemProps> = ({
  expense,
  category,
  formatCurrency,
  onPress,
  isAmountHidden,
  index = 0,
}) => {
  const color = category?.color || '#007AFF';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(400)}
      className="flex-1 p-1.5"
    >
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <GlassCard intensity={10} className="items-center p-4">
          {/* Category Icon */}
          <View
            className="mb-3 h-14 w-14 items-center justify-center rounded-2xl border"
            style={{
              backgroundColor: `${color}20`,
              borderColor: `${color}40`,
            }}
          >
            <Text className="text-2xl">{category?.icon || '💸'}</Text>
          </View>

          {/* Merchant */}
          <Text
            className="mb-1 text-center text-sm font-bold text-gray-900 dark:text-white"
            numberOfLines={1}
          >
            {expense.merchant || 'Expense'}
          </Text>

          {/* Date & Category */}
          <Text
            className="mb-2 text-center text-xs text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {new Date(expense.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}{' '}
            • {category?.name || 'General'}
          </Text>

          {/* Amount */}
          <View
            className="mt-auto rounded-full px-3 py-1"
            style={{ backgroundColor: `${color}15` }}
          >
            <Text
              className="text-sm font-bold"
              style={{ color }}
              numberOfLines={1}
            >
              -{isAmountHidden ? '•••' : formatCurrency(expense.amount)}
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};
