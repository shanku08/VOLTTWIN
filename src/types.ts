export type AnomalyStatus = 'NORMAL' | 'WARNING' | 'ANOMALY' | 'SUDDEN_SPIKE' | 'PERSISTENT_ANOMALY';

export type AppTab =
  | 'DASHBOARD'
  | 'CHARGER_HEALTH'
  | 'MANUAL_FEED'
  | 'DIGITAL_TWIN'
  | 'ANOMALIES'
  | 'SIMULATION_LAB'
  | 'VALIDATION'
  | 'HISTORY'
  | 'ARDUINO'
  | 'SETTINGS';

export type ChargerHealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'MAINTENANCE';

export interface ChargerErrorCode {
  id: string;
  code: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  timestamp: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  component: 'INVERTER' | 'SHUNT_SENSOR' | 'COOLING' | 'ISOLATION' | 'COMMUNICATION' | 'GRID_STAGE';
  suggestedAction: string;
}

export interface ChargerHealthProfile {
  id: string;
  name: string;
  location: string;
  model: string;
  connectorType: string;
  ratedPowerKw: number;
  maxCurrentA: number;
  firmwareVersion: string;
  installedDate: string;
  status: ChargerHealthStatus;
  healthScore: number; // 0 - 100
  uptimePercent: number; // e.g. 99.4%
  totalOperationalHours: number;
  totalEnergyDeliveredMwh: number;
  totalSessions: number;
  normalSessions: number;
  warningSessions: number;
  anomalySessions: number;
  averageChargingEfficiency: number; // percentage, e.g. 92.4%
  connectorTempC: number;
  internalTempC: number;
  gridVoltageStabilityPercent: number;
  isolationResistanceKohm: number;
  lastMaintenanceDate: string;
  nextScheduledCheck: string;
  errorCodes: ChargerErrorCode[];
  efficiencyTrend: { date: string; efficiency: number; sessionCount: number }[];
}

export interface PhysicalParameters {
  batteryCapacityKwh: number;
  initialSoc: number; // 0 - 100%
  targetSoc: number; // 0 - 100%
  chargingEfficiency: number; // percentage, e.g. 90%
  chargingPowerKw: number; // nominal grid supply power
  ambientTemperatureC?: number; // default 25°C
  chargerId: string;
  evId: string;
  sessionId: string;
}

export interface ThresholdSettings {
  normalDeviationThreshold: number; // e.g. 5.0%
  anomalyDeviationThreshold: number; // e.g. 15.0%
  spikeDeltaThresholdKw: number; // e.g. 8.0 kW sudden delta
  consecutiveAnomalyCountForPersistent: number; // e.g. 3 consecutive sessions
  persistentAnomalyThreshold: number; // e.g. 12%
  // Optional aliases for backward compatibility
  normalMaxDeviation?: number;
  warningMaxDeviation?: number;
  persistentAnomalyWindow?: number;
}

export interface ChargingTelemetryPoint {
  timeSeconds: number;
  soc: number;
  expectedPowerKw: number;
  actualPowerKw: number;
  expectedEnergyKwh: number;
  actualEnergyKwh: number;
  residualKwh: number;
  deviationPercent: number;
  status: AnomalyStatus;
  temperatureC: number;
  voltageV: number;
  currentA: number;
  injectedFault?: string;
}

export interface ChargingSession {
  id: string;
  timestamp: string;
  evId: string;
  chargerId: string;
  batteryCapacityKwh: number;
  initialSoc: number;
  targetSoc: number;
  chargingPowerKw: number;
  chargingEfficiency: number;
  ambientTemperatureC: number;
  durationMinutes: number;
  expectedEnergyKwh: number;
  actualEnergyKwh: number;
  residualKwh: number;
  deviationPercent: number;
  status: AnomalyStatus;
  explanation: ForensicExplanation;
  telemetryPoints: ChargingTelemetryPoint[];
  dataSource: 'SIMULATION' | 'ARDUINO_SERIAL' | 'CSV_IMPORT' | 'MANUAL_ENTRY';
}

export interface ForensicExplanation {
  primaryClassification: AnomalyStatus;
  summary: string;
  deviationStatement: string;
  possibleCauses: string[];
  recommendedAction: string;
  confidenceScore: number;
  estimatedEfficiencyDegradation?: number;
}

export interface ValidationMetrics {
  totalSamples: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  accuracy: number;
  precision: number;
  recall: number;
  specificity: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  averageLatencyMs: number;
}

export interface SyntheticDatasetConfig {
  sampleCount: number;
  noiseLevelPercent: number;
  anomalyRatePercent: number;
  anomalyMagnitudePercent: number;
  spikeProbabilityPercent: number;
  persistentGroupSize: number;
}

export interface AlgorithmComparison {
  name: string;
  type: 'PHYSICS_BASED' | 'ISOLATION_FOREST' | 'Z_SCORE_STATISTICAL' | 'LOCAL_OUTLIER_FACTOR';
  metrics: ValidationMetrics;
  description: string;
  isBaseline: boolean;
}

export interface ArduinoConnectionState {
  isConnected: boolean;
  portName?: string;
  baudRate: number;
  isVirtual: boolean;
  lastMessageTimestamp?: number;
  rxPacketCount: number;
  txPacketCount: number;
  droppedPackets: number;
  rawBuffer: string[];
  statusText: string;
}

export interface SerialTelemetryPacket {
  sessionId: string;
  chargerId: string;
  voltageV: number;
  currentA: number;
  powerKw: number;
  actualEnergyKwh: number;
  ambientTempC: number;
  checksumValid: boolean;
}

export interface UnitTestResult {
  id: string;
  name: string;
  category: 'PHYSICS_MATH' | 'ANOMALY_CLASSIFICATION' | 'SECURITY_SANITIZATION' | 'EDGE_CASES';
  passed: boolean;
  expected: string;
  actual: string;
  executionTimeMs: number;
  errorDetails?: string;
}

export interface ProfessorDemoScenario {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  expectedEnergy: number;
  actualEnergy: number;
  deviation: number;
  status: AnomalyStatus;
  primaryCause: string;
  fullExplanation: ForensicExplanation;
  params: PhysicalParameters;
}
