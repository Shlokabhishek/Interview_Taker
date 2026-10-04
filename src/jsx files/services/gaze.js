import { INTEGRITY_CONFIG } from './integrity';

export class GazeWindow {
  constructor(config = INTEGRITY_CONFIG.gaze) {
    this.config = config;
    this.samples = [];
  }

  add(sample) {
    const now = sample.timestamp || Date.now();
    this.samples.push({ ...sample, timestamp: now });
    this.samples = this.samples.filter((entry) => now - entry.timestamp <= this.config.sustainedWindowMs);
    const downward = this.samples.filter((entry) => Number(entry.pitch) >= this.config.downwardAngleDeg);
    if (downward.length < this.config.minSamples) return null;
    const durationMs = downward[downward.length - 1].timestamp - downward[0].timestamp;
    if (durationMs < this.config.sustainedWindowMs * 0.6) return null;
    return {
      type: 'gaze_anomaly',
      duration_ms: durationMs,
      angle: Math.round(downward.reduce((sum, entry) => sum + Number(entry.pitch || 0), 0) / downward.length),
      confidence: Math.min(0.9, 0.45 + durationMs / this.config.sustainedWindowMs * 0.35),
      timestamp: new Date(now).toISOString(),
    };
  }
}

export const gazeLimitations = 'Face landmark model unavailable; gaze events are omitted instead of inferred when browser/model support is weak.';
