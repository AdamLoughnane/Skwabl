// App.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, NativeModules } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import YelloMellowScreen from './src/screens/YelloMellowScreen';
import RNSoundMeter from './RNSoundMeter'; // TS wrapper around NativeModules

const Tab = createBottomTabNavigator();

// --- Temporary diagnostics (remove once happy) ---
console.log('NativeModules keys:', Object.keys(NativeModules));
console.log('RNSoundMeter JS value:', RNSoundMeter);
// -------------------------------------------------

const ScreenStub = ({ title }: { title: string }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <Text style={{ fontSize: 22, fontWeight: '600' }}>{title}</Text>
    <Text style={{ marginTop: 8, fontSize: 15, opacity: 0.7 }}>Placeholder — coming soon</Text>
  </View>
);

function FeedScreen() { return <ScreenStub title="Feed" />; }
function AffirmationsScreen() { return <ScreenStub title="Affirmations" />; }
function FactCheckerScreen() { return <ScreenStub title="Fact Checker" />; }
function HelpScreen() { return <ScreenStub title="Help" />; }
function AccountScreen() { return <ScreenStub title="Account" />; }

export default function App() {
  const [bridgeMsg, setBridgeMsg] = useState<string>('');

  useEffect(() => {
    RNSoundMeter.getMessage()
      .then(msg => {
        console.log('RNSoundMeter success:', msg); // expect "Microphone bridge is working!"
        setBridgeMsg(msg);
      })
      .catch(err => {
        // show the *real* error shape/message in Metro
        console.error('RNSoundMeter error:', err?.message ?? err, err);
      });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
          <Tab.Screen name="Feed" component={FeedScreen} />
          <Tab.Screen
            name="Yell’o Mellow"
            component={YelloMellowScreen}
            options={{ title: "Yell'o Mellow" }}
          />
          <Tab.Screen name="Affirmations" component={AffirmationsScreen} />
          <Tab.Screen name="Fact Checker" component={FactCheckerScreen} />
          <Tab.Screen name="Help" component={HelpScreen} />
          <Tab.Screen name="Account" component={AccountScreen} />
        </Tab.Navigator>
      </NavigationContainer>

      {/* Temporary banner to confirm the native bridge */}
      {bridgeMsg ? (
        <View
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: '#eef',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 12 }}>Native bridge: {bridgeMsg}</Text>
        </View>
      ) : null}
    </View>
  );
}