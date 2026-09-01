import React, { useState, useEffect } from 'react';
import {
  ChargingSession,
  PhysicalParameters,
  ThresholdSettings,
  ChargerHealthProfile,
  ChargingTelemetryPoint,
  ChargerErrorCode,
} from '../types';
import {
  calculateBatteryEnergy,
  calculateExpectedGridEnergy,
  calculateEnergyResidual,
  calculateDeviationPercent,
  estimateRealizedEfficiency,
  generateSessionTelemetry,
} from '../core/digitalTwin';
import {
  classifyDeviation,
  generateForensicExplanation,
} from '../core/anomalyDetection';
import { validateAndParseCSV } from '../core/security';
import {
  PlusCircle,
  Database,
  Radio,
  FileSpreadsheet,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sparkles,
  Send,
  Trash2,
  Plus,
  Play,
  Layers,
} from 'lucide-react';

interface ManualDataFeedTabProps {
  sessions: ChargingSession[];
  onAddSessions: (newSessions: ChargingSession[]) => void;
  activeSession: ChargingSession;
  onSelectSession: (session: ChargingSession) => void;
  currentTelemetry: ChargingTelemetryPoint[];
  onUpdateActiveTelemetry?: (points: ChargingTelemetryPoint[]) => void;
  thresholds: ThresholdSettings;
  chargerProfiles: ChargerHealthProfile[];
  onUpdateChargerProfiles: (profiles: ChargerHealthProfile[]) => void;
  onNavigateTab: (tab: any) => void;
}

export const ManualDataFeedTab: React.FC<ManualDataFeedTabProps> = ({
  sessions: _sessions,
  onAddSessions,
  activeSession,
  onSelectSession,
  currentTelemetry,
  onUpdateActiveTelemetry,
  thresholds,
  chargerProfiles,
  onUpdateChargerProfiles,
  onNavigateTab,
}) => {
  const [feedMode, setFeedMode] = useState<'SESSION' | 'LIVE_STREAM' | 'BATCH_PASTE' | 'HARDWARE'>('SESSION');

  // ==========================================
  // 1. MANUAL SESSION FEEDER STATE
  // ==========================================
  const [sessionId, setSessionId] = useState<string>(`SESS-MAN-${Date.now().toString().slice(-4)}`);
  const [chargerId, setChargerId] = useState<string>(chargerProfiles[0]?.id || 'CHG-NORTH-01');
  const [customChargerId, setCustomChargerId] = useState<string>('');
  const [evId, setEvId] = useState<string>('EV-CUSTOM-901');
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState<number>(75.0);
  const [initialSoc, setInitialSoc] = useState<number>(20.0);
  const [targetSoc, setTargetSoc] = useState<number>(80.0);
  const [chargingEfficiency, setChargingEfficiency] = useState<number>(91.0);
  const [chargingPowerKw, setChargingPowerKw] = useState<number>(120.0);
  const [ambientTemperatureC, setAmbientTemperatureC] = useState<number>(25.0);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [actualEnergyKwh, setActualEnergyKwh] = useState<number>(53.8);
  const [customPointsCount, setCustomPointsCount] = useState<number>(24);
  const [customTelemetryCurve, setCustomTelemetryCurve] = useState<ChargingTelemetryPoint[]>([]);
  const [enableManualPointsEditor, setEnableManualPointsEditor] = useState<boolean>(false);
  const [feedSuccessMessage, setFeedSuccessMessage] = useState<string | null>(null);

  // Live calculations for Manual Session Builder
  const batteryEnergyKwh = calculateBatteryEnergy(batteryCapacityKwh, initialSoc, targetSoc);
  const expectedEnergyKwh = calculateExpectedGridEnergy(batteryEnergyKwh, chargingEfficiency);
  const residualKwh = calculateEnergyResidual(actualEnergyKwh, expectedEnergyKwh);
  const deviationPercent = calculateDeviationPercent(actualEnergyKwh, expectedEnergyKwh);
  const realizedEfficiency = estimateRealizedEfficiency(batteryEnergyKwh, actualEnergyKwh);
  const calculatedStatus = classifyDeviation(deviationPercent, thresholds);

  // Generate initial custom curve when params change
  useEffect(() => {
    const params: PhysicalParameters = {
      batteryCapacityKwh,
      initialSoc,
      targetSoc,
      chargingEfficiency,
      chargingPowerKw,
      ambientTemperatureC,
      chargerId: chargerId === 'CUSTOM' ? customChargerId : chargerId,
      evId,
      sessionId,
    };
    const pts = generateSessionTelemetry(
      params,
      deviationPercent > 15 ? 'ANOMALY_LEAKAGE' : deviationPercent > 5 ? 'WARNING_LOSS' : 'NONE',
      customPointsCount
    );
    setCustomTelemetryCurve(pts);
  }, [
    batteryCapacityKwh,
    initialSoc,
    targetSoc,
    chargingEfficiency,
    chargingPowerKw,
    ambientTemperatureC,
    actualEnergyKwh,
    customPointsCount,
    deviationPercent,
    chargerId,
    customChargerId,
    evId,
    sessionId,
  ]);

  // Quick Presets for Manual Session Builder
  const applyPreset = (type: 'HEALTHY' | 'INVERTER_LOSS' | 'SHUNT_LEAK' | 'COLD_WEATHER' | 'FAST_SPLIT') => {
    switch (type) {
      case 'HEALTHY':
        setEvId('EV-TESLA-M3-441');
        setBatteryCapacityKwh(75.0);
        setInitialSoc(15.0);
        setTargetSoc(80.0);
        setChargingEfficiency(92.0);
        setChargingPowerKw(150.0);
        setAmbientTemperatureC(24.0);
        setDurationMinutes(35);
        setActualEnergyKwh(53.2);
        break;
      case 'INVERTER_LOSS':
        setEvId('EV-IONIQ5-780');
        setBatteryCapacityKwh(77.4);
        setInitialSoc(20.0);
        setTargetSoc(85.0);
        setChargingEfficiency(90.0);
        setChargingPowerKw(120.0);
        setAmbientTemperatureC(38.0);
        setDurationMinutes(50);
        setActualEnergyKwh(62.8);
        break;
      case 'SHUNT_LEAK':
        setEvId('EV-TAYCAN-882');
        setBatteryCapacityKwh(93.4);
        setInitialSoc(10.0);
        setTargetSoc(80.0);
        setChargingEfficiency(91.0);
        setChargingPowerKw(200.0);
        setAmbientTemperatureC(25.0);
        setDurationMinutes(40);
        setActualEnergyKwh(88.5);
        break;
      case 'COLD_WEATHER':
        setEvId('EV-ID4-119');
        setBatteryCapacityKwh(82.0);
        setInitialSoc(10.0);
        setTargetSoc(80.0);
        setChargingEfficiency(88.0);
        setChargingPowerKw(80.0);
        setAmbientTemperatureC(-4.0);
        setDurationMinutes(65);
        setActualEnergyKwh(73.5);
        break;
      case 'FAST_SPLIT':
        setEvId('EV-LUCID-501');
        setBatteryCapacityKwh(112.0);
        setInitialSoc(30.0);
        setTargetSoc(70.0);
        setChargingEfficiency(93.0);
        setChargingPowerKw(250.0);
        setAmbientTemperatureC(22.0);
        setDurationMinutes(22);
        setActualEnergyKwh(50.4);
        break;
    }
  };

  const handleSaveManualSession = () => {
    const finalChargerId = chargerId === 'CUSTOM' ? customChargerId.trim() || 'CHG-CUSTOM-01' : chargerId;
    const finalParams: PhysicalParameters = {
      batteryCapacityKwh,
      initialSoc,
      targetSoc,
      chargingEfficiency,
      chargingPowerKw,
      ambientTemperatureC,
      chargerId: finalChargerId,
      evId: evId.trim() || 'EV-MANUAL-01',
      sessionId: sessionId.trim() || `SESS-MAN-${Date.now()}`,
    };

    const exp = generateForensicExplanation(
      expectedEnergyKwh,
      actualEnergyKwh,
      deviationPercent,
      calculatedStatus,
      batteryCapacityKwh,
      initialSoc,
      targetSoc,
      ambientTemperatureC
    );

    const points =
      customTelemetryCurve.length > 0
        ? customTelemetryCurve
        : generateSessionTelemetry(
            finalParams,
            deviationPercent > 15 ? 'ANOMALY_LEAKAGE' : deviationPercent > 5 ? 'WARNING_LOSS' : 'NONE',
            24
          );

    const newSession: ChargingSession = {
      id: finalParams.sessionId,
      timestamp: new Date().toISOString(),
      evId: finalParams.evId,
      chargerId: finalParams.chargerId,
      batteryCapacityKwh,
      initialSoc,
      targetSoc,
      chargingPowerKw,
      chargingEfficiency,
      ambientTemperatureC,
      durationMinutes,
      expectedEnergyKwh: parseFloat(expectedEnergyKwh.toFixed(2)),
      actualEnergyKwh: parseFloat(actualEnergyKwh.toFixed(2)),
      residualKwh: parseFloat(residualKwh.toFixed(2)),
      deviationPercent: parseFloat(deviationPercent.toFixed(2)),
      status: calculatedStatus,
      explanation: exp,
      telemetryPoints: points,
      dataSource: 'MANUAL_ENTRY',
    };

    onAddSessions([newSession]);
    onSelectSession(newSession);
    setFeedSuccessMessage(`Successfully fed and registered session ${newSession.id} into fleet database!`);
    setSessionId(`SESS-MAN-${Date.now().toString().slice(-4)}`);
  };

  // ==========================================
  // 2. LIVE POINT-BY-POINT TELEMETRY FEEDER
  // ==========================================
  const [liveVoltage, setLiveVoltage] = useState<number>(398.5);
  const [liveCurrent, setLiveCurrent] = useState<number>(148.0);
  const [liveSoc, setLiveSoc] = useState<number>(45.0);
  const [liveTemp, setLiveTemp] = useState<number>(31.2);
  const [liveFaultTag, setLiveFaultTag] = useState<string>('NONE');

  const handlePushSingleTelemetryPoint = () => {
    if (!onUpdateActiveTelemetry) return;
    const existing = [...currentTelemetry];
    const lastPoint = existing[existing.length - 1] || {
      timeSeconds: 0,
      actualEnergyKwh: 0,
      expectedEnergyKwh: 0,
    };

    const newTime = lastPoint.timeSeconds + 60;
    const actualPower = (liveVoltage * liveCurrent) / 1000;
    const energyDeltaKwh = (actualPower * (60 / 3600));
    const newActualEnergy = lastPoint.actualEnergyKwh + energyDeltaKwh;

    const expectedPower = activeSession.chargingPowerKw;
    const expectedEnergyDelta = (expectedPower * (60 / 3600));
    const newExpectedEnergy = lastPoint.expectedEnergyKwh + expectedEnergyDelta;

    const newResidual = newActualEnergy - newExpectedEnergy;
    const newDev = calculateDeviationPercent(newActualEnergy, newExpectedEnergy);
    const newStatus = classifyDeviation(newDev, thresholds);

    const newPoint: ChargingTelemetryPoint = {
      timeSeconds: newTime,
      soc: Math.min(100, liveSoc),
      expectedPowerKw: parseFloat(expectedPower.toFixed(2)),
      actualPowerKw: parseFloat(actualPower.toFixed(2)),
      expectedEnergyKwh: parseFloat(newExpectedEnergy.toFixed(3)),
      actualEnergyKwh: parseFloat(newActualEnergy.toFixed(3)),
      residualKwh: parseFloat(newResidual.toFixed(3)),
      deviationPercent: parseFloat(newDev.toFixed(2)),
      status: newStatus,
      temperatureC: liveTemp,
      voltageV: liveVoltage,
      currentA: liveCurrent,
      injectedFault: liveFaultTag !== 'NONE' ? liveFaultTag : undefined,
    };

    const updated = [...existing, newPoint];
    onUpdateActiveTelemetry(updated);
    setLiveSoc((prev) => Math.min(100, parseFloat((prev + 1.2).toFixed(1))));
    setLiveTemp((prev) => parseFloat((prev + (Math.random() * 0.4 - 0.1)).toFixed(1)));
  };

  const handleSimulateFiveSteps = () => {
    if (!onUpdateActiveTelemetry) return;
    let curr = [...currentTelemetry];
    for (let i = 0; i < 5; i++) {
      const last = curr[curr.length - 1] || { timeSeconds: 0, actualEnergyKwh: 0, expectedEnergyKwh: 0 };
      const newTime = last.timeSeconds + 60;
      const actualPower = (liveVoltage * (liveCurrent + (Math.random() * 4 - 2))) / 1000;
      const energyDelta = (actualPower * (60 / 3600));
      const expPower = activeSession.chargingPowerKw;
      const expDelta = (expPower * (60 / 3600));

      const actTot = last.actualEnergyKwh + energyDelta;
      const expTot = last.expectedEnergyKwh + expDelta;
      const dev = calculateDeviationPercent(actTot, expTot);

      curr.push({
        timeSeconds: newTime,
        soc: Math.min(100, liveSoc + i * 1.5),
        expectedPowerKw: expPower,
        actualPowerKw: actualPower,
        expectedEnergyKwh: expTot,
        actualEnergyKwh: actTot,
        residualKwh: actTot - expTot,
        deviationPercent: dev,
        status: classifyDeviation(dev, thresholds),
        temperatureC: liveTemp + i * 0.3,
        voltageV: liveVoltage + (Math.random() * 2 - 1),
        currentA: liveCurrent + (Math.random() * 4 - 2),
      });
    }
    onUpdateActiveTelemetry(curr);
    setLiveSoc((prev) => Math.min(100, prev + 7.5));
  };

  // ==========================================
  // 3. RAW BATCH PASTE (CSV / JSON)
  // ==========================================
  const [pasteContent, setPasteContent] = useState<string>('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState<string | null>(null);

  const sampleCsvSnippet = `timestamp,session_id,charger_id,ev_id,battery_capacity_kwh,initial_soc,target_soc,charging_power_kw,charging_efficiency,actual_energy_kwh,ambient_temp_c
2026-08-30T21:00:00Z,SESS-RAW-001,CHG-NORTH-01,EV-TESLA-99,75.0,20.0,80.0,150.0,92.0,50.1,24.0
2026-08-30T21:40:00Z,SESS-RAW-002,CHG-EAST-02,EV-BMW-I4,83.9,15.0,85.0,100.0,90.0,73.5,26.0
2026-08-30T22:15:00Z,SESS-RAW-003,CHG-SOUTH-01,EV-RIVIAN-R1T,135.0,10.0,70.0,180.0,89.0,104.2,28.5`;

  const sampleJsonSnippet = `[
  {
    "id": "SESS-JSON-001",
    "timestamp": "2026-08-30T22:30:00Z",
    "chargerId": "CHG-WEST-01",
    "evId": "EV-LUCID-AIR",
    "batteryCapacityKwh": 112.0,
    "initialSoc": 20.0,
    "targetSoc": 80.0,
    "chargingEfficiency": 92.0,
    "chargingPowerKw": 200.0,
    "ambientTemperatureC": 25.0,
    "durationMinutes": 32,
    "actualEnergyKwh": 76.5
  }
]`;

  const handleIngestPastedData = () => {
    setPasteError(null);
    setPasteSuccess(null);
    const text = pasteContent.trim();
    if (!text) {
      setPasteError('Please paste CSV text or JSON data into the box.');
      return;
    }

    if (text.startsWith('[') || text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text);
        const arrayData = Array.isArray(parsed) ? parsed : [parsed];
        const newSessions: ChargingSession[] = [];

        for (const item of arrayData) {
          const cap = Number(item.batteryCapacityKwh) || 75;
          const iSoc = Number(item.initialSoc) || 20;
          const tSoc = Number(item.targetSoc) || 80;
          const eff = Number(item.chargingEfficiency) || 90;
          const pwr = Number(item.chargingPowerKw) || 100;
          const act = Number(item.actualEnergyKwh) || 50;
          const temp = Number(item.ambientTemperatureC) || 25;
          const dur = Number(item.durationMinutes) || 45;

          const bEnergy = calculateBatteryEnergy(cap, iSoc, tSoc);
          const expEnergy = calculateExpectedGridEnergy(bEnergy, eff);
          const res = calculateEnergyResidual(act, expEnergy);
          const dev = calculateDeviationPercent(act, expEnergy);
          const st = classifyDeviation(dev, thresholds);

          const params: PhysicalParameters = {
            batteryCapacityKwh: cap,
            initialSoc: iSoc,
            targetSoc: tSoc,
            chargingEfficiency: eff,
            chargingPowerKw: pwr,
            ambientTemperatureC: temp,
            chargerId: item.chargerId || 'CHG-NORTH-01',
            evId: item.evId || 'EV-MANUAL-JSON',
            sessionId: item.id || `SESS-JSON-${Date.now()}`,
          };

          const s: ChargingSession = {
            id: params.sessionId,
            timestamp: item.timestamp || new Date().toISOString(),
            evId: params.evId,
            chargerId: params.chargerId,
            batteryCapacityKwh: cap,
            initialSoc: iSoc,
            targetSoc: tSoc,
            chargingPowerKw: pwr,
            chargingEfficiency: eff,
            ambientTemperatureC: temp,
            durationMinutes: dur,
            expectedEnergyKwh: parseFloat(expEnergy.toFixed(2)),
            actualEnergyKwh: parseFloat(act.toFixed(2)),
            residualKwh: parseFloat(res.toFixed(2)),
            deviationPercent: parseFloat(dev.toFixed(2)),
            status: st,
            explanation: generateForensicExplanation(
              expEnergy,
              act,
              dev,
              st,
              cap,
              iSoc,
              tSoc,
              temp
            ),
            telemetryPoints: generateSessionTelemetry(params, dev > 15 ? 'ANOMALY_LEAKAGE' : 'NONE', 24),
            dataSource: 'MANUAL_ENTRY',
          };
          newSessions.push(s);
        }

        if (newSessions.length > 0) {
          onAddSessions(newSessions);
          onSelectSession(newSessions[0]);
          setPasteSuccess(`Successfully ingested ${newSessions.length} sessions from JSON!`);
          setPasteContent('');
        }
      } catch (err: any) {
        setPasteError(`Invalid JSON syntax: ${err.message}`);
      }
    } else {
      const result = validateAndParseCSV(text);
      if (!result.isValid) {
        setPasteError(`CSV Validation Error: ${result.errors.join(', ')}`);
      } else if (result.sessions.length === 0) {
        setPasteError('No valid session rows found in CSV.');
      } else {
        const marked = result.sessions.map((s) => ({ ...s, dataSource: 'MANUAL_ENTRY' as const }));
        onAddSessions(marked);
        onSelectSession(marked[0]);
        setPasteSuccess(`Successfully parsed and ingested ${marked.length} sessions from CSV!`);
        setPasteContent('');
      }
    }
  };

  // ==========================================
  // 4. CHARGER REGISTRY & ERROR CODE FEEDER
  // ==========================================
  const [newChargerId, setNewChargerId] = useState<string>('CHG-METRO-09');
  const [newChargerName, setNewChargerName] = useState<string>('Metro Supercharger Terminal 9');
  const [newChargerLocation, setNewChargerLocation] = useState<string>('Downtown EV Hub, Level 2');
  const [newChargerPower, setNewChargerPower] = useState<number>(150);
  const [newChargerConnector, setNewChargerConnector] = useState<string>('CCS Combo 2 / NACS');
  const [chargerRegSuccess, setChargerRegSuccess] = useState<string | null>(null);

  const [errTargetChargerId, setErrTargetChargerId] = useState<string>(chargerProfiles[0]?.id || 'CHG-NORTH-01');
  const [errCode, setErrCode] = useState<string>('ERR-ISO-502');
  const [errTitle, setErrTitle] = useState<string>('Isolation Resistance Degradation (<500kΩ)');
  const [errSeverity, setErrSeverity] = useState<'CRITICAL' | 'WARNING' | 'INFO'>('CRITICAL');
  const [errComponent, setErrComponent] = useState<'INVERTER' | 'SHUNT_SENSOR' | 'COOLING' | 'ISOLATION' | 'COMMUNICATION' | 'GRID_STAGE'>('ISOLATION');
  const [errDesc, setErrDesc] = useState<string>('Ground leakage current exceeds 3.5mA on high-voltage contactor stage.');
  const [errAction, setErrAction] = useState<string>('Dispatch field engineer to inspect high-voltage cable insulation & grounding.');

  const handleRegisterNewCharger = () => {
    const existing = chargerProfiles.find((c) => c.id === newChargerId.trim());
    if (existing) {
      alert(`Charger ID ${newChargerId} already exists!`);
      return;
    }

    const newProfile: ChargerHealthProfile = {
      id: newChargerId.trim(),
      name: newChargerName.trim(),
      location: newChargerLocation.trim(),
      model: 'ABB Terra HP 175 Gen-3',
      connectorType: newChargerConnector,
      ratedPowerKw: newChargerPower,
      maxCurrentA: Math.round((newChargerPower * 1000) / 400),
      firmwareVersion: 'v4.2.1-PROD',
      installedDate: new Date().toISOString().split('T')[0],
      status: 'HEALTHY',
      healthScore: 98,
      uptimePercent: 99.8,
      totalOperationalHours: 24,
      totalEnergyDeliveredMwh: 0.8,
      totalSessions: 0,
      normalSessions: 0,
      warningSessions: 0,
      anomalySessions: 0,
      averageChargingEfficiency: 92.5,
      connectorTempC: 22.0,
      internalTempC: 28.0,
      gridVoltageStabilityPercent: 99.5,
      isolationResistanceKohm: 1200,
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      nextScheduledCheck: '2026-11-30',
      errorCodes: [],
      efficiencyTrend: [
        { date: '2026-08-25', efficiency: 92.5, sessionCount: 1 },
        { date: '2026-08-30', efficiency: 92.5, sessionCount: 1 },
      ],
    };

    onUpdateChargerProfiles([...chargerProfiles, newProfile]);
    setChargerRegSuccess(`Registered new physical charging station ${newProfile.id} into fleet inventory!`);
    setNewChargerId(`CHG-METRO-${Math.floor(10 + Math.random() * 90)}`);
  };

  const handleInjectErrorCode = () => {
    const newErr: ChargerErrorCode = {
      id: `ERR-MAN-${Date.now()}`,
      code: errCode.trim(),
      title: errTitle.trim(),
      severity: errSeverity,
      component: errComponent,
      description: errDesc.trim(),
      suggestedAction: errAction.trim(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'ACTIVE',
    };

    const updated = chargerProfiles.map((c) => {
      if (c.id !== errTargetChargerId) return c;
      const isCritical = errSeverity === 'CRITICAL';
      return {
        ...c,
        status: isCritical ? ('CRITICAL' as const) : ('DEGRADED' as const),
        healthScore: Math.max(40, c.healthScore - (isCritical ? 30 : 15)),
        errorCodes: [newErr, ...c.errorCodes],
      };
    });

    onUpdateChargerProfiles(updated);
    setChargerRegSuccess(`Injected diagnostic fault code [${newErr.code}] into node ${errTargetChargerId}!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Feeder Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-950/90 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Manual Data Ingestion &amp; Live Feeder Suite
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Feed custom charging sessions, stream single telemetry points, paste batch CSV/JSON, or register hardware nodes
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setFeedMode('SESSION')}
              className={`px-3 py-1.5 rounded-md font-mono transition flex items-center gap-1.5 ${
                feedMode === 'SESSION'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" /> Manual Session Form
            </button>

            <button
              onClick={() => setFeedMode('LIVE_STREAM')}
              className={`px-3 py-1.5 rounded-md font-mono transition flex items-center gap-1.5 ${
                feedMode === 'LIVE_STREAM'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" /> Point Stream Feeder
            </button>

            <button
              onClick={() => setFeedMode('BATCH_PASTE')}
              className={`px-3 py-1.5 rounded-md font-mono transition flex items-center gap-1.5 ${
                feedMode === 'BATCH_PASTE'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Raw CSV / JSON Paste
            </button>

            <button
              onClick={() => setFeedMode('HARDWARE')}
              className={`px-3 py-1.5 rounded-md font-mono transition flex items-center gap-1.5 ${
                feedMode === 'HARDWARE'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" /> Charger &amp; Fault Injector
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: MANUAL SESSION BUILDER & PHYSICS EVALUATOR */}
      {/* ========================================================================= */}
      {feedMode === 'SESSION' && (
        <div className="space-y-6">
          {/* Quick Presets Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Quick Load Presets:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => applyPreset('HEALTHY')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 transition"
              >
                Healthy Tesla M3 (53 kWh)
              </button>
              <button
                onClick={() => applyPreset('INVERTER_LOSS')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition"
              >
                Thermal Loss Warning (Ioniq 5)
              </button>
              <button
                onClick={() => applyPreset('SHUNT_LEAK')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 transition"
              >
                Shunt Drift Anomaly (Taycan)
              </button>
              <button
                onClick={() => applyPreset('COLD_WEATHER')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 transition"
              >
                Cold Winter Charge (-4°C)
              </button>
              <button
                onClick={() => applyPreset('FAST_SPLIT')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 transition"
              >
                High Power 250kW (Lucid Air)
              </button>
            </div>
          </div>

          {/* Success feedback notification */}
          {feedSuccessMessage && (
            <div className="p-4 bg-emerald-950/70 border border-emerald-500/50 rounded-xl flex items-center justify-between gap-3 text-emerald-300 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-semibold">{feedSuccessMessage}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab('DASHBOARD')}
                  className="px-2.5 py-1 rounded bg-emerald-800/60 hover:bg-emerald-800 text-white font-medium transition"
                >
                  View on Dashboard
                </button>
                <button
                  onClick={() => onNavigateTab('HISTORY')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  Session History
                </button>
                <button onClick={() => setFeedSuccessMessage(null)} className="text-emerald-400 hover:text-white">
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Form Grid & Physics Calculation Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Form: Parameter Inputs (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Database className="w-4 h-4 text-cyan-400" />
                Manual Session Parameters &amp; Telemetry Setup
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Session ID */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Session ID</label>
                  <input
                    type="text"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Charger Node */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Target Charger Station</label>
                  <select
                    value={chargerId}
                    onChange={(e) => setChargerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    {chargerProfiles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} ({c.name})
                      </option>
                    ))}
                    <option value="CUSTOM">+ Enter Custom Charger ID</option>
                  </select>
                  {chargerId === 'CUSTOM' && (
                    <input
                      type="text"
                      placeholder="e.g. CHG-CUSTOM-09"
                      value={customChargerId}
                      onChange={(e) => setCustomChargerId(e.target.value)}
                      className="w-full mt-2 bg-slate-950 border border-cyan-800/80 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none"
                    />
                  )}
                </div>

                {/* EV Identifier */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">EV Identifier / Vehicle Model</label>
                  <input
                    type="text"
                    value={evId}
                    onChange={(e) => setEvId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Battery Capacity */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Battery Capacity (kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="5"
                    max="250"
                    value={batteryCapacityKwh}
                    onChange={(e) => setBatteryCapacityKwh(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Initial SOC */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Initial SOC (%)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="99"
                    value={initialSoc}
                    onChange={(e) => setInitialSoc(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Target SOC */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Target SOC (%)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    value={targetSoc}
                    onChange={(e) => setTargetSoc(parseFloat(e.target.value) || 100)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Charging Efficiency */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Rated Inverter Efficiency (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="50"
                    max="100"
                    value={chargingEfficiency}
                    onChange={(e) => setChargingEfficiency(parseFloat(e.target.value) || 90)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-purple-300 font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Charging Power */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Charger Nominal Power (kW)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="400"
                    value={chargingPowerKw}
                    onChange={(e) => setChargingPowerKw(parseFloat(e.target.value) || 50)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Ambient Temperature */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Ambient Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="-40"
                    max="60"
                    value={ambientTemperatureC}
                    onChange={(e) => setAmbientTemperatureC(parseFloat(e.target.value) || 25)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-orange-300 font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Session Duration (Minutes)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="600"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 30)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Crucial: Actual Metered Energy Input */}
              <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-cyan-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    Actual Metered Grid Energy Input (kWh)
                  </label>
                  <button
                    onClick={() => setActualEnergyKwh(parseFloat(expectedEnergyKwh.toFixed(2)))}
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300"
                  >
                    Match Expected ({expectedEnergyKwh.toFixed(2)} kWh)
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="500"
                    value={actualEnergyKwh}
                    onChange={(e) => setActualEnergyKwh(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-cyan-600 rounded-lg px-3 py-2.5 text-base font-bold font-mono text-cyan-300 focus:outline-none"
                  />
                  <div className="text-xs text-slate-400 font-mono shrink-0">Total kWh delivered</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={handleSaveManualSession}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition"
                >
                  <Send className="w-4 h-4" /> Save &amp; Feed Session into Fleet
                </button>

                <button
                  onClick={() => setEnableManualPointsEditor(!enableManualPointsEditor)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                >
                  {enableManualPointsEditor ? 'Hide Discrete Points Table' : 'Inspect/Edit Discrete Telemetry Points'}
                </button>
              </div>
            </div>

            {/* Right Card: Live Digital Twin Physics Evaluation (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Live Physics &amp; Anomaly Diagnosis Preview
              </h3>

              {/* Status Badge */}
              <div
                className={`p-4 rounded-xl border text-center space-y-1 ${
                  calculatedStatus === 'NORMAL'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : calculatedStatus === 'WARNING'
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="text-[11px] font-mono tracking-wider uppercase text-slate-400">
                  Predicted Anomaly Classification
                </div>
                <div className="text-xl font-bold font-mono">
                  {calculatedStatus === 'NORMAL'
                    ? 'OPTIMAL / NOMINAL'
                    : calculatedStatus === 'WARNING'
                    ? 'WARNING / LOSS DETECTED'
                    : 'CRITICAL ANOMALY DETECTED'}
                </div>
                <div className="text-xs">
                  {deviationPercent <= thresholds.normalDeviationThreshold
                    ? `Deviation is within normal tolerance (<${thresholds.normalDeviationThreshold}%)`
                    : deviationPercent <= thresholds.anomalyDeviationThreshold
                    ? `Moderate loss detected between ${thresholds.normalDeviationThreshold}% and ${thresholds.anomalyDeviationThreshold}%`
                    : `Severe energy deviation (> ${thresholds.anomalyDeviationThreshold}%) exceeds safety bounds`}
                </div>
              </div>

              {/* Formula & Breakdown Table */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">ΔSOC Energy (E_batt)</span>
                  <span className="text-white font-bold">{batteryEnergyKwh.toFixed(2)} kWh</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Digital Twin Expected (E_exp)</span>
                  <span className="text-cyan-300 font-bold">{expectedEnergyKwh.toFixed(2)} kWh</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Actual Metered (E_act)</span>
                  <span className="text-white font-bold">{actualEnergyKwh.toFixed(2)} kWh</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Residual (ΔE)</span>
                  <span className={residualKwh > 0 ? 'text-amber-300 font-bold' : 'text-slate-300 font-bold'}>
                    {residualKwh > 0 ? '+' : ''}
                    {residualKwh.toFixed(2)} kWh
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Deviation (%)</span>
                  <span
                    className={`font-bold text-sm ${
                      deviationPercent > 15
                        ? 'text-rose-400'
                        : deviationPercent > 5
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    Δ {deviationPercent.toFixed(2)}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Realized Efficiency</span>
                  <span className="text-purple-300 font-bold">{realizedEfficiency.toFixed(1)}%</span>
                </div>
              </div>

              {/* Physical explanation summary */}
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-300">
                <span className="font-semibold text-slate-200 block mb-1">First-Principles Analysis:</span>
                {deviationPercent > 15
                  ? `High probability of DC shunt sensor calibration drift, unmetered auxiliary cabin/chiller drain, or ground isolation leakage.`
                  : deviationPercent > 5
                  ? `Mild inverter heat dissipation loss or ambient thermal derating at ${ambientTemperatureC}°C.`
                  : `Conservation of energy confirmed within expected mathematical boundaries.`}
              </div>
            </div>
          </div>

          {/* Optional Discrete Telemetry Points Table Editor */}
          {enableManualPointsEditor && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Discrete Time-Series Telemetry Stream ({customTelemetryCurve.length} Points)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Inspect or adjust specific voltage, current, and energy values generated for this session
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-400 font-mono flex items-center gap-2">
                    Points:
                    <select
                      value={customPointsCount}
                      onChange={(e) => setCustomPointsCount(parseInt(e.target.value, 10) || 24)}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                    >
                      <option value={12}>12 steps (5 min)</option>
                      <option value={24}>24 steps (2.5 min)</option>
                      <option value={40}>40 steps (1.5 min)</option>
                    </select>
                  </label>

                  <button
                    onClick={() => {
                      const newPt: ChargingTelemetryPoint = {
                        timeSeconds: (customTelemetryCurve[customTelemetryCurve.length - 1]?.timeSeconds || 0) + 120,
                        soc: Math.min(100, (customTelemetryCurve[customTelemetryCurve.length - 1]?.soc || 20) + 2.5),
                        expectedPowerKw: chargingPowerKw,
                        actualPowerKw: chargingPowerKw * 1.05,
                        expectedEnergyKwh: (customTelemetryCurve[customTelemetryCurve.length - 1]?.expectedEnergyKwh || 0) + 2.0,
                        actualEnergyKwh: (customTelemetryCurve[customTelemetryCurve.length - 1]?.actualEnergyKwh || 0) + 2.2,
                        residualKwh: 0.2,
                        deviationPercent: 10.0,
                        status: 'WARNING',
                        temperatureC: ambientTemperatureC + 4,
                        voltageV: 400,
                        currentA: 150,
                      };
                      setCustomTelemetryCurve([...customTelemetryCurve, newPt]);
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs font-mono flex items-center gap-1 border border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Point
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto font-mono text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] sticky top-0">
                    <tr>
                      <th className="p-2">Time (s)</th>
                      <th className="p-2">SOC (%)</th>
                      <th className="p-2">Voltage (V)</th>
                      <th className="p-2">Current (A)</th>
                      <th className="p-2">Power (kW)</th>
                      <th className="p-2">Exp Energy</th>
                      <th className="p-2">Act Energy</th>
                      <th className="p-2">Temp (°C)</th>
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {customTelemetryCurve.map((pt, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2 text-slate-300">{pt.timeSeconds}s</td>
                        <td className="p-2 text-emerald-400">{pt.soc.toFixed(1)}%</td>
                        <td className="p-2 text-slate-300">{pt.voltageV.toFixed(1)} V</td>
                        <td className="p-2 text-slate-300">{pt.currentA.toFixed(1)} A</td>
                        <td className="p-2 text-amber-300">{pt.actualPowerKw.toFixed(1)} kW</td>
                        <td className="p-2 text-cyan-300">{pt.expectedEnergyKwh.toFixed(2)}</td>
                        <td className="p-2 text-white font-bold">{pt.actualEnergyKwh.toFixed(2)}</td>
                        <td className="p-2 text-orange-300">{pt.temperatureC.toFixed(1)}°C</td>
                        <td className="p-2">
                          <button
                            onClick={() => {
                              setCustomTelemetryCurve(customTelemetryCurve.filter((_, i) => i !== idx));
                            }}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: LIVE POINT-BY-POINT TELEMETRY FEEDER */}
      {/* ========================================================================= */}
      {feedMode === 'LIVE_STREAM' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  Live Point-by-Point Telemetry Stream Feeder
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Push single telemetry packets in real time directly to active session <strong>{activeSession.id}</strong>
                </p>
              </div>
              <div className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
                {currentTelemetry.length} Points Ingested
              </div>
            </div>

            {/* Live Slider & Numerical Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Voltage */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Voltage (V)</span>
                  <span className="text-cyan-300 font-bold">{liveVoltage} V</span>
                </div>
                <input
                  type="range"
                  min="350"
                  max="450"
                  step="0.5"
                  value={liveVoltage}
                  onChange={(e) => setLiveVoltage(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Current */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Current (A)</span>
                  <span className="text-amber-300 font-bold">{liveCurrent} A</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="350"
                  step="1"
                  value={liveCurrent}
                  onChange={(e) => setLiveCurrent(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* SOC */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Pack SOC (%)</span>
                  <span className="text-emerald-400 font-bold">{liveSoc.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={liveSoc}
                  onChange={(e) => setLiveSoc(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Temperature */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Temp (°C)</span>
                  <span className="text-orange-300 font-bold">{liveTemp.toFixed(1)}°C</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="65"
                  step="0.5"
                  value={liveTemp}
                  onChange={(e) => setLiveTemp(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Calculated Power Display */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                Instantaneous Ingest Power: <strong className="text-amber-300">{((liveVoltage * liveCurrent) / 1000).toFixed(2)} kW</strong>
              </span>
              <span className="text-slate-400">
                Step Energy Increment: <strong className="text-cyan-300">{(((liveVoltage * liveCurrent) / 1000) * (60 / 3600)).toFixed(3)} kWh</strong> per minute
              </span>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handlePushSingleTelemetryPoint}
                className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition"
              >
                <Send className="w-4 h-4" /> Push Single Telemetry Point (+60s)
              </button>

              <button
                onClick={handleSimulateFiveSteps}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Play className="w-4 h-4 text-emerald-400" /> Push 5-Step Continuous Sequence
              </button>

              <button
                onClick={() => onNavigateTab('DASHBOARD')}
                className="px-4 py-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-300 text-xs font-mono ml-auto border border-cyan-800/60"
              >
                Inspect Live Charts &gt;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: RAW BATCH PASTE (CSV / JSON) */}
      {/* ========================================================================= */}
      {feedMode === 'BATCH_PASTE' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                  Raw Batch Telemetry Text Paste &amp; Ingest
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paste raw CSV text rows or JSON array to batch ingest multiple charging records simultaneously
                </p>
              </div>

              {/* Sample Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPasteContent(sampleCsvSnippet)}
                  className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 transition"
                >
                  Load Sample CSV
                </button>
                <button
                  onClick={() => setPasteContent(sampleJsonSnippet)}
                  className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-purple-300 rounded border border-slate-700 transition"
                >
                  Load Sample JSON
                </button>
              </div>
            </div>

            {/* Error or Success notification */}
            {pasteError && (
              <div className="p-3 bg-rose-950/80 border border-rose-600 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{pasteError}</span>
              </div>
            )}
            {pasteSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pasteSuccess}</span>
              </div>
            )}

            {/* Textarea */}
            <div>
              <textarea
                rows={10}
                placeholder="Paste CSV rows (with header) or JSON array here..."
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setPasteContent('')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear Textarea
              </button>

              <button
                onClick={handleIngestPastedData}
                className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition"
              >
                <Zap className="w-4 h-4" /> Validate &amp; Ingest Pasted Sessions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 4: CHARGER REGISTRY & ERROR CODE FEEDER */}
      {/* ========================================================================= */}
      {feedMode === 'HARDWARE' && (
        <div className="space-y-6">
          {chargerRegSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-lg text-emerald-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{chargerRegSuccess}</span>
              </div>
              <button onClick={() => setChargerRegSuccess(null)} className="text-emerald-400 hover:text-white">
                ✕
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: Register New Charger Node */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                Register New Physical Charger Unit
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Charger Station ID</label>
                  <input
                    type="text"
                    value={newChargerId}
                    onChange={(e) => setNewChargerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newChargerName}
                    onChange={(e) => setNewChargerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Location / Substation</label>
                  <input
                    type="text"
                    value={newChargerLocation}
                    onChange={(e) => setNewChargerLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Rated Power (kW)</label>
                    <input
                      type="number"
                      value={newChargerPower}
                      onChange={(e) => setNewChargerPower(parseFloat(e.target.value) || 50)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-300 font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Connector Standard</label>
                    <input
                      type="text"
                      value={newChargerConnector}
                      onChange={(e) => setNewChargerConnector(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRegisterNewCharger}
                  className="w-full mt-2 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-xs transition"
                >
                  Register Station into Fleet
                </button>
              </div>
            </div>

            {/* Box 2: Inject Diagnostic Error Code */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Manually Log Diagnostic Fault / Error Code
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Target Charger Station</label>
                  <select
                    value={errTargetChargerId}
                    onChange={(e) => setErrTargetChargerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none"
                  >
                    {chargerProfiles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Error Code</label>
                    <input
                      type="text"
                      value={errCode}
                      onChange={(e) => setErrCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-rose-300 font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Severity</label>
                    <select
                      value={errSeverity}
                      onChange={(e) => setErrSeverity(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="WARNING">WARNING</option>
                      <option value="INFO">INFO</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Fault Title</label>
                  <input
                    type="text"
                    value={errTitle}
                    onChange={(e) => setErrTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Description &amp; Forensic Root-Cause</label>
                  <input
                    type="text"
                    value={errDesc}
                    onChange={(e) => setErrDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Suggested Remediation Action</label>
                  <input
                    type="text"
                    value={errAction}
                    onChange={(e) => setErrAction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleInjectErrorCode}
                  className="w-full mt-2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs transition"
                >
                  Inject Fault Code into Node Diagnostics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
