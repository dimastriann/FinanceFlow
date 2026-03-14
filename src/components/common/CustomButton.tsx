import React from 'react';
import {
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../styles/theme';

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  className,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-secondary border border-white/5';
      case 'outline':
        return 'border border-accent/50 bg-accent/5';
      case 'ghost':
        return 'bg-transparent';
      default:
        return 'bg-accent shadow-lg shadow-accent/20';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return 'text-accent';
      default:
        return 'text-white';
    }
  };

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center rounded-xl px-6 py-4 ${getVariantStyles()} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'outline' || variant === 'ghost'
              ? Colors.accent
              : '#FFF'
          }
        />
      ) : (
        <Text className={`text-base font-semibold ${getTextStyles()}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
