import Foundation
import AVFoundation

@objc(RNSoundMeter)
class RNSoundMeter: NSObject {

  // your actual implementation
  @objc(getMessage:rejecter:)
  func getMessage(_ resolve: RCTPromiseResolveBlock,
                  rejecter reject: RCTPromiseRejectBlock) {
    NSLog("[RNSoundMeter] getMessage() called")
    resolve("Microphone bridge is working!")
  }
}
