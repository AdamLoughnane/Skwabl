import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Vibration, Modal } from 'react-native';

type Speaker = 'A' | 'B' | null;
const DURATIONS = [60, 120, 180, 300]; // seconds
const MAX_TOKENS = 5;

// layout for overlapping token stack
const TOKEN_BASE_W = 84;
const TOKEN_OVERLAP = 22;
const STACK_WIDTH = TOKEN_BASE_W + TOKEN_OVERLAP * (MAX_TOKENS - 1);
const STACK_HEIGHT = 36;

export default function YelloMellowScreen() {
  const [slotSeconds, setSlotSeconds] = useState<number>(120);
  const [active, setActive] = useState<Speaker>(null);
  const [remainingA, setRemainingA] = useState<number>(120);
  const [remainingB, setRemainingB] = useState<number>(120);

  const [tokensA, setTokensA] = useState<number>(MAX_TOKENS);
  const [tokensB, setTokensB] = useState<number>(MAX_TOKENS);

  const [requestFrom, setRequestFrom] = useState<Speaker>(null);

  const intervalRef = useRef<NodeJS.Timer | null>(null);

  // Reset both clocks when slot changes
  useEffect(() => {
    setRemainingA(slotSeconds);
    setRemainingB(slotSeconds);
  }, [slotSeconds]);

  // Shared ticker
  useEffect(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      // ⏸️ Pause ticking if a request modal is visible
      if (requestFrom) return;

      if (active === 'A') setRemainingA(s => Math.max(0, s - 1));
      else if (active === 'B') setRemainingB(s => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, requestFrom]);

  // Time-up haptic + pause
  useEffect(() => {
    if (remainingA === 0 && active === 'A') {
      Vibration.vibrate(300);
      setActive(null);
    }
  }, [remainingA, active]);

  useEffect(() => {
    if (remainingB === 0 && active === 'B') {
      Vibration.vibrate(300);
      setActive(null);
    }
  }, [remainingB, active]);

  const reset = () => {
    setActive(null);
    setRemainingA(slotSeconds);
    setRemainingB(slotSeconds);
    setTokensA(MAX_TOKENS);
    setTokensB(MAX_TOKENS);
    setRequestFrom(null);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss.toString().padStart(2, '0')}`;
  };

  // Big timer card with "Interrupted" footer button
  function TimerCard({
    label,
    time,
    isActive,
    onMainPress,
    onInterrupted,
  }: {
    label: string;
    time: string;
    isActive: boolean;
    onMainPress: () => void;
    onInterrupted: () => void;
  }) {
    return (
      <View
        style={{
          flex: 1,
          margin: 8,
          borderRadius: 20,
          backgroundColor: isActive ? '#ffd54f' : '#e0e0e0',
          overflow: 'hidden',
        }}
      >
        <Pressable
          onPress={onMainPress}
          style={{
            flex: 1,
            padding: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
          <Text style={{ fontSize: 36, fontVariant: ['tabular-nums'] }}>{time}</Text>
          <Text style={{ marginTop: 6, opacity: 0.7 }}>
            {isActive ? 'Speaking… tap to pause' : 'Tap to speak'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => { onInterrupted(); Vibration.vibrate(50); }}
          style={{
            paddingVertical: 12,
            alignItems: 'center',
            backgroundColor: '#ffdada',
          }}
        >
          <Text style={{ fontWeight: '700' }}>Interrupted</Text>
        </Pressable>
      </View>
    );
  }

  const TokenPill = ({ used, disabled, onPress }: { used: boolean; disabled: boolean; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      disabled={disabled || used}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: used ? '#e6e6e6' : '#d0f0d0',
        borderWidth: 1,
        borderColor: used ? '#d0d0d0' : '#b2e5b2',
      }}
    >
      <Text style={{ fontWeight: '700', fontSize: 12, opacity: disabled || used ? 0.5 : 1 }}>interrupt</Text>
    </Pressable>
  );

  const TokenStack = ({
    tokensLeft, disabled, onPress,
  }: { tokensLeft: number; disabled: boolean; onPress: () => void }) => (
    <View style={{ width: STACK_WIDTH, height: STACK_HEIGHT, alignSelf: 'center', marginTop: 6 }}>
      {Array.from({ length: MAX_TOKENS }).map((_, i) => {
        const used = i >= tokensLeft;
        return (
          <View key={i} style={{ position: 'absolute', left: i * TOKEN_OVERLAP, top: 0 }}>
            <TokenPill used={used} disabled={disabled} onPress={onPress} />
          </View>
        );
      })}
    </View>
  );

  const tryInterrupt = (who: Exclude<Speaker, null>) => {
    if (active === who) return;
    if (requestFrom) return;
    if (who === 'A' && tokensA <= 0) return;
    if (who === 'B' && tokensB <= 0) return;

    Vibration.vibrate(50);
    setRequestFrom(who);
  };

  const handleInterrupted = (who: Speaker) => {
    if (who === 'A') setRemainingA(slotSeconds);
    if (who === 'B') setRemainingB(slotSeconds);
  };

  const handleRespond = (allow: boolean) => {
    const speaker = active;
    const requester = requestFrom;
    setRequestFrom(null);

    if (!requester || !speaker) return;

    if (allow) {
      if (requester === 'A') setTokensA(t => Math.max(0, t - 1));
      if (requester === 'B') setTokensB(t => Math.max(0, t - 1));

      if (speaker === 'A') setRemainingA(slotSeconds);
      if (speaker === 'B') setRemainingB(slotSeconds);
      setActive(requester);
      Vibration.vibrate(150);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, paddingBottom: 12 }}>
      {/* Duration selector */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {DURATIONS.map(d => (
          <Pressable
            key={d}
            onPress={() => { setSlotSeconds(d); reset(); }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: slotSeconds === d ? '#90caf9' : '#eeeeee',
            }}
          >
            <Text style={{ fontWeight: '600' }}>{`${Math.round(d / 60)} min`}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={reset}
          style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#eeeeee' }}
        >
          <Text>Reset</Text>
        </Pressable>
      </View>

      {/* Two columns */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ flex: 1 }}>
          <TimerCard
            label="Speaker A"
            time={fmt(remainingA)}
            isActive={active === 'A'}
            onMainPress={() => setActive(prev => (prev === 'A' ? null : 'A'))}
            onInterrupted={() => handleInterrupted('A')}
          />
          <TokenStack
            tokensLeft={tokensA}
            disabled={active === 'A' || !!requestFrom}
            onPress={() => tryInterrupt('A')}
          />
        </View>

        <View style={{ flex: 1 }}>
          <TimerCard
            label="Speaker B"
            time={fmt(remainingB)}
            isActive={active === 'B'}
            onMainPress={() => setActive(prev => (prev === 'B' ? null : 'B'))}
            onInterrupted={() => handleInterrupted('B')}
          />
          <TokenStack
            tokensLeft={tokensB}
            disabled={active === 'B' || !!requestFrom}
            onPress={() => tryInterrupt('B')}
          />
        </View>
      </View>

      <View style={{ alignItems: 'center', paddingVertical: 6 }}>
        <Text style={{ opacity: 0.7, textAlign: 'center' }}>
          The listener can tap an “interrupt” token (max {MAX_TOKENS} each). Speaker decides to Allow or Deny.
        </Text>
      </View>

      <Modal visible={!!requestFrom} transparent animationType="fade">
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
          alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, width: '90%' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
              Interrupt request
            </Text>
            <Text style={{ marginBottom: 16 }}>
              {requestFrom === 'A' ? 'Speaker A' : 'Speaker B'} requests to interrupt.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <Pressable
                onPress={() => handleRespond(false)}
                style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#eeeeee' }}
              >
                <Text style={{ fontWeight: '600' }}>Deny</Text>
              </Pressable>
              <Pressable
                onPress={() => handleRespond(true)}
                style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#cfe9ff' }}
              >
                <Text style={{ fontWeight: '700' }}>Allow</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}