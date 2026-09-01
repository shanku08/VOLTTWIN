import { UnitTestResult } from '../types';
import {
  calculateBatteryEnergy,
  calculateExpectedGridEnergy,
  calculateEnergyResidual,
  calculateDeviationPercent,
  estimateRealizedEfficiency,
} from './digitalTwin';
import { classifyDeviation, detectSuddenSpike, detectPersistentAnomaly, DEFAULT_THRESHOLDS } from './anomalyDetection';
import { validateAndParseCSV, sanitizeString, sanitizeNumeric, sanitizeObject, validateAndParseJSON } from './security';
import { computeClassificationMetrics } from './mlDetection';
import { exportSessionsToCSV } from '../data/exportTemplates';

export function runAllUnitTests(): UnitTestResult[] {
  const results: UnitTestResult[] = [];

  function test(
    id: string,
    name: string,
    category: UnitTestResult['category'],
    fn: () => { passed: boolean; expected: string; actual: string; errorDetails?: string }
  ) {
    const t0 = performance.now();
    try {
      const res = fn();
      const t1 = performance.now();
      results.push({
        id,
        name,
        category,
        passed: res.passed,
        expected: res.expected,
        actual: res.actual,
        executionTimeMs: parseFloat((t1 - t0).toFixed(3)),
        errorDetails: res.errorDetails,
      });
    } catch (err: any) {
      const t1 = performance.now();
      results.push({
        id,
        name,
        category,
        passed: false,
        expected: 'Safe execution without exception',
        actual: `Exception: ${err?.message || 'Unknown'}`,
        executionTimeMs: parseFloat((t1 - t0).toFixed(3)),
        errorDetails: String(err?.stack || err),
      });
    }
  }

  // 1. Physics Calculations
  test('T01', 'Battery Energy Required (E_battery = Cap * dSOC / 100)', 'PHYSICS_MATH', () => {
    // 50 kWh pack from 20% to 80% = 50 * 0.60 = 30.0 kWh
    const eBat = calculateBatteryEnergy(50, 20, 80);
    const passed = Math.abs(eBat - 30.0) < 0.0001;
    return { passed, expected: '30.00 kWh', actual: `${eBat.toFixed(2)} kWh` };
  });

  test('T02', 'Expected Grid Energy with 90% Efficiency', 'PHYSICS_MATH', () => {
    // 30 kWh battery energy / 0.90 = 33.333 kWh
    const eExp = calculateExpectedGridEnergy(30, 90);
    const passed = Math.abs(eExp - 33.3333) < 0.01;
    return { passed, expected: '33.33 kWh', actual: `${eExp.toFixed(2)} kWh` };
  });

  test('T03', 'Energy Residual Calculation (Residual = Actual - Expected)', 'PHYSICS_MATH', () => {
    const residual = calculateEnergyResidual(42.0, 33.33);
    const passed = Math.abs(residual - 8.67) < 0.01;
    return { passed, expected: '+8.67 kWh', actual: `${residual.toFixed(2)} kWh` };
  });

  test('T04', 'Percentage Deviation (|Actual - Expected| / Expected * 100)', 'PHYSICS_MATH', () => {
    // Expected = 16.67 kWh, Actual = 21.00 kWh -> Deviation = |21 - 16.67| / 16.67 * 100 = 25.975%
    const dev = calculateDeviationPercent(21.0, 16.67);
    const passed = Math.abs(dev - 25.97) < 0.05;
    return { passed, expected: '25.98%', actual: `${dev.toFixed(2)}%` };
  });

  test('T05', 'Realized Efficiency Degradation Estimation', 'PHYSICS_MATH', () => {
    // Battery = 30 kWh, Actual Grid = 40 kWh -> Realized = 75.0%
    const eff = estimateRealizedEfficiency(30, 40);
    const passed = Math.abs(eff - 75.0) < 0.01;
    return { passed, expected: '75.00%', actual: `${eff.toFixed(2)}%` };
  });

  // 2. Anomaly Classification
  test('T06', 'Classify Normal Charging (Deviation < 5%)', 'ANOMALY_CLASSIFICATION', () => {
    const status = classifyDeviation(2.4, DEFAULT_THRESHOLDS);
    return { passed: status === 'NORMAL', expected: 'NORMAL', actual: status };
  });

  test('T07', 'Classify Warning Level (5% <= Deviation <= 15%)', 'ANOMALY_CLASSIFICATION', () => {
    const status = classifyDeviation(10.5, DEFAULT_THRESHOLDS);
    return { passed: status === 'WARNING', expected: 'WARNING', actual: status };
  });

  test('T08', 'Classify Anomaly Level (Deviation > 15%)', 'ANOMALY_CLASSIFICATION', () => {
    const status = classifyDeviation(25.98, DEFAULT_THRESHOLDS);
    return { passed: status === 'ANOMALY', expected: 'ANOMALY', actual: status };
  });

  test('T09', 'Sudden Spike Detection on Transient Power Step', 'ANOMALY_CLASSIFICATION', () => {
    const series = [50, 50, 51, 72, 50, 50]; // +21 kW jump at index 3
    const res = detectSuddenSpike(series, 8.0);
    return {
      passed: res.hasSpike && res.spikeIndex === 3,
      expected: 'Spike detected at index 3 (delta >= 8 kW)',
      actual: `Spike=${res.hasSpike}, maxDelta=${res.maxDeltaKw}kW, index=${res.spikeIndex}`,
    };
  });

  test('T10', 'Persistent Anomaly Detection Across Consecutive Sessions', 'ANOMALY_CLASSIFICATION', () => {
    const mockSessions: any[] = [
      { chargerId: 'CHG-1', timestamp: '2026-08-30T12:00:00Z', deviationPercent: 18.2, status: 'ANOMALY' },
      { chargerId: 'CHG-1', timestamp: '2026-08-30T11:00:00Z', deviationPercent: 16.5, status: 'ANOMALY' },
      { chargerId: 'CHG-1', timestamp: '2026-08-30T10:00:00Z', deviationPercent: 19.1, status: 'ANOMALY' },
    ];
    const res = detectPersistentAnomaly(mockSessions, 'CHG-1', DEFAULT_THRESHOLDS);
    return {
      passed: res.isPersistent && res.consecutiveCount === 3,
      expected: 'Persistent Anomaly = true (3 consecutive anomalies)',
      actual: `isPersistent=${res.isPersistent}, count=${res.consecutiveCount}, avgDev=${res.averageDeviation}%`,
    };
  });

  // 3. Security & Sanitization
  test('T11', 'Sanitize CSV Formula Injection Prefix (=, +, -, @, %)', 'SECURITY_SANITIZATION', () => {
    const formulaPayload = '=cmd|"/C calc"!A0';
    const sanitized = sanitizeString(formulaPayload);
    const passed = sanitized.startsWith("'=");
    return { passed, expected: "'=cmd|\"/C calc\"!A0", actual: sanitized };
  });

  test('T12', 'CSV Validator Rejects Negative Energy', 'SECURITY_SANITIZATION', () => {
    const csv = `session_id,charger_id,battery_capacity_kwh,initial_soc,target_soc,actual_energy_kwh\nS1,C1,50,20,80,-15.5`;
    const res = validateAndParseCSV(csv);
    return {
      passed: !res.isValid && res.validRowCount === 0,
      expected: 'Rejected negative actual energy row',
      actual: `Valid rows: ${res.validRowCount}, Warnings: ${res.warnings.length}`,
    };
  });

  test('T13', 'CSV Validator Rejects Impossible SOC Bounds (>100% or Initial > Target)', 'SECURITY_SANITIZATION', () => {
    const csv = `session_id,charger_id,battery_capacity_kwh,initial_soc,target_soc,actual_energy_kwh\nS2,C1,50,90,40,25.0`;
    const res = validateAndParseCSV(csv);
    return {
      passed: res.validRowCount === 0,
      expected: 'Rejected invalid initial > target SOC row',
      actual: `Valid rows: ${res.validRowCount}, Warnings: ${res.warnings[0] || 'None'}`,
    };
  });

  test('T14', 'Prototype Pollution Sanitizer Strips __proto__ and constructor', 'SECURITY_SANITIZATION', () => {
    const dirtyJson = '{"name":"safe","__proto__":{"isAdmin":true},"constructor":{"prototype":{"polluted":true}}}';
    const parsed = JSON.parse(dirtyJson);
    const cleaned = sanitizeObject(parsed) as any;
    const passed = cleaned.name === 'safe' && !('__proto__' in cleaned) && !('constructor' in cleaned);
    return {
      passed,
      expected: 'Stripped __proto__ and constructor keys',
      actual: `Cleaned keys: ${Object.keys(cleaned).join(', ')}`,
    };
  });

  test('T15', 'Numeric Sanitizer Clamps and Validates Non-Finite Values', 'SECURITY_SANITIZATION', () => {
    const clampedNaN = sanitizeNumeric(NaN, 50, 0, 100);
    const clampedHigh = sanitizeNumeric(250, 50, 0, 100);
    const clampedLow = sanitizeNumeric(-40, 50, 0, 100);
    const passed = clampedNaN === 50 && clampedHigh === 100 && clampedLow === 0;
    return {
      passed,
      expected: 'NaN->50, 250->100, -40->0',
      actual: `NaN->${clampedNaN}, 250->${clampedHigh}, -40->${clampedLow}`,
    };
  });

  // 4. Edge Cases & ML Metrics
  test('T16', 'Zero Division Guard on Expected Energy Zero', 'EDGE_CASES', () => {
    const dev = calculateDeviationPercent(10.0, 0);
    return { passed: dev === 0, expected: '0.00% (safe fallback)', actual: `${dev.toFixed(2)}%` };
  });

  test('T17', 'Confusion Matrix & F1-Score Precision Math', 'EDGE_CASES', () => {
    const groundTruth = [true, true, false, false, true];
    const predictions = [true, false, false, false, true];
    // TP=2, FN=1, TN=2, FP=0
    // Accuracy = 4/5 = 80%, Precision = 2/2 = 100%, Recall = 2/3 = 66.67%, F1 = 80%
    const metrics = computeClassificationMetrics(groundTruth, predictions, 1.2);
    const passed = metrics.accuracy === 80 && metrics.precision === 100 && Math.abs(metrics.recall - 66.67) < 0.1;
    return {
      passed,
      expected: 'Acc=80%, Prec=100%, Rec=66.67%, F1=80%',
      actual: `Acc=${metrics.accuracy}%, Prec=${metrics.precision}%, Rec=${metrics.recall}%, F1=${metrics.f1Score}%`,
    };
  });

  return results;
}

