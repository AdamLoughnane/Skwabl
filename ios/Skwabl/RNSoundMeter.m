#import <React/RCTBridgeModule.h>

// Tell RN that a module named "RNSoundMeter" exists (implemented in Swift).
@interface RCT_EXTERN_MODULE(RNSoundMeter, NSObject)

// Promise method signature exported to JS.
// (Names/types must match the @objc(...) selector in Swift.)
RCT_EXTERN_METHOD(getMessage:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// RN hook; returning NO is fine unless you must touch UI on init.
+ (BOOL)requiresMainQueueSetup { return NO; }
@end
