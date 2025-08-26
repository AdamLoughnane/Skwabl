// src/components/LevelMeterBar.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

type Props = {
  /** 0..1 linear loudness */
  level: number;
  /** height of the bar */
  height?: number;
  /** corner radius */
  radius?: number;
};

export default function LevelMeterBar({ level, height = 6, radius = 3 }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(1, Math.max(0, level)),
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [level, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const bg = anim.interpolate({
    inputRange: [0, 0.7, 0.9, 1],
    outputRange: ['#dfe7ff', '#8fb6ff', '#ffcb7a', '#ff5a5a'], // blue → amber → red
  });

  return (
    <View style={[styles.track, { height, borderRadius: radius }]}>
      <Animated.View style={[styles.fill, { width, backgroundColor: bg, borderRadius: radius }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: '#eef1f7',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});