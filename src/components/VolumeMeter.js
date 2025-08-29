// components/VolumeMeter.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, PermissionsAndroid } from 'react-native';
import SoundLevel from 'react-native-sound-level';

const BAR_COUNT = 12;

const VolumeMeter = ({ isActive }) => {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const requestPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Skwabl needs access to your microphone to measure sound levels.',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    };

    const start = async () => {
      const granted = await requestPermission();
      if (!granted) {
        console.warn('Microphone permission denied.');
        return;
      }

      try {
        SoundLevel.start();
      } catch (e) {
        console.error('SoundLevel start error:', e);
        return;
      }

      SoundLevel.onNewFrame = data => {
        const clamped = Math.min(Math.max((data.value + 100) / 100, 0), 1);
        setVolume(prev => prev * 0.3 + clamped * 0.7);
      };
    };

    start();

    return () => {
      SoundLevel.stop();
    };
  }, [isActive]);

  const activeBars = Math.round(volume * BAR_COUNT);

  return (
    <View style={styles.container}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        let color = '#d8dce0';
        if (isActive && i < activeBars) {
          const percent = i / BAR_COUNT;
          if (percent < 6 / 12) color = 'limegreen';    // bars 0–4
          else if (percent < 10 / 12) color = 'gold';    // bars 5–8
          else color = 'red';  
}
        return <View key={i} style={[styles.bar, { backgroundColor: color }]} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 4,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  bar: {
    flex: 1,
    height: 10,
    marginHorizontal: 1,
    borderRadius: 2,
  },
});

export default VolumeMeter;