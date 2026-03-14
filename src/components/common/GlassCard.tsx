import React from 'react';
import { View, ViewProps } from 'react-native';
import { useColorScheme } from 'nativewind';
import { BlurView } from 'expo-blur';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 20,
  className,
  style,
  ...props
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className={`overflow-hidden rounded-2xl border border-black/5 dark:border-white/20 ${className}`}
      style={style}
      {...props}
    >
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        className="bg-black/[0.02] p-4 dark:bg-white/5"
      >
        {children}
      </BlurView>
    </View>
  );
};
