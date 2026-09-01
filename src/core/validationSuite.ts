import { SyntheticDatasetConfig } from '../types';
import { DataSamplePoint } from './mlDetection';

export const DEFAULT_SYNTHETIC_CONFIG: SyntheticDatasetConfig = {
  sampleCount: 150,
  noiseLevelPercent: 2.5,
  anomalyRatePercent: 18.0,
  anomalyMagnitudePercent: 24.0,
  spikeProbabilityPercent: 6.0,
  persistentGroupSize: 3,
};

/**
 * Generates mathematically rigorous, ground-truth-labeled synthetic EV charging session datasets.
 */
export function generateSyntheticDataset(
  config: SyntheticDatasetConfig = DEFAULT_SYNTHETIC_CONFIG
): DataSamplePoint[] {
  const {
    sampleCount,
    noiseLevelPercent,
    anomalyRatePercent,
    anomalyMagnitudePercent,
    spikeProbabilityPercent,
  } = config;

  const dataset: DataSamplePoint[] = [];

  for (let i = 0; i < sampleCount; i++) {
    // Randomized vehicle battery params (40 kWh to 90 kWh battery packs)
    const batteryCapacityKwh = 40 + Math.random() * 50;
    const initialSoc = 10 + Math.random() * 35;
    const targetSoc = 75 + Math.random() * 20;
    const nominalEfficiency = 91.0; // 91% rated charger efficiency
    const chargingPowerKw = [22, 50, 75, 120, 150][Math.floor(Math.random() * 5)];
    const ambientTempC = parseFloat((12 + Math.random() * 22).toFixed(1));

    // Physics Digital Twin expected calculation
    const deltaSoc = targetSoc - initialSoc;
    const expectedBatteryKwh = (batteryCapacityKwh * deltaSoc) / 100;
    const expectedGridKwh = expectedBatteryKwh / (nominalEfficiency / 100);

    // Determine ground truth condition
    const isAnomaly = Math.random() * 100 < anomalyRatePercent;
    const isSpike = !isAnomaly && Math.random() * 100 < spikeProbabilityPercent;

    let actualGridKwh: number;
    let actualDeviationPercent: number;

    if (isAnomaly) {
      // Injected anomalous consumption: +anomalyMagnitudePercent ± variance
      const faultScale = 1 + (anomalyMagnitudePercent + (Math.random() * 10 - 5)) / 100;
      actualGridKwh = expectedGridKwh * faultScale;
      actualDeviationPercent = Math.abs(actualGridKwh - expectedGridKwh) / expectedGridKwh * 100;
    } else if (isSpike) {
      // Injected transient spike: +16% to +22%
      const spikeScale = 1 + (16 + Math.random() * 6) / 100;
      actualGridKwh = expectedGridKwh * spikeScale;
      actualDeviationPercent = Math.abs(actualGridKwh - expectedGridKwh) / expectedGridKwh * 100;
    } else {
      // Normal session with random Gaussian-like noise (standard deviation based on noiseLevelPercent)
      const u1 = Math.max(0.0001, Math.random());
      const u2 = Math.random();
      const gaussianNoise = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const noiseFraction = (gaussianNoise * (noiseLevelPercent / 100)) / 2; // standard deviation
      const normalScale = 1 + Math.max(-0.04, Math.min(0.045, noiseFraction));
      actualGridKwh = expectedGridKwh * normalScale;
      actualDeviationPercent = Math.abs(actualGridKwh - expectedGridKwh) / expectedGridKwh * 100;
    }

    dataset.push({
      expectedEnergyKwh: parseFloat(expectedGridKwh.toFixed(3)),
      actualEnergyKwh: parseFloat(actualGridKwh.toFixed(3)),
      deviationPercent: parseFloat(actualDeviationPercent.toFixed(2)),
      powerKw: chargingPowerKw,
      ambientTempC,
      groundTruthIsAnomaly: isAnomaly || isSpike,
    });
  }

  return dataset;
}
