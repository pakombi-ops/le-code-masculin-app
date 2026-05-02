import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius } from '../../theme';

interface ProgressBarProps {
  progress: number; // 0 à 1
  height?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 4,
  color = Colors.brand.gold,
  backgroundColor = Colors.background.tertiary,
  style,
  animated = true,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: Math.min(1, Math.max(0, progress)),
        duration: 600,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(Math.min(1, Math.max(0, progress)));
    }
  }, [progress]);

  return (
    <View style={[styles.track, { height, backgroundColor, borderRadius: height }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            borderRadius: height,
            backgroundColor: color,
            width: animatedWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: {},
});
