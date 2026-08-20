// iOS PWA launch (startup) images. iOS does not use manifest background_color
// for the splash - it needs a per-device apple-touch-startup-image whose media
// query matches the device's CSS width/height, pixel ratio, and orientation.
// Portrait only (the app is portrait-locked). Shared dims cover multiple models.
export type AppleSplash = { file: string; w: number; h: number; r: number }

export const APPLE_SPLASH: AppleSplash[] = [
  { file: 'splash-640x1136.png', w: 320, h: 568, r: 2 },   // SE (1st gen)
  { file: 'splash-750x1334.png', w: 375, h: 667, r: 2 },   // SE 2/3, 8, 7, 6s
  { file: 'splash-1242x2208.png', w: 414, h: 736, r: 3 },  // 8+/7+/6+
  { file: 'splash-1125x2436.png', w: 375, h: 812, r: 3 },  // X/XS/11 Pro/12-13 mini
  { file: 'splash-828x1792.png', w: 414, h: 896, r: 2 },   // XR/11
  { file: 'splash-1242x2688.png', w: 414, h: 896, r: 3 },  // XS Max/11 Pro Max
  { file: 'splash-1170x2532.png', w: 390, h: 844, r: 3 },  // 12/12 Pro/13/13 Pro/14
  { file: 'splash-1284x2778.png', w: 428, h: 926, r: 3 },  // 12/13 Pro Max/14 Plus
  { file: 'splash-1179x2556.png', w: 393, h: 852, r: 3 },  // 14 Pro/15/15 Pro/16
  { file: 'splash-1290x2796.png', w: 430, h: 932, r: 3 },  // 14 Pro Max/15 Plus/15-16 Pro Max
  { file: 'splash-1206x2622.png', w: 402, h: 874, r: 3 },  // 16 Pro
  { file: 'splash-1320x2868.png', w: 440, h: 956, r: 3 },  // 16 Pro Max
  { file: 'splash-1536x2048.png', w: 768, h: 1024, r: 2 }, // iPad 9.7
  { file: 'splash-1620x2160.png', w: 810, h: 1080, r: 2 }, // iPad 10.2
  { file: 'splash-1640x2360.png', w: 820, h: 1180, r: 2 }, // iPad Air 10.9 / 10th gen
  { file: 'splash-1668x2388.png', w: 834, h: 1194, r: 2 }, // iPad Pro 11
  { file: 'splash-2048x2732.png', w: 1024, h: 1366, r: 2 }, // iPad Pro 12.9
]
