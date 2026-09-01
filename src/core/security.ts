import { ChargingSession } from '../types';
import { calculateBatteryEnergy, calculateExpectedGridEnergy, calculateDeviationPercent } from './digitalTwin';
import { classifyDeviation, generateForensicExplanation } from './anomalyDetection';

export interface CSVValidationResult {
  isValid: boolean;
  sessions: ChargingSession[];
  errors: string[];
  warnings: string[];
  totalRowsParsed: number;
  validRowCount: number;
  rejectedRowCount: number;
}

export interface JSONValidationResult {
  isValid: boolean;
  data: any;
  errors: string[];
  warnings: string[];
}

/**
 * Strips prototype pollution keys (__proto__, constructor, prototype) recursively.
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }
  const safeObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    safeObj[key] = sanitizeObject(value);
  }
  return safeObj as T;
}

/**
 * Sanitizes strings against CSV formula injection and XSS vectors.
 */
export function sanitizeString(input: string | number | boolean | null | undefined): string {
  if (input === null || input === undefined) return '';
  let sanitized = String(input).trim();

  // Neutralize CSV formula trigger characters if placed at start of cell (=, +, -, @, \t, \r, %, |)
  const formulaTriggers = ['=', '+', '-', '@', '\t', '\r', '%', '|'];
  if (formulaTriggers.includes(sanitized.charAt(0))) {
    sanitized = "'" + sanitized;
  }

  // Remove dangerous script injection keywords, javascript: protocols, and HTML tag delimiters
  sanitized = sanitized
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/\0/g, '');

  return sanitized;
}

/**
 * Validates and safely parses numeric inputs within bounded physical ranges.
 */
export function sanitizeNumeric(
  value: any,
  defaultValue: number,
  min: number = -Infinity,
  max: number = Infinity
): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(min, Math.min(max, value));
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value.trim());
    if (Number.isFinite(parsed)) {
      return Math.max(min, Math.min(max, parsed));
    }
  }
  return defaultValue;
}

/**
 * Validates and safely parses uploaded JSON content with prototype pollution and size checks.
 */
export function validateAndParseJSON(jsonString: string, maxSizeBytes: number = 5 * 1024 * 1024): JSONValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!jsonString || jsonString.trim().length === 0) {
    return { isValid: false, data: null, errors: ['JSON content is empty.'], warnings: [] };
  }

  if (jsonString.length > maxSizeBytes) {
    return {
      isValid: false,
      data: null,
      errors: [`JSON content exceeds maximum allowed size (${(maxSizeBytes / (1024 * 1024)).toFixed(1)}MB).`],
      warnings: [],
    };
  }

  try {
    const rawParsed = JSON.parse(jsonString);
    const sanitizedData = sanitizeObject(rawParsed);
    return { isValid: true, data: sanitizedData, errors: [], warnings };
  } catch (err: any) {
    return {
      isValid: false,
      data: null,
      errors: [`JSON Syntax Error: ${err?.message || 'Malformed JSON payload.'}`],
      warnings: [],
    };
  }
}

/**
 * Validates and parses uploaded CSV files containing EV charging session records.
 * Implements strict security bounds, XSS mitigation, and CSV formula injection neutralization.
 */
export function validateAndParseCSV(csvContent: string): CSVValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sessions: ChargingSession[] = [];
  const seenSessionIds = new Set<string>();

  if (!csvContent || csvContent.trim().length === 0) {
    return {
      isValid: false,
      sessions: [],
      errors: ['File is empty. Please provide a valid CSV containing charging records.'],
      warnings: [],
      totalRowsParsed: 0,
      validRowCount: 0,
      rejectedRowCount: 0,
    };
  }

  // Maximum file size safety guard (5 MB)
  if (csvContent.length > 5 * 1024 * 1024) {
    return {
      isValid: false,
      sessions: [],
      errors: ['File size exceeds the 5MB security threshold limit.'],
      warnings: [],
      totalRowsParsed: 0,
      validRowCount: 0,
      rejectedRowCount: 0,
    };
  }

  const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) {
    return {
      isValid: false,
      sessions: [],
      errors: ['CSV must contain at least a header row and one valid data record.'],
      warnings: [],
      totalRowsParsed: 0,
      validRowCount: 0,
      rejectedRowCount: 0,
    };
  }

  // Maximum row limit to prevent browser memory exhaustion (max 5,000 records)
  const maxRowsAllowed = 5000;
  const rowsToProcess = lines.slice(1, maxRowsAllowed + 1);
  if (lines.length - 1 > maxRowsAllowed) {
    warnings.push(`File contains ${lines.length - 1} rows. Truncated to the first ${maxRowsAllowed} rows for client stability.`);
  }

  const headerTokens = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  
  // Required column detection
  const colIndex = {
    timestamp: headerTokens.findIndex((h) => h.includes('time') || h.includes('date')),
    sessionId: headerTokens.findIndex((h) => h.includes('session_id') || h.includes('session') || h.includes('id')),
    chargerId: headerTokens.findIndex((h) => h.includes('charger_id') || h.includes('charger') || h.includes('station')),
    evId: headerTokens.findIndex((h) => h.includes('ev_id') || h.includes('vehicle') || h.includes('car')),
    batteryCapacity: headerTokens.findIndex((h) => h.includes('capacity') || h.includes('battery')),
    initialSoc: headerTokens.findIndex((h) => h.includes('initial_soc') || h.includes('soc_start') || h.includes('start_soc')),
    targetSoc: headerTokens.findIndex((h) => h.includes('target_soc') || h.includes('soc_end') || h.includes('end_soc')),
    chargingPower: headerTokens.findIndex((h) => h.includes('power') || h.includes('kw')),
    chargingEfficiency: headerTokens.findIndex((h) => h.includes('efficiency') || h.includes('eff')),
    expectedEnergy: headerTokens.findIndex((h) => h.includes('expected_energy') || h.includes('expected_kwh') || h.includes('e_expected')),
    actualEnergy: headerTokens.findIndex((h) => h.includes('actual_energy') || h.includes('actual_kwh') || h.includes('e_actual')),
    ambientTemp: headerTokens.findIndex((h) => h.includes('temp') || h.includes('temperature')),
  };

  if (colIndex.actualEnergy === -1) {
    return {
      isValid: false,
      sessions: [],
      errors: ['Missing mandatory column: "actual_energy_kwh" (or actual energy column).'],
      warnings: [],
      totalRowsParsed: rowsToProcess.length,
      validRowCount: 0,
      rejectedRowCount: rowsToProcess.length,
    };
  }

  let rejectedCount = 0;

  for (let rowIndex = 0; rowIndex < rowsToProcess.length; rowIndex++) {
    const rawLine = rowsToProcess[rowIndex];
    const tokens = rawLine.split(',').map((t) => t.trim().replace(/^["']|["']$/g, ''));

    if (tokens.length < 3) {
      warnings.push(`Row ${rowIndex + 2}: Skipped row due to insufficient columns.`);
      rejectedCount++;
      continue;
    }

    try {
      const sessionIdRaw = colIndex.sessionId >= 0 && tokens[colIndex.sessionId] ? tokens[colIndex.sessionId] : `SESS-${Date.now()}-${rowIndex + 1}`;
      let sessionId = sanitizeString(sessionIdRaw);

      if (seenSessionIds.has(sessionId)) {
        sessionId = `${sessionId}-${rowIndex + 1}`;
        warnings.push(`Row ${rowIndex + 2}: Duplicate session ID detected. Generated safe unique ID "${sessionId}".`);
      }
      seenSessionIds.add(sessionId);

      const timestamp = colIndex.timestamp >= 0 && tokens[colIndex.timestamp] ? sanitizeString(tokens[colIndex.timestamp]) : new Date().toISOString();
      const chargerId = colIndex.chargerId >= 0 && tokens[colIndex.chargerId] ? sanitizeString(tokens[colIndex.chargerId]) : 'CHG-PORT-01';
      const evId = colIndex.evId >= 0 && tokens[colIndex.evId] ? sanitizeString(tokens[colIndex.evId]) : `EV-${100 + rowIndex}`;

      const batteryCapacity = colIndex.batteryCapacity >= 0 ? sanitizeNumeric(tokens[colIndex.batteryCapacity], 65.0, 5.0, 300.0) : 65.0;
      const initialSoc = colIndex.initialSoc >= 0 ? sanitizeNumeric(tokens[colIndex.initialSoc], 20.0, 0.0, 100.0) : 20.0;
      const targetSoc = colIndex.targetSoc >= 0 ? sanitizeNumeric(tokens[colIndex.targetSoc], 80.0, 0.0, 100.0) : 80.0;
      const chargingPower = colIndex.chargingPower >= 0 ? sanitizeNumeric(tokens[colIndex.chargingPower], 50.0, 1.0, 500.0) : 50.0;
      const efficiency = colIndex.chargingEfficiency >= 0 ? sanitizeNumeric(tokens[colIndex.chargingEfficiency], 90.0, 50.0, 100.0) : 90.0;
      const actualEnergy = parseFloat(tokens[colIndex.actualEnergy]);
      const ambientTemp = colIndex.ambientTemp >= 0 ? sanitizeNumeric(tokens[colIndex.ambientTemp], 25.0, -50.0, 70.0) : 25.0;

      // Numerical validity and safety bounds
      if (isNaN(actualEnergy) || actualEnergy < 0 || actualEnergy > 1000) {
        warnings.push(`Row ${rowIndex + 2}: Invalid or out-of-bounds actual energy (${tokens[colIndex.actualEnergy]}). Row rejected.`);
        rejectedCount++;
        continue;
      }

      if (initialSoc < 0 || initialSoc > 100 || targetSoc < 0 || targetSoc > 100 || initialSoc > targetSoc) {
        warnings.push(`Row ${rowIndex + 2}: Invalid SOC bounds (Initial: ${initialSoc}%, Target: ${targetSoc}%). Row rejected.`);
        rejectedCount++;
        continue;
      }

      if (batteryCapacity <= 0 || batteryCapacity > 500) {
        warnings.push(`Row ${rowIndex + 2}: Battery capacity ${batteryCapacity} kWh is outside physical boundaries (0-500 kWh). Row rejected.`);
        rejectedCount++;
        continue;
      }

      let expectedEnergy: number;
      if (colIndex.expectedEnergy >= 0 && !isNaN(parseFloat(tokens[colIndex.expectedEnergy]))) {
        expectedEnergy = parseFloat(tokens[colIndex.expectedEnergy]);
      } else {
        const batteryKwh = calculateBatteryEnergy(batteryCapacity, initialSoc, targetSoc);
        expectedEnergy = calculateExpectedGridEnergy(batteryKwh, efficiency);
      }

      const residual = actualEnergy - expectedEnergy;
      const deviationPercent = calculateDeviationPercent(actualEnergy, expectedEnergy);
      const status = classifyDeviation(deviationPercent);
      const explanation = generateForensicExplanation(
        expectedEnergy,
        actualEnergy,
        deviationPercent,
        status,
        batteryCapacity,
        initialSoc,
        targetSoc,
        ambientTemp
      );

      sessions.push({
        id: sessionId,
        timestamp,
        evId,
        chargerId,
        batteryCapacityKwh: batteryCapacity,
        initialSoc,
        targetSoc,
        chargingPowerKw: chargingPower,
        chargingEfficiency: efficiency,
        ambientTemperatureC: ambientTemp,
        durationMinutes: Math.max(1, Math.round((expectedEnergy / (chargingPower || 50)) * 60)),
        expectedEnergyKwh: parseFloat(expectedEnergy.toFixed(3)),
        actualEnergyKwh: parseFloat(actualEnergy.toFixed(3)),
        residualKwh: parseFloat(residual.toFixed(3)),
        deviationPercent: parseFloat(deviationPercent.toFixed(2)),
        status,
        explanation,
        telemetryPoints: [],
        dataSource: 'CSV_IMPORT',
      });
    } catch (e: any) {
      warnings.push(`Row ${rowIndex + 2}: Parsing failure - ${e?.message || 'Unknown error'}`);
      rejectedCount++;
    }
  }

  const validRowCount = sessions.length;
  const isValid = validRowCount > 0;

  if (!isValid && errors.length === 0) {
    errors.push('No valid session rows could be parsed from the provided CSV file.');
  }

  return {
    isValid,
    sessions,
    errors,
    warnings,
    totalRowsParsed: rowsToProcess.length,
    validRowCount,
    rejectedRowCount: rejectedCount,
  };
}

