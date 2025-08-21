// RNSoundMeter.ts (root)
import { NativeModules } from 'react-native';

export type RNSoundMeterType = {
  getMessage(): Promise<string>;
};

const native = NativeModules.RNSoundMeter as RNSoundMeterType | undefined;

const LINKING_ERROR =
  "RNSoundMeter is not available. Make sure the Swift file is in the Skwabl target, the bridging header is set, and you rebuilt the app.";

const RNSoundMeter = {
  async getMessage() {
    if (!native || typeof native.getMessage !== 'function') {
      console.log('NativeModules.RNSoundMeter =', NativeModules.RNSoundMeter);
      throw new Error(LINKING_ERROR);
    }
    return native.getMessage();
  },
};

export default RNSoundMeter;