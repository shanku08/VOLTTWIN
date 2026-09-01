import { ChargerHealthProfile, ChargerHealthStatus, ChargingSession, ChargerErrorCode } from '../types';

export const INITIAL_CHARGER_PROFILES: ChargerHealthProfile[] = [
  {
    id: 'CHG-NORTH-01',
    name: 'North Station Bay 1 (DC Fast)',
    location: 'North Transit Hub - Terminal A',
    model: 'Terra 184 High-Power DC',
    connectorType: 'CCS2 / Dual 350A Liquid-Cooled',
    ratedPowerKw: 180.0,
    maxCurrentA: 350.0,
    firmwareVersion: 'v4.18.2-rt',
    installedDate: '2024-03-15',
    status: 'HEALTHY',
    healthScore: 98,
    uptimePercent: 99.7,
    totalOperationalHours: 8420,
    totalEnergyDeliveredMwh: 342.8,
    totalSessions: 142,
    normalSessions: 139,
    warningSessions: 3,
    anomalySessions: 0,
    averageChargingEfficiency: 92.4,
    connectorTempC: 32.4,
    internalTempC: 38.1,
    gridVoltageStabilityPercent: 99.6,
    isolationResistanceKohm: 5800,
    lastMaintenanceDate: '2026-07-10',
    nextScheduledCheck: '2026-10-15',
    errorCodes: [
      {
        id: 'ERR-N01-01',
        code: 'INFO_FW_UPDATE_SYNC',
        severity: 'INFO',
        title: 'Firmware Telemetry Sync OK',
        description: 'Periodic digital twin synchronization verified at 1 Hz resolution.',
        timestamp: '2026-08-30 06:15:00',
        status: 'RESOLVED',
        component: 'COMMUNICATION',
        suggestedAction: 'No action needed; nominal operation.',
      },
    ],
    efficiencyTrend: [
      { date: '2026-08-25', efficiency: 92.5, sessionCount: 22 },
      { date: '2026-08-26', efficiency: 92.3, sessionCount: 24 },
      { date: '2026-08-27', efficiency: 92.6, sessionCount: 20 },
      { date: '2026-08-28', efficiency: 92.4, sessionCount: 25 },
      { date: '2026-08-29', efficiency: 92.2, sessionCount: 26 },
      { date: '2026-08-30', efficiency: 92.4, sessionCount: 25 },
    ],
  },
  {
    id: 'CHG-SOUTH-04',
    name: 'South Depot Bay 4 (Fleet Fast)',
    location: 'South Metro Logistics Yard',
    model: 'HyperCharger 150 DC Plus',
    connectorType: 'CCS2 / CHAdeMO Dual',
    ratedPowerKw: 150.0,
    maxCurrentA: 300.0,
    firmwareVersion: 'v3.94.1-patch',
    installedDate: '2023-11-20',
    status: 'DEGRADED',
    healthScore: 76,
    uptimePercent: 97.2,
    totalOperationalHours: 11200,
    totalEnergyDeliveredMwh: 489.1,
    totalSessions: 188,
    normalSessions: 152,
    warningSessions: 31,
    anomalySessions: 5,
    averageChargingEfficiency: 89.2,
    connectorTempC: 48.6,
    internalTempC: 54.2,
    gridVoltageStabilityPercent: 96.8,
    isolationResistanceKohm: 1950,
    lastMaintenanceDate: '2026-05-18',
    nextScheduledCheck: '2026-09-05',
    errorCodes: [
      {
        id: 'ERR-S04-01',
        code: 'ERR_THERMAL_DERATE_82',
        severity: 'WARNING',
        title: 'Elevated Ambient Thermal Derating',
        description: 'Ambient temperature exceeding 35°C triggered 10-15% thermal loss and forced secondary cooling fan step-up.',
        timestamp: '2026-08-30 09:45:00',
        status: 'ACTIVE',
        component: 'COOLING',
        suggestedAction: 'Clean intake air filters and check liquid-cooling heat exchanger glycol levels.',
      },
    ],
    efficiencyTrend: [
      { date: '2026-08-25', efficiency: 91.1, sessionCount: 28 },
      { date: '2026-08-26', efficiency: 90.4, sessionCount: 30 },
      { date: '2026-08-27', efficiency: 89.8, sessionCount: 32 },
      { date: '2026-08-28', efficiency: 89.2, sessionCount: 35 },
      { date: '2026-08-29', efficiency: 88.9, sessionCount: 33 },
      { date: '2026-08-30', efficiency: 89.2, sessionCount: 30 },
    ],
  },
  {
    id: 'CHG-EAST-02',
    name: 'East Hub Bay 2 (Commercial DC)',
    location: 'East Distribution Center',
    model: 'VoltCore 120 Commercial DC',
    connectorType: 'CCS2 Single High-Duty',
    ratedPowerKw: 120.0,
    maxCurrentA: 250.0,
    firmwareVersion: 'v2.88.0',
    installedDate: '2023-08-10',
    status: 'CRITICAL',
    healthScore: 52,
    uptimePercent: 94.1,
    totalOperationalHours: 13400,
    totalEnergyDeliveredMwh: 610.5,
    totalSessions: 215,
    normalSessions: 140,
    warningSessions: 38,
    anomalySessions: 37,
    averageChargingEfficiency: 86.4,
    connectorTempC: 52.8,
    internalTempC: 62.4,
    gridVoltageStabilityPercent: 94.2,
    isolationResistanceKohm: 820,
    lastMaintenanceDate: '2026-04-12',
    nextScheduledCheck: '2026-08-31',
    errorCodes: [
      {
        id: 'ERR-E02-01',
        code: 'ERR_SHUNT_CALIBRATION_14',
        severity: 'CRITICAL',
        title: 'Persistent Current Shunt Calibration Drift',
        description: 'Output DC hall sensor reports 20-26% higher power than delivered to battery terminal. Potential shunt calibration skew or power module dielectric leakage.',
        timestamp: '2026-08-30 11:15:00',
        status: 'ACTIVE',
        component: 'SHUNT_SENSOR',
        suggestedAction: 'Immediate field dispatch required: Recalibrate DC current transducer and perform insulation breakdown test.',
      },
      {
        id: 'ERR-E02-02',
        code: 'ERR_PERSISTENT_RESIDUAL_HIGH',
        severity: 'CRITICAL',
        title: 'Consecutive Anomaly Limit Exceeded (>3 Sessions)',
        description: 'Three consecutive sessions generated residual energy discrepancies exceeding 12% tolerance threshold.',
        timestamp: '2026-08-30 14:40:00',
        status: 'ACTIVE',
        component: 'INVERTER',
        suggestedAction: 'Throttle maximum charging power to 50 kW until inverter bridge IGBT modules are tested.',
      },
    ],
    efficiencyTrend: [
      { date: '2026-08-25', efficiency: 89.2, sessionCount: 35 },
      { date: '2026-08-26', efficiency: 88.0, sessionCount: 38 },
      { date: '2026-08-27', efficiency: 87.1, sessionCount: 36 },
      { date: '2026-08-28', efficiency: 86.8, sessionCount: 34 },
      { date: '2026-08-29', efficiency: 86.2, sessionCount: 36 },
      { date: '2026-08-30', efficiency: 86.4, sessionCount: 36 },
    ],
  },
  {
    id: 'CHG-FAST-08',
    name: 'SuperSpur Ultra-Fast Bay 8',
    location: 'Highway 101 Expressway Plaza',
    model: 'GridCharge 350 kW Ultra-Fast',
    connectorType: 'CCS2 / NACS Liquid-Cooled',
    ratedPowerKw: 350.0,
    maxCurrentA: 500.0,
    firmwareVersion: 'v5.02.1-hpc',
    installedDate: '2024-06-01',
    status: 'DEGRADED',
    healthScore: 82,
    uptimePercent: 98.4,
    totalOperationalHours: 4200,
    totalEnergyDeliveredMwh: 290.4,
    totalSessions: 96,
    normalSessions: 81,
    warningSessions: 11,
    anomalySessions: 4,
    averageChargingEfficiency: 91.5,
    connectorTempC: 38.2,
    internalTempC: 45.0,
    gridVoltageStabilityPercent: 97.4,
    isolationResistanceKohm: 4200,
    lastMaintenanceDate: '2026-07-28',
    nextScheduledCheck: '2026-10-30',
    errorCodes: [
      {
        id: 'ERR-F08-01',
        code: 'ERR_GRID_THD_SURGE_91',
        severity: 'WARNING',
        title: 'Transient Step Surge & Grid Harmonics Spike',
        description: 'Detected transient power step jump >18 kW caused by grid auxiliary step switching.',
        timestamp: '2026-08-30 13:00:00',
        status: 'ACKNOWLEDGED',
        component: 'GRID_STAGE',
        suggestedAction: 'Verify active power factor correction (PFC) stage and surge suppressor varistors.',
      },
    ],
    efficiencyTrend: [
      { date: '2026-08-25', efficiency: 93.0, sessionCount: 16 },
      { date: '2026-08-26', efficiency: 92.8, sessionCount: 18 },
      { date: '2026-08-27', efficiency: 92.1, sessionCount: 15 },
      { date: '2026-08-28', efficiency: 91.8, sessionCount: 17 },
      { date: '2026-08-29', efficiency: 91.2, sessionCount: 15 },
      { date: '2026-08-30', efficiency: 91.5, sessionCount: 15 },
    ],
  },
  {
    id: 'CHG-WEST-03',
    name: 'West Commercial Bay 3',
    location: 'Westside Business Park',
    model: 'Terra 124 DC Station',
    connectorType: 'CCS2 Dual',
    ratedPowerKw: 120.0,
    maxCurrentA: 250.0,
    firmwareVersion: 'v4.12.0',
    installedDate: '2024-01-18',
    status: 'HEALTHY',
    healthScore: 97,
    uptimePercent: 99.5,
    totalOperationalHours: 7100,
    totalEnergyDeliveredMwh: 275.0,
    totalSessions: 118,
    normalSessions: 114,
    warningSessions: 4,
    anomalySessions: 0,
    averageChargingEfficiency: 92.8,
    connectorTempC: 30.5,
    internalTempC: 36.2,
    gridVoltageStabilityPercent: 99.4,
    isolationResistanceKohm: 6100,
    lastMaintenanceDate: '2026-06-22',
    nextScheduledCheck: '2026-09-22',
    errorCodes: [],
    efficiencyTrend: [
      { date: '2026-08-25', efficiency: 92.9, sessionCount: 20 },
      { date: '2026-08-26', efficiency: 92.7, sessionCount: 19 },
      { date: '2026-08-27', efficiency: 92.8, sessionCount: 21 },
      { date: '2026-08-28', efficiency: 93.0, sessionCount: 18 },
      { date: '2026-08-29', efficiency: 92.6, sessionCount: 20 },
      { date: '2026-08-30', efficiency: 92.8, sessionCount: 20 },
    ],
  },
  {
    id: 'CHG-HUB-05',
    name: 'Central Hub Bay 5 (Calibration Testing)',
    location: 'Downtown Fleet Maintenance Facility',
    model: 'DynoCharge 100 R&D Unit',
    connectorType: 'CCS2 / Multi-Pin Diagnostic',
    ratedPowerKw: 100.0,
    maxCurrentA: 200.0,
    firmwareVersion: 'v4.20.0-beta',
    installedDate: '2024-04-10',
    status: 'MAINTENANCE',
    healthScore: 84,
    uptimePercent: 96.0,
    totalOperationalHours: 5800,
    totalEnergyDeliveredMwh: 180.2,
    totalSessions: 74,
    normalSessions: 65,
    warningSessions: 7,
    anomalySessions: 2,
    averageChargingEfficiency: 90.1,
    connectorTempC: 28.0,
    internalTempC: 34.5,
    gridVoltageStabilityPercent: 99.1,
    isolationResistanceKohm: 5400,
    lastMaintenanceDate: '2026-08-28',
    nextScheduledCheck: '2026-08-31',
    errorCodes: [
      {
        id: 'ERR-H05-01',
        code: 'MAINT_SELF_TEST_ACTIVE',
        severity: 'INFO',
        title: 'Routine Digital Twin Sensor Baseline Calibration',
        description: 'Unit is under scheduled secondary impedance and current sensor zero-offset calibration.',
        timestamp: '2026-08-29 16:00:00',
        status: 'ACKNOWLEDGED',
        component: 'SHUNT_SENSOR',
        suggestedAction: 'Complete step-response testing before returning unit to active fleet dispatch.',
      },
    ],
    efficiencyTrend: [
      { date: '2026-08-25', efficiency: 90.5, sessionCount: 12 },
      { date: '2026-08-26', efficiency: 90.2, sessionCount: 14 },
      { date: '2026-08-27', efficiency: 89.9, sessionCount: 13 },
      { date: '2026-08-28', efficiency: 90.0, sessionCount: 10 },
      { date: '2026-08-29', efficiency: 90.1, sessionCount: 12 },
      { date: '2026-08-30', efficiency: 90.1, sessionCount: 13 },
    ],
  },
  {
    id: 'CHG-DEPOT-06',
    name: 'Depot Fleet Bay 6',
    location: 'Airport South Logistics Gate',
    model: 'Terra 184 High-Power DC',
    connectorType: 'CCS2 Dual',
    ratedPowerKw: 180.0,
    maxCurrentA: 350.0,
    firmwareVersion: 'v4.18.2-rt',
    installedDate: '2024-05-12',
    status: 'HEALTHY',
    healthScore: 99,
    uptimePercent: 99.8,
    totalOperationalHours: 3900,
    totalEnergyDeliveredMwh: 210.6,
    totalSessions: 94,
    normalSessions: 93,
    warningSessions: 1,
    anomalySessions: 0,
    averageChargingEfficiency: 93.2,
    connectorTempC: 29.8,
    internalTempC: 35.0,
    gridVoltageStabilityPercent: 99.8,
    isolationResistanceKohm: 6400,
    lastMaintenanceDate: '2026-07-02',
    nextScheduledCheck: '2026-10-02',
    errorCodes: [],
    efficiencyTrend: [
      { date: '2026-08-25', efficiency: 93.3, sessionCount: 15 },
      { date: '2026-08-26', efficiency: 93.1, sessionCount: 16 },
      { date: '2026-08-27', efficiency: 93.4, sessionCount: 14 },
      { date: '2026-08-28', efficiency: 93.2, sessionCount: 17 },
      { date: '2026-08-29', efficiency: 93.0, sessionCount: 16 },
      { date: '2026-08-30', efficiency: 93.2, sessionCount: 16 },
    ],
  },
];

/**
 * Dynamically updates charger metrics from active session history and threshold criteria
 */
export function recalculateChargerProfiles(
  sessions: ChargingSession[],
  currentProfiles: ChargerHealthProfile[] = INITIAL_CHARGER_PROFILES
): ChargerHealthProfile[] {
  return currentProfiles.map((profile) => {
    const chargerSessions = sessions.filter((s) => s.chargerId === profile.id);
    if (chargerSessions.length === 0) return profile;

    const normalCount = chargerSessions.filter((s) => s.status === 'NORMAL').length;
    const warningCount = chargerSessions.filter((s) => s.status === 'WARNING').length;
    const anomalyCount = chargerSessions.filter(
      (s) => s.status === 'ANOMALY' || s.status === 'PERSISTENT_ANOMALY' || s.status === 'SUDDEN_SPIKE'
    ).length;

    const avgEff =
      chargerSessions.reduce((acc, s) => {
        const realizedEff = (s.expectedEnergyKwh * (s.chargingEfficiency / 100)) / (s.actualEnergyKwh || 1) * 100;
        return acc + Math.min(100, Math.max(70, realizedEff));
      }, 0) / chargerSessions.length;

    // Health Score calculation (0 - 100)
    let score = 100;
    const anomalyRatio = anomalyCount / chargerSessions.length;
    const warningRatio = warningCount / chargerSessions.length;

    score -= anomalyRatio * 60;
    score -= warningRatio * 25;
    if (avgEff < 90) score -= (90 - avgEff) * 2.5;

    const activeCriticalErrors = profile.errorCodes.filter(
      (e) => e.status === 'ACTIVE' && e.severity === 'CRITICAL'
    ).length;
    const activeWarningErrors = profile.errorCodes.filter(
      (e) => e.status === 'ACTIVE' && e.severity === 'WARNING'
    ).length;

    score -= activeCriticalErrors * 20;
    score -= activeWarningErrors * 8;

    score = Math.max(25, Math.min(100, Math.round(score)));

    // Predefined health status criteria
    let status: ChargerHealthStatus = 'HEALTHY';
    if (profile.status === 'MAINTENANCE') {
      status = 'MAINTENANCE';
    } else if (score < 65 || activeCriticalErrors > 0 || anomalyRatio > 0.15) {
      status = 'CRITICAL';
    } else if (score < 85 || activeWarningErrors > 0 || warningRatio > 0.15 || avgEff < 90) {
      status = 'DEGRADED';
    }

    return {
      ...profile,
      status,
      healthScore: score,
      totalSessions: profile.totalSessions + chargerSessions.length,
      normalSessions: profile.normalSessions + normalCount,
      warningSessions: profile.warningSessions + warningCount,
      anomalySessions: profile.anomalySessions + anomalyCount,
      averageChargingEfficiency: Number(avgEff.toFixed(1)),
    };
  });
}
