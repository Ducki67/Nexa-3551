import config from "./config";
import logger from "./logger/logger";

type Storm = {
  id: string;
  intensity: number;
  startedAt: number;
  duration: number;
};

const state = {
  enabled: config.getBoolean("TimeLine.WaterStorm", config.getBoolean("WaterStorm", false)),
  active: new Map<string, Storm>(),
  lastStormAt: 0 as number | null,
};

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export function isEnabled() {
  return state.enabled;
}

export function setEnabled(v: boolean) {
  state.enabled = v;
  logger.backend(`WaterStorm ${v ? "enabled" : "disabled"}`);
  return state.enabled;
}

export function triggerStorm(opts?: { intensity?: number; duration?: number }) {
  if (!state.enabled) {
    logger.backend("WaterStorm trigger ignored: disabled");
    return null;
  }

  const intensity = opts?.intensity ?? Number(config.get("TimeLine.WaterLevel") || config.get("WaterLevel") || 1);
  const duration = opts?.duration ?? Number(config.get("TimeLine.WaterStormDuration") || 60);
  const id = makeId();
  const storm: Storm = { id, intensity, startedAt: Date.now(), duration };

  state.active.set(id, storm);
  state.lastStormAt = Date.now();

  logger.backend(`WaterStorm started id=${id} intensity=${intensity} duration=${duration}s`);

  // auto-clear after duration
  setTimeout(() => {
    state.active.delete(id);
    logger.backend(`WaterStorm ended id=${id}`);
  }, duration * 1000);

  return storm;
}

export function status() {
  return {
    enabled: state.enabled,
    activeCount: state.active.size,
    active: Array.from(state.active.values()),
    lastStormAt: state.lastStormAt,
  };
}

// Optional: if configured, auto-spawn storms when enabled
const autoSpawnInterval = Number(config.get("TimeLine.WaterStormSpawnInterval") || config.get("WaterStormSpawnInterval") || 0);
if (autoSpawnInterval > 0) {
  setInterval(() => {
    if (state.enabled) {
      triggerStorm();
    }
  }, autoSpawnInterval * 1000);
}

export default {
  isEnabled,
  setEnabled,
  triggerStorm,
  status,
};
