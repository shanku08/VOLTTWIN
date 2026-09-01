import { PhysicalParameters, ChargingTelemetryPoint, AnomalyStatus } from '../types';

/**
 * Calculates theoretical battery energy required to change from initial to target SOC.
 * E_battery = Battery Capacity × (Target SOC − Initial SOC) / 100
 */
export function calculateBatteryEnergy(capacityKwh: number, initialSoc: number, targetSoc: number): number {
  if (capacityKwh <= 0) return 0;
  const deltaSoc = Math.max(0, Math.min(100, targetSoc) - Math.max(0, Math.min(100, initialSoc)));
  return (capacityKwh * deltaSoc) / 100;
}

/**
 * Calculates expected grid energy consumed taking charging efficiency into account.
 * E_expected = E_battery / (Charging Efficiency / 100)
 */
export function calculateExpectedGridEnergy(batteryEnergyKwh: number, efficiencyPercent: number): number {
  if (efficiencyPercent <= 0) return batteryEnergyKwh;
  const efficiencyDecimal = Math.max(0.01, Math.min(100, efficiencyPercent)) / 100;
  return batteryEnergyKwh / efficiencyDecimal;
}

/**
 * Calculates residual energy.
 * Residual = E_actual − E_expected
 */
export function calculateEnergyResidual(actualEnergyKwh: number, expectedEnergyKwh: number): number {
  return actualEnergyKwh - expectedEnergyKwh;
}

/**
 * Calculates percentage deviation.
 * Deviation (%) = |E_actual − E_expected| / E_expected × 100
 */
export function calculateDeviationPercent(actualEnergyKwh: number, expectedEnergyKwh: number): number {
  if (expectedEnergyKwh <= 0.0001) return 0;
  const residual = Math.abs(actualEnergyKwh - expectedEnergyKwh);
  return (residual / expectedEnergyKwh) * 100;
}

/**
 * Estimates actual realized efficiency from measured energy.
 * Realized Efficiency (%) = (E_battery / E_actual) × 100
 */
export function estimateRealizedEfficiency(batteryEnergyKwh: number, actualEnergyKwh: number): number {
  if (actualEnergyKwh <= 0.0001) return 0;
  return Math.min(100, (batteryEnergyKwh / actualEnergyKwh) * 100);
}

/**
 * Temperature derating modifier for battery efficiency and internal resistance.
 * Optimal ambient is 20°C - 30°C.
 */
export function calculateTemperatureThermalFactor(ambientTempC: number = 25): {
  efficiencyMultiplier: number;
  resistanceMultiplier: number;
  description: string;
} {
  if (ambientTempC < 0) {
    return {
      efficiencyMultiplier: 0.88,
      resistanceMultiplier: 1.35,
      description: 'Severe cold: increased lithium-ion internal impedance and battery heating overhead.',
    };
  } else if (ambientTempC < 15) {
    return {
      efficiencyMultiplier: 0.94,
      resistanceMultiplier: 1.15,
      description: 'Moderate cold: mild internal resistance increase.',
    };
  } else if (ambientTempC > 40) {
    return {
      efficiencyMultiplier: 0.92,
      resistanceMultiplier: 1.20,
      description: 'High heat: active cooling chiller loads and thermal dissipation losses.',
    };
  } else {
    return {
      efficiencyMultiplier: 1.0,
      resistanceMultiplier: 1.0,
      description: 'Optimal thermal operating window.',
    };
  }
}

/**
 * Simulates a realistic CC-CV charging curve time-series telemetry.
 */
export function generateSessionTelemetry(
  params: PhysicalParameters,
  faultType: 'NONE' | 'WARNING_LOSS' | 'ANOMALY_LEAKAGE' | 'SUDDEN_SPIKE' | 'CV_FAULT' | 'PERSISTENT' = 'NONE',
  timeSteps: number = 24
): ChargingTelemetryPoint[] {
  const { batteryCapacityKwh, initialSoc, targetSoc, chargingEfficiency, chargingPowerKw, ambientTemperatureC = 25 } = params;
  const totalBatteryKwh = calculateBatteryEnergy(batteryCapacityKwh, initialSoc, targetSoc);
  const totalExpectedGridKwh = calculateExpectedGridEnergy(totalBatteryKwh, chargingEfficiency);

  const points: ChargingTelemetryPoint[] = [];
  const nominalVoltage = 400; // 400V architecture
  const socRange = targetSoc - initialSoc;

  let currentActualEnergy = 0;
  let currentExpectedEnergy = 0;

  for (let i = 0; i <= timeSteps; i++) {
    const progressFraction = i / timeSteps;
    const timeSeconds = progressFraction * (totalExpectedGridKwh / (chargingPowerKw || 50)) * 3600;
    const currentSoc = initialSoc + socRange * progressFraction;

    // Power taper in Constant Voltage phase (SOC > 80%)
    let powerFactor = 1.0;
    if (currentSoc > 80) {
      powerFactor = Math.max(0.2, 1.0 - ((currentSoc - 80) / 20) * 0.75);
    }

    const expectedPowerStepKw = chargingPowerKw * powerFactor;
    let actualPowerStepKw = expectedPowerStepKw;

    // Apply specific fault injections
    let faultLabel = undefined;
    if (faultType === 'WARNING_LOSS') {
      actualPowerStepKw *= 1.10; // +10% loss
      faultLabel = 'Moderate thermal dissipation loss (10% over-consumption)';
    } else if (faultType === 'ANOMALY_LEAKAGE') {
      actualPowerStepKw *= 1.28; // +28% anomaly
      faultLabel = 'Severe energy anomaly / potential shunt dissipation (28% over-consumption)';
    } else if (faultType === 'SUDDEN_SPIKE') {
      if (progressFraction >= 0.45 && progressFraction <= 0.65) {
        actualPowerStepKw *= 1.75; // sudden transient surge
        faultLabel = 'Sudden transient power surge / measurement sensor anomaly';
      }
    } else if (faultType === 'CV_FAULT') {
      if (currentSoc > 80) {
        actualPowerStepKw *= 1.45; // Failed to taper in CV phase
        faultLabel = 'Failure to taper power in CV phase (BMS regulation anomaly)';
      }
    } else if (faultType === 'PERSISTENT') {
      actualPowerStepKw *= 1.22; // Persistent over-consumption
      faultLabel = 'Repeated persistent energy consumption anomaly';
    } else {
      // Normal mild stochastic measurement noise (±1.2%)
      const noise = (Math.sin(i * 1.5) * 0.012);
      actualPowerStepKw *= (1 + noise);
    }

    // Cumulative energy calculation
    const deltaHours = (timeSeconds - (points[i - 1]?.timeSeconds || 0)) / 3600;
    if (i > 0) {
      currentExpectedEnergy += expectedPowerStepKw * deltaHours;
      currentActualEnergy += actualPowerStepKw * deltaHours;
    }

    const residualKwh = currentActualEnergy - currentExpectedEnergy;
    const deviationPercent = calculateDeviationPercent(currentActualEnergy, currentExpectedEnergy);

    let status: AnomalyStatus = 'NORMAL';
    if (faultType === 'SUDDEN_SPIKE' && progressFraction >= 0.45 && progressFraction <= 0.65) {
      status = 'SUDDEN_SPIKE';
    } else if (faultType === 'PERSISTENT') {
      status = 'PERSISTENT_ANOMALY';
    } else if (deviationPercent > 15) {
      status = 'ANOMALY';
    } else if (deviationPercent >= 5) {
      status = 'WARNING';
    }

    const voltageV = nominalVoltage + (currentSoc / 100) * 40; // 400V -> 440V ramp
    const currentA = (actualPowerStepKw * 1000) / (voltageV || 1);
    const temperatureC = ambientTemperatureC + (actualPowerStepKw / 10) * 1.8 + (status === 'ANOMALY' ? 8 : 0);

    points.push({
      timeSeconds: Math.round(timeSeconds),
      soc: parseFloat(currentSoc.toFixed(1)),
      expectedPowerKw: parseFloat(expectedPowerStepKw.toFixed(2)),
      actualPowerKw: parseFloat(actualPowerStepKw.toFixed(2)),
      expectedEnergyKwh: parseFloat(currentExpectedEnergy.toFixed(3)),
      actualEnergyKwh: parseFloat(currentActualEnergy.toFixed(3)),
      residualKwh: parseFloat(residualKwh.toFixed(3)),
      deviationPercent: parseFloat(deviationPercent.toFixed(2)),
      status,
      temperatureC: parseFloat(temperatureC.toFixed(1)),
      voltageV: parseFloat(voltageV.toFixed(1)),
      currentA: parseFloat(currentA.toFixed(1)),
      injectedFault: faultLabel,
    });
  }

  return points;
}
