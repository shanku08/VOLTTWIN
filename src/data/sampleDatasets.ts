import { ChargingSession } from '../types';
import { generateSessionTelemetry } from '../core/digitalTwin';
import { generateForensicExplanation } from '../core/anomalyDetection';

export function getInitialSampleSessions(): ChargingSession[] {
  const sessions: ChargingSession[] = [
    // 1. Normal High-Efficiency Session
    {
      id: 'SESS-2026-0801',
      timestamp: '2026-08-30 08:30:00',
      evId: 'EV-TESLA-M3-441',
      chargerId: 'CHG-NORTH-01',
      batteryCapacityKwh: 60.0,
      initialSoc: 20.0,
      targetSoc: 80.0,
      chargingPowerKw: 50.0,
      chargingEfficiency: 92.0,
      ambientTemperatureC: 22.0,
      durationMinutes: 47,
      expectedEnergyKwh: 39.13,
      actualEnergyKwh: 39.75,
      residualKwh: 0.62,
      deviationPercent: 1.58,
      status: 'NORMAL',
      explanation: generateForensicExplanation(39.13, 39.75, 1.58, 'NORMAL', 60.0, 20.0, 80.0, 22.0),
      telemetryPoints: generateSessionTelemetry(
        {
          batteryCapacityKwh: 60.0,
          initialSoc: 20.0,
          targetSoc: 80.0,
          chargingEfficiency: 92.0,
          chargingPowerKw: 50.0,
          ambientTemperatureC: 22.0,
          chargerId: 'CHG-NORTH-01',
          evId: 'EV-TESLA-M3-441',
          sessionId: 'SESS-2026-0801',
        },
        'NONE',
        18
      ),
      dataSource: 'SIMULATION',
    },

    // 2. Warning Level Session (Elevated Ambient Thermal Dissipation)
    {
      id: 'SESS-2026-0802',
      timestamp: '2026-08-30 09:45:00',
      evId: 'EV-HYUNDAI-I5-108',
      chargerId: 'CHG-SOUTH-04',
      batteryCapacityKwh: 77.4,
      initialSoc: 15.0,
      targetSoc: 85.0,
      chargingPowerKw: 100.0,
      chargingEfficiency: 90.0,
      ambientTemperatureC: 36.5,
      durationMinutes: 42,
      expectedEnergyKwh: 60.20,
      actualEnergyKwh: 66.82,
      residualKwh: 6.62,
      deviationPercent: 10.99,
      status: 'WARNING',
      explanation: generateForensicExplanation(60.20, 66.82, 10.99, 'WARNING', 77.4, 15.0, 85.0, 36.5),
      telemetryPoints: generateSessionTelemetry(
        {
          batteryCapacityKwh: 77.4,
          initialSoc: 15.0,
          targetSoc: 85.0,
          chargingEfficiency: 90.0,
          chargingPowerKw: 100.0,
          ambientTemperatureC: 36.5,
          chargerId: 'CHG-SOUTH-04',
          evId: 'EV-HYUNDAI-I5-108',
          sessionId: 'SESS-2026-0802',
        },
        'WARNING_LOSS',
        18
      ),
      dataSource: 'SIMULATION',
    },

    // 3. Significant Anomaly Session (Power Inverter Degradation / Cable Loss)
    {
      id: 'SESS-2026-0803',
      timestamp: '2026-08-30 11:15:00',
      evId: 'EV-NISSAN-LEAF-092',
      chargerId: 'CHG-EAST-02',
      batteryCapacityKwh: 40.0,
      initialSoc: 25.0,
      targetSoc: 75.0,
      chargingPowerKw: 22.0,
      chargingEfficiency: 88.0,
      ambientTemperatureC: 24.0,
      durationMinutes: 62,
      expectedEnergyKwh: 22.73,
      actualEnergyKwh: 28.63,
      residualKwh: 5.90,
      deviationPercent: 25.95,
      status: 'ANOMALY',
      explanation: generateForensicExplanation(22.73, 28.63, 25.95, 'ANOMALY', 40.0, 25.0, 75.0, 24.0),
      telemetryPoints: generateSessionTelemetry(
        {
          batteryCapacityKwh: 40.0,
          initialSoc: 25.0,
          targetSoc: 75.0,
          chargingEfficiency: 88.0,
          chargingPowerKw: 22.0,
          ambientTemperatureC: 24.0,
          chargerId: 'CHG-EAST-02',
          evId: 'EV-NISSAN-LEAF-092',
          sessionId: 'SESS-2026-0803',
        },
        'ANOMALY_LEAKAGE',
        18
      ),
      dataSource: 'SIMULATION',
    },

    // 4. Sudden Spike Session (Transient Auxiliary Load or Sensor Glitch)
    {
      id: 'SESS-2026-0804',
      timestamp: '2026-08-30 13:00:00',
      evId: 'EV-PORSCHE-TY-770',
      chargerId: 'CHG-FAST-08',
      batteryCapacityKwh: 93.4,
      initialSoc: 10.0,
      targetSoc: 80.0,
      chargingPowerKw: 150.0,
      chargingEfficiency: 93.0,
      ambientTemperatureC: 25.0,
      durationMinutes: 31,
      expectedEnergyKwh: 70.30,
      actualEnergyKwh: 83.65,
      residualKwh: 13.35,
      deviationPercent: 18.99,
      status: 'SUDDEN_SPIKE',
      explanation: generateForensicExplanation(70.30, 83.65, 18.99, 'SUDDEN_SPIKE', 93.4, 10.0, 80.0, 25.0, false, true),
      telemetryPoints: generateSessionTelemetry(
        {
          batteryCapacityKwh: 93.4,
          initialSoc: 10.0,
          targetSoc: 80.0,
          chargingEfficiency: 93.0,
          chargingPowerKw: 150.0,
          ambientTemperatureC: 25.0,
          chargerId: 'CHG-FAST-08',
          evId: 'EV-PORSCHE-TY-770',
          sessionId: 'SESS-2026-0804',
        },
        'SUDDEN_SPIKE',
        18
      ),
      dataSource: 'SIMULATION',
    },

    // 5. Persistent Anomaly Session (Repeated Charger Fault)
    {
      id: 'SESS-2026-0805',
      timestamp: '2026-08-30 14:40:00',
      evId: 'EV-BMW-I4-302',
      chargerId: 'CHG-EAST-02',
      batteryCapacityKwh: 80.7,
      initialSoc: 20.0,
      targetSoc: 80.0,
      chargingPowerKw: 50.0,
      chargingEfficiency: 88.0,
      ambientTemperatureC: 27.0,
      durationMinutes: 65,
      expectedEnergyKwh: 55.02,
      actualEnergyKwh: 67.12,
      residualKwh: 12.10,
      deviationPercent: 21.99,
      status: 'PERSISTENT_ANOMALY',
      explanation: generateForensicExplanation(55.02, 67.12, 21.99, 'PERSISTENT_ANOMALY', 80.7, 20.0, 80.0, 27.0, true),
      telemetryPoints: generateSessionTelemetry(
        {
          batteryCapacityKwh: 80.7,
          initialSoc: 20.0,
          targetSoc: 80.0,
          chargingEfficiency: 88.0,
          chargingPowerKw: 50.0,
          ambientTemperatureC: 27.0,
          chargerId: 'CHG-EAST-02',
          evId: 'EV-BMW-I4-302',
          sessionId: 'SESS-2026-0805',
        },
        'PERSISTENT',
        18
      ),
      dataSource: 'SIMULATION',
    },

    // 6. Normal Fleet Session
    {
      id: 'SESS-2026-0806',
      timestamp: '2026-08-30 16:10:00',
      evId: 'EV-VW-ID4-554',
      chargerId: 'CHG-NORTH-02',
      batteryCapacityKwh: 77.0,
      initialSoc: 30.0,
      targetSoc: 80.0,
      chargingPowerKw: 50.0,
      chargingEfficiency: 91.5,
      ambientTemperatureC: 21.0,
      durationMinutes: 49,
      expectedEnergyKwh: 42.08,
      actualEnergyKwh: 43.10,
      residualKwh: 1.02,
      deviationPercent: 2.42,
      status: 'NORMAL',
      explanation: generateForensicExplanation(42.08, 43.10, 2.42, 'NORMAL', 77.0, 30.0, 80.0, 21.0),
      telemetryPoints: generateSessionTelemetry(
        {
          batteryCapacityKwh: 77.0,
          initialSoc: 30.0,
          targetSoc: 80.0,
          chargingEfficiency: 91.5,
          chargingPowerKw: 50.0,
          ambientTemperatureC: 21.0,
          chargerId: 'CHG-NORTH-02',
          evId: 'EV-VW-ID4-554',
          sessionId: 'SESS-2026-0806',
        },
        'NONE',
        18
      ),
      dataSource: 'SIMULATION',
    },
  ];

  return sessions;
}

export const SAMPLE_CHARGING_SESSIONS: ChargingSession[] = getInitialSampleSessions();

export function generateTelemetryPointsForSession(
  sessionId: string,
  batteryCapacityKwh: number,
  initialSoc: number,
  targetSoc: number,
  chargingPowerKw: number,
  chargingEfficiency: number,
  status: string
) {
  let faultType: 'NONE' | 'WARNING_LOSS' | 'ANOMALY_LEAKAGE' | 'SUDDEN_SPIKE' | 'CV_FAULT' | 'PERSISTENT' = 'NONE';
  if (status === 'WARNING') faultType = 'WARNING_LOSS';
  else if (status === 'ANOMALY') faultType = 'ANOMALY_LEAKAGE';
  else if (status === 'SUDDEN_SPIKE') faultType = 'SUDDEN_SPIKE';
  else if (status === 'PERSISTENT_ANOMALY') faultType = 'PERSISTENT';

  return generateSessionTelemetry(
    {
      batteryCapacityKwh,
      initialSoc,
      targetSoc,
      chargingEfficiency,
      chargingPowerKw,
      ambientTemperatureC: 25,
      chargerId: 'CHG-NODE-01',
      evId: 'EV-FLEET-AUTO',
      sessionId,
    },
    faultType,
    18
  );
}
