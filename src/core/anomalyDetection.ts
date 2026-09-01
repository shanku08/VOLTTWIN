import { AnomalyStatus, ForensicExplanation, ThresholdSettings, ChargingSession } from '../types';
import { calculateDeviationPercent, estimateRealizedEfficiency, calculateBatteryEnergy } from './digitalTwin';

export const DEFAULT_THRESHOLDS: ThresholdSettings = {
  normalDeviationThreshold: 5.0,
  anomalyDeviationThreshold: 15.0,
  spikeDeltaThresholdKw: 8.0,
  consecutiveAnomalyCountForPersistent: 3,
  persistentAnomalyThreshold: 12.0,
  normalMaxDeviation: 5.0,
  warningMaxDeviation: 15.0,
  persistentAnomalyWindow: 3,
};

/**
 * Baseline physics-informed threshold classification for a single session.
 */
export function classifyDeviation(
  deviationPercent: number,
  thresholds: ThresholdSettings = DEFAULT_THRESHOLDS
): AnomalyStatus {
  if (isNaN(deviationPercent) || deviationPercent < 0) {
    return 'NORMAL';
  }
  const normalLim = thresholds.normalDeviationThreshold ?? thresholds.normalMaxDeviation ?? 5.0;
  const anomalyLim = thresholds.anomalyDeviationThreshold ?? thresholds.warningMaxDeviation ?? 15.0;

  if (deviationPercent < normalLim) {
    return 'NORMAL';
  } else if (deviationPercent <= anomalyLim) {
    return 'WARNING';
  } else {
    return 'ANOMALY';
  }
}

/**
 * Evaluates whether a sudden spike occurred between consecutive telemetry time points.
 */
export function detectSuddenSpike(
  powerKwSeries: number[],
  thresholdKw: number = DEFAULT_THRESHOLDS.spikeDeltaThresholdKw
): { hasSpike: boolean; maxDeltaKw: number; spikeIndex?: number } {
  if (powerKwSeries.length < 2) return { hasSpike: false, maxDeltaKw: 0 };
  
  let maxDeltaKw = 0;
  let spikeIndex: number | undefined = undefined;

  for (let i = 1; i < powerKwSeries.length; i++) {
    const delta = Math.abs(powerKwSeries[i] - powerKwSeries[i - 1]);
    if (delta > maxDeltaKw) {
      maxDeltaKw = delta;
      if (delta >= thresholdKw) {
        spikeIndex = i;
      }
    }
  }

  return {
    hasSpike: maxDeltaKw >= thresholdKw,
    maxDeltaKw: parseFloat(maxDeltaKw.toFixed(2)),
    spikeIndex,
  };
}

/**
 * Checks for persistent anomaly pattern across consecutive sessions for a given charger or EV.
 */
export function detectPersistentAnomaly(
  recentSessions: ChargingSession[],
  targetChargerId: string,
  thresholds: ThresholdSettings = DEFAULT_THRESHOLDS
): { isPersistent: boolean; consecutiveCount: number; averageDeviation: number } {
  const windowCount = thresholds.consecutiveAnomalyCountForPersistent ?? thresholds.persistentAnomalyWindow ?? 3;
  const chargerSessions = recentSessions
    .filter((s) => s.chargerId === targetChargerId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (chargerSessions.length < windowCount) {
    return { isPersistent: false, consecutiveCount: 0, averageDeviation: 0 };
  }

  const windowSessions = chargerSessions.slice(0, windowCount);
  const anomalousCount = windowSessions.filter(
    (s) => s.deviationPercent >= thresholds.persistentAnomalyThreshold || s.status === 'ANOMALY'
  ).length;

  const totalDev = windowSessions.reduce((acc, s) => acc + s.deviationPercent, 0);
  const averageDeviation = totalDev / windowSessions.length;

  const isPersistent = anomalousCount >= windowCount;

  return {
    isPersistent,
    consecutiveCount: anomalousCount,
    averageDeviation: parseFloat(averageDeviation.toFixed(2)),
  };
}

/**
 * Generates an objective, non-accusatory forensic explanation for an energy session.
 */
export function generateForensicExplanation(
  expectedEnergyKwh: number,
  actualEnergyKwh: number,
  deviationPercent: number,
  status: AnomalyStatus,
  batteryCapacityKwh: number,
  initialSoc: number,
  targetSoc: number,
  ambientTempC: number = 25,
  isPersistent: boolean = false,
  hasSpike: boolean = false
): ForensicExplanation {
  const batteryKwh = calculateBatteryEnergy(batteryCapacityKwh, initialSoc, targetSoc);
  const realizedEfficiency = estimateRealizedEfficiency(batteryKwh, actualEnergyKwh);
  const residualKwh = actualEnergyKwh - expectedEnergyKwh;

  const possibleCauses: string[] = [];
  let summary = '';
  let deviationStatement = `Expected energy: ${expectedEnergyKwh.toFixed(2)} kWh | Actual energy: ${actualEnergyKwh.toFixed(2)} kWh | Residual: ${residualKwh > 0 ? '+' : ''}${residualKwh.toFixed(2)} kWh (${deviationPercent.toFixed(2)}% deviation).`;
  let recommendedAction = 'Continue standard operational monitoring.';
  let confidenceScore = 95;

  if (isPersistent) {
    status = 'PERSISTENT_ANOMALY';
    summary = 'Persistent abnormal energy consumption pattern detected across consecutive charging sessions for this hardware node.';
    possibleCauses.push('Progressive charger power conversion (AC/DC inverter) efficiency degradation');
    possibleCauses.push('Persistent high contact resistance at the charging coupler or distribution cabling');
    possibleCauses.push('Continuous unmetered auxiliary sub-load or thermal management draw');
    possibleCauses.push('Systematic sensor calibration offset or CT clamp measurement drift');
    recommendedAction = 'Dispatch physical field technician for insulation resistance test, thermal imaging of coupler, and power analyzer calibration.';
    confidenceScore = 92;
  } else if (hasSpike) {
    status = 'SUDDEN_SPIKE';
    summary = 'Sudden transient energy consumption spike observed between consecutive telemetry sampling intervals.';
    possibleCauses.push('Transient high-power auxiliary load engagement (e.g. cabin pre-conditioning or battery thermal chiller ramp-up)');
    possibleCauses.push('Grid voltage sag causing current spike to maintain regulated DC charging power');
    possibleCauses.push('Intermittent communication telemetry dropout or digital sensor glitch');
    recommendedAction = 'Inspect high-frequency telemetry timestamps and verify auxiliary power log correlation.';
    confidenceScore = 88;
  } else if (status === 'ANOMALY') {
    summary = 'Actual energy consumption is significantly higher than the physics-informed digital twin baseline expectation.';
    possibleCauses.push('Charger power electronics efficiency degradation (severe thermal dissipation)');
    possibleCauses.push('Excessive parasitic resistance in delivery cable harness');
    possibleCauses.push('Auxiliary heating/cooling consumption not accounted for in standard baseline');
    possibleCauses.push('Power meter / CT sensor calibration drift');
    possibleCauses.push('Abnormal charging behaviour or unaccounted energy diversion');
    recommendedAction = 'Flag session for review; perform automated diagnostic sweep of the charger station.';
    confidenceScore = 94;
  } else if (status === 'WARNING') {
    summary = 'Energy consumption displays moderate deviation from baseline model expectations, approaching tolerance boundary.';
    possibleCauses.push('Moderate thermal dissipation due to elevated ambient temperature (' + ambientTempC + '°C)');
    possibleCauses.push('Mild charger inverter aging or filter component impedance shift');
    possibleCauses.push('Vehicle cabin auxiliary load active during charging session');
    possibleCauses.push('Standard tolerance variance in battery state-of-charge estimation');
    recommendedAction = 'Monitor next 3 sessions on this charger port for persistent upward trend.';
    confidenceScore = 89;
  } else {
    summary = 'Energy consumption aligns closely with physics-informed digital twin baseline expectations.';
    possibleCauses.push('Nominal operation within calibrated physical bounds (thermal & inverter efficiency matching specifications)');
    recommendedAction = 'No corrective action required. Charger station operational health is optimal.';
    confidenceScore = 98;
  }

  return {
    primaryClassification: status,
    summary,
    deviationStatement,
    possibleCauses,
    recommendedAction,
    confidenceScore,
    estimatedEfficiencyDegradation: realizedEfficiency < 90 ? parseFloat((90 - realizedEfficiency).toFixed(1)) : 0,
  };
}
