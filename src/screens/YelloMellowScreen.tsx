// src/screens/YelloMellowScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Vibration, Modal } from 'react-native';
import VolumeMeter from '../components/VolumeMeter';

type Speaker = 'A' | 'B' | null;

const DURATIONS = [60, 120, 180, 300]; // seconds
const MAX_TOKENS = 5;

// ---------- helpers for rotation ----------
const degFor = (who: 'A' | 'B') => (who === 'A' ? '+90deg' : '-90deg');

/** Wrap children and rotate by `deg` without affecting layout */
const Rotated = ({ deg, children }: { deg: string; children: React.ReactNode }) => (
  <View style={{ transform: [{ rotate: deg }] }}>{children}</View>
);

// -------- vertical overlapping token stack (true vertical pills) --------
const PILL_W = 92;   // horizontal pill width (long side)
const PILL_H = 36;   // horizontal pill height (short side)
const OVERLAP = 14;
const STACK_H = PILL_W + OVERLAP * (MAX_TOKENS - 1);

const TokenStackVertical = ({
  who,
  tokensLeft,
  disabled,
  onPress,
}: {
  who: 'A' | 'B';
  tokensLeft: number;
  disabled: boolean;
  onPress: () => void;
}) => {
  const stackRotation = who === 'A' ? '90deg' : '-90deg';

  return (
    <View
      style={{
        alignItems: 'center',
        marginTop: 8,
        transform: [{ rotate: stackRotation }],
      }}
    >
      {Array.from({ length: MAX_TOKENS }).map((_, i) => {
        const used = i >= tokensLeft;
        return (
          <Pressable
            key={i}
            onPress={onPress}
            disabled={disabled || used}
            style={{
              marginTop: i === 0 ? 0 : -OVERLAP, // visually stacked
              opacity: disabled || used ? 0.6 : 1,
            }}
          >
            <View
              style={{
                width: PILL_W,
                height: PILL_H,
                borderRadius: PILL_H / 2,
                backgroundColor: used ? '#e6e6e6' : '#d0f0d0',
                borderWidth: 1,
                borderColor: used ? '#d0d0d0' : '#b2e5b2',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontWeight: '700', fontSize: 13 }}>interrupt</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

// ---------- screen ----------
export default function YelloMellowScreen() {
  const [slotSeconds, setSlotSeconds] = useState<number>(120);
  const [active, setActive] = useState<Speaker>(null);
  const [remainingA, setRemainingA] = useState<number>(120);
  const [remainingB, setRemainingB] = useState<number>(120);

  // Interrupt tokens per side (remaining)
  const [tokensA, setTokensA] = useState<number>(MAX_TOKENS);
  const [tokensB, setTokensB] = useState<number>(MAX_TOKENS);

  // An interrupt request pending (from the listener)
  const [requestFrom, setRequestFrom] = useState<Speaker>(null);

  const intervalRef = useRef<NodeJS.Timer | null>(null);

  // Reset both clocks when slot changes
  useEffect(() => {
    setRemainingA(slotSeconds);
    setRemainingB(slotSeconds);
  }, [slotSeconds]);

  // Single shared ticker (only ticks the active side)
  useEffect(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (active === 'A') setRemainingA(s => Math.max(0, s - 1));
      else if (active === 'B') setRemainingB(s => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active]);

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

  // Big timer card with rotated inner content + footer
  function TimerCard({
    who,
    time,
    isActive,
    onMainPress,
    onInterrupted,
  }: {
    who: 'A' | 'B';
    time: string;
    isActive: boolean;
    onMainPress: () => void;
    onInterrupted: () => void;
  }) {
    const faceDeg = degFor(who);

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
        {/* main pressable area */}
        <Pressable
          onPress={onMainPress}
          style={{
            flex: 1,
            padding: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Rotated deg={faceDeg}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
              {who === 'A' ? 'Speaker A' : 'Speaker B'}
            </Text>
            <Text style={{ fontSize: 56, fontVariant: ['tabular-nums'], marginBottom: 8 }}>{time}</Text>
            <Text style={{ opacity: 0.7 }}>Tap to speak</Text>
          </Rotated>
        </Pressable>

        {/* footer "Interrupted" button (truly vertical) */}
<Pressable
  onPress={() => {
    onInterrupted();
    Vibration.vibrate(50);
  }}
  style={{
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffdada',
  }}
>
  <View
    style={{
      transform: [{ rotate: degFor(who) }],
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {'Interrupted'.split('').map((char, idx) => (
      <Text
        key={idx}
        style={{
          fontWeight: '600',
          fontSize: 14,
          lineHeight: 13,
        }}
      >
        {char}
      </Text>
    ))}
  </View>
</Pressable>
      </View>
    );
  }

  // Listener taps a token to request an interrupt
  // NOTE: token is NOT consumed here; only when the speaker *allows*
  const tryInterrupt = (who: Exclude<Speaker, null>) => {
    if (active === who) return; // only the listener can request
    if (requestFrom) return; // one at a time
    if (who === 'A' && tokensA <= 0) return;
    if (who === 'B' && tokensB <= 0) return;

    Vibration.vibrate(50);
    setRequestFrom(who);
  };

  // Manual "Interrupted" footer button: restore that speaker's full time (active speaker unchanged)
  const handleInterrupted = (who: Speaker) => {
    if (who === 'A') setRemainingA(slotSeconds);
    if (who === 'B') setRemainingB(slotSeconds);
  };

  // Speaker responds to request
  const handleRespond = (allow: boolean) => {
    const speaker = active; // currently speaking
    const requester = requestFrom; // who asked to interrupt
    setRequestFrom(null);

    if (!requester || !speaker) return;

    if (allow) {
      // consume ONE token from requester (only on allow)
      if (requester === 'A') setTokensA(t => Math.max(0, t - 1));
      if (requester === 'B') setTokensB(t => Math.max(0, t - 1));

      // reset speaker time, then switch to requester
      if (speaker === 'A') setRemainingA(slotSeconds);
      if (speaker === 'B') setRemainingB(slotSeconds);
      setActive(requester);
      Vibration.vibrate(150);
    } else {
      // deny → continue as-is
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, paddingBottom: 12 }}>
      {/* Duration selector + Reset */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {DURATIONS.map(d => (
          <Pressable
            key={d}
            onPress={() => {
              setSlotSeconds(d);
              reset();
            }}
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

      {/* Two speaker columns */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Speaker A column */}
        <View style={{ flex: 1 }}>
            <VolumeMeter isActive={active === 'A'} />
            <TimerCard
              who="A"
              time={fmt(remainingA)}
              isActive={active === 'A'}
              onMainPress={() => setActive(prev => (prev === 'A' ? null : 'A'))}
              onInterrupted={() => handleInterrupted('A')}
            />

            <TokenStackVertical
              who="A"
              tokensLeft={tokensA}
              disabled={active === 'A' || !!requestFrom}
              onPress={() => tryInterrupt('A')}
            />
          </View>

        {/* Speaker B column */}
        <View style={{ flex: 1 }}>
          <VolumeMeter isActive={active === 'B'} />
          <TimerCard
            who="B"
            time={fmt(remainingB)}
            isActive={active === 'B'}
            onMainPress={() => setActive(prev => (prev === 'B' ? null : 'B'))}
            onInterrupted={() => handleInterrupted('B')}
          />

          <TokenStackVertical
            who="B"
            tokensLeft={tokensB}
            disabled={active === 'B' || !!requestFrom}
            onPress={() => tryInterrupt('B')}
          />
        </View>
      </View>

      {/* Mini help */}
      <View style={{ alignItems: 'center', paddingVertical: 6 }}>
        <Text style={{ opacity: 0.7, textAlign: 'center' }}>
          The listener can tap an “interrupt” token (max {MAX_TOKENS} each). Speaker decides to Allow or Deny.
        </Text>
      </View>

      {/* Interrupt request modal for the current speaker */}
      <Modal visible={!!requestFrom} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.35)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, width: '90%' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6 }}>Interrupt request</Text>
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
