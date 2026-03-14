import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import { Colors } from '../../styles/theme';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="mb-2 ml-1 font-medium text-gray-500 dark:text-gray-400">
          {label}
        </Text>
      )}
      <View className="rounded-xl border border-black/5 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5">
        <TextInput
          placeholderTextColor="#999"
          className="text-base text-gray-900 dark:text-white"
          cursorColor={Colors.accent}
          {...props}
        />
      </View>
      {error && (
        <Text className="text-error ml-1 mt-1 text-xs font-bold">{error}</Text>
      )}
    </View>
  );
};
