import { ChargingSession, ValidationMetrics, ThresholdSettings } from '../types';

function sanitizeCSVField(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // Neutralize formula trigger characters
  if (['=', '+', '-', '@', '\t', '\r', '%', '|'].includes(str.charAt(0))) {
    str = "'" + str;
  }
  // Escape double quotes by doubling them
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export function exportSessionsToCSV(sessions: ChargingSession[]): string {
  const headers = [
    'timestamp',
    'session_id',
    'ev_id',
    'charger_id',
    'battery_capacity_kwh',
    'initial_soc',
    'target_soc',
    'charging_power_kw',
    'charging_efficiency_pct',
    'ambient_temp_c',
    'duration_minutes',
    'expected_energy_kwh',
    'actual_energy_kwh',
    'residual_kwh',
    'deviation_pct',
    'status',
    'data_source',
  ];

  const rows = sessions.map((s) => [
    sanitizeCSVField(s.timestamp),
    sanitizeCSVField(s.id),
    sanitizeCSVField(s.evId),
    sanitizeCSVField(s.chargerId),
    s.batteryCapacityKwh,
    s.initialSoc,
    s.targetSoc,
    s.chargingPowerKw,
    s.chargingEfficiency,
    s.ambientTemperatureC,
    s.durationMinutes,
    s.expectedEnergyKwh,
    s.actualEnergyKwh,
    s.residualKwh,
    s.deviationPercent,
    sanitizeCSVField(s.status),
    sanitizeCSVField(s.dataSource),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportAnomaliesToJSON(sessions: ChargingSession[], thresholds: ThresholdSettings): string {
  const anomalySessions = sessions.filter((s) => s.status !== 'NORMAL');
  const exportPayload = {
    generatedAt: new Date().toISOString(),
    system: 'VoltTwin Synapse — Physics-Informed EV Charging Anomaly Intelligence',
    developer: 'neonscodeshanks07',
    thresholdConfig: thresholds,
    totalSessionsAudited: sessions.length,
    anomalyCount: anomalySessions.length,
    anomalies: anomalySessions.map((s) => ({
      sessionId: s.id,
      timestamp: s.timestamp,
      chargerId: s.chargerId,
      evId: s.evId,
      expectedEnergyKwh: s.expectedEnergyKwh,
      actualEnergyKwh: s.actualEnergyKwh,
      residualKwh: s.residualKwh,
      deviationPercent: s.deviationPercent,
      classification: s.status,
      forensics: {
        summary: s.explanation.summary,
        possibleCauses: s.explanation.possibleCauses,
        recommendedAction: s.explanation.recommendedAction,
        confidenceScore: s.explanation.confidenceScore,
        estimatedEfficiencyDegradation: s.explanation.estimatedEfficiencyDegradation,
      },
    })),
  };

  return JSON.stringify(exportPayload, null, 2);
}

export function downloadFile(content: string, fileName: string, contentType: string = 'text/plain') {
  try {
    const blob = new Blob([content], { type: `${contentType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    console.error('File download failed:', err);
  }
}

