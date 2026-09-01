import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppTab,
  ChargingSession,
  PhysicalParameters,
  ThresholdSettings,
  ArduinoConnectionState,
  SerialTelemetryPacket,
  ChargingTelemetryPoint,
} from './types';
import { SAMPLE_CHARGING_SESSIONS, getInitialSampleSessions } from './data/sampleDatasets';
import { DEFAULT_THRESHOLDS } from './core/anomalyDetection';
import { webSerialManager } from './hardware/webSerial';
import { generateTelemetryPointsForSession } from './data/sampleDatasets';
import {
  calculateBatteryEnergy,
  calculateExpectedGridEnergy,
  calculateEnergyResidual,
  calculateDeviationPercent,
} from './core/digitalTwin';
import { classifyDeviation, generateForensicExplanation } from './core/anomalyDetection';

// Component tabs
import { Header } from './components/Header';
import { LiveTelemetryBanner } from './components/LiveTelemetryBanner';
import { DashboardTab } from './components/DashboardTab';
import { ManualDataFeedTab } from './components/ManualDataFeedTab';
import { ChargerHealthTab } from './components/ChargerHealthTab';
import { DigitalTwinTab } from './components/DigitalTwinTab';
import { AnomalyAnalyticsTab } from './components/AnomalyAnalyticsTab';
import { SimulationLabTab } from './components/SimulationLabTab';
import { ModelValidationTab } from './components/ModelValidationTab';
import { SessionHistoryTab } from './components/SessionHistoryTab';
import { ArduinoSerialTab } from './components/ArduinoSerialTab';
import { SettingsTab } from './components/SettingsTab';
import { SummaryReportModal } from './components/SummaryReportModal';
import { ProfessorDemoModal } from './components/ProfessorDemoModal';
import { INITIAL_CHARGER_PROFILES, recalculateChargerProfiles } from './data/chargerHealthData';
import { ChargerHealthProfile } from './types';
import { Code2, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  const fallbackSession: ChargingSession = {
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
    explanation: {
      primaryClassification: 'NORMAL',
      deviationPercent: 1.58,
      summary: 'Energy consumed aligns with first-principles physical expectations.',
      deviationStatement: 'Deviation is 1.58% (well within 5.0% normal tolerance).',
      possibleCauses: ['Normal conversion efficiency and minimal thermal dissipation.'],
      recommendedAction: 'No maintenance action required; charger operating within nominal parameters.',
      confidenceScore: 98,
    } as any,
    telemetryPoints: [],
    dataSource: 'SIMULATION',
  };

  const [currentTab, setCurrentTab] = useState<AppTab>('DASHBOARD');
  const [sessions, setSessions] = useState<ChargingSession[]>(SAMPLE_CHARGING_SESSIONS.length > 0 ? SAMPLE_CHARGING_SESSIONS : [fallbackSession]);
  const [activeSession, setActiveSession] = useState<ChargingSession>(SAMPLE_CHARGING_SESSIONS[0] || fallbackSession);
  const [thresholds, setThresholds] = useState<ThresholdSettings>(DEFAULT_THRESHOLDS);
  const [chargerProfiles, setChargerProfiles] = useState<ChargerHealthProfile[]>(() =>
    recalculateChargerProfiles(SAMPLE_CHARGING_SESSIONS.length > 0 ? SAMPLE_CHARGING_SESSIONS : [fallbackSession], INITIAL_CHARGER_PROFILES)
  );

  // Modals state
  const [showReportModal, setShowReportModal] = useState(false);
  const [showProfessorDemo, setShowProfessorDemo] = useState(false);

  // Keep charger profiles updated when sessions change
  useEffect(() => {
    setChargerProfiles((prev) => recalculateChargerProfiles(sessions, prev));
  }, [sessions]);

  // Digital Twin parameters bound to active session
  const [params, setParams] = useState<PhysicalParameters>({
    batteryCapacityKwh: (SAMPLE_CHARGING_SESSIONS[0] || fallbackSession).batteryCapacityKwh,
    initialSoc: (SAMPLE_CHARGING_SESSIONS[0] || fallbackSession).initialSoc,
    targetSoc: (SAMPLE_CHARGING_SESSIONS[0] || fallbackSession).targetSoc,
    chargingEfficiency: (SAMPLE_CHARGING_SESSIONS[0] || fallbackSession).chargingEfficiency,
    chargingPowerKw: (SAMPLE_CHARGING_SESSIONS[0] || fallbackSession).chargingPowerKw,
    ambientTemperatureC: (SAMPLE_CHARGING_SESSIONS[0] || fallbackSession).ambientTemperatureC,
    sessionId: (SAMPLE_CHARGING_SESSIONS[0] || fallbackSession).id,
    chargerId: (SAMPLE_CHARGING_SESSIONS[0] || fallbackSession).chargerId,
    evId: (SAMPLE_CHARGING_SESSIONS[0] || fallbackSession).evId,
  });

  const [actualEnergyInput, setActualEnergyInput] = useState<number>((SAMPLE_CHARGING_SESSIONS[0] || fallbackSession).actualEnergyKwh);

  // Hardware Arduino connection state
  const [arduinoState, setArduinoState] = useState<ArduinoConnectionState>(webSerialManager.getState());
  const [latestSerialPacket, setLatestSerialPacket] = useState<SerialTelemetryPacket | null>(null);

  // Simulation lab state
  const [isSimulating, setIsSimulating] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [activeFaultType, setActiveFaultType] = useState<
    'NONE' | 'WARNING_LOSS' | 'ANOMALY_LEAKAGE' | 'SUDDEN_SPIKE' | 'CV_FAULT' | 'PERSISTENT'
  >('NONE');

  // Active session telemetry points
  const activeTelemetryPoints = useMemo(() => {
    return activeSession.telemetryPoints.length > 0
      ? activeSession.telemetryPoints
      : generateTelemetryPointsForSession(
          activeSession.id,
          activeSession.batteryCapacityKwh,
          activeSession.initialSoc,
          activeSession.targetSoc,
          activeSession.chargingPowerKw,
          activeSession.chargingEfficiency,
          activeSession.status
        );
  }, [activeSession]);

  // Subscribe to hardware serial manager
  useEffect(() => {
    const unsubState = webSerialManager.onStateChange((state) => {
      setArduinoState({ ...state });
    });

    const unsubPacket = webSerialManager.onPacket((packet) => {
      setLatestSerialPacket(packet);
      // Auto-update metered energy when hardware is streaming
      setActualEnergyInput(packet.actualEnergyKwh);
    });

    return () => {
      unsubState();
      unsubPacket();
    };
  }, []);

  // Update parameters when user chooses a new session
  const handleSelectSession = useCallback((sess: ChargingSession) => {
    setActiveSession(sess);
    setParams({
      batteryCapacityKwh: sess.batteryCapacityKwh,
      initialSoc: sess.initialSoc,
      targetSoc: sess.targetSoc,
      chargingEfficiency: sess.chargingEfficiency,
      chargingPowerKw: sess.chargingPowerKw,
      ambientTemperatureC: sess.ambientTemperatureC,
      sessionId: sess.id,
      chargerId: sess.chargerId,
      evId: sess.evId,
    });
    setActualEnergyInput(sess.actualEnergyKwh);
    setCurrentPointIndex(0);
    setIsSimulating(false);
    setActiveFaultType('NONE');
  }, []);

  // Update physical twin parameters and recalculate active session
  const handleUpdateParams = (newParams: Partial<PhysicalParameters>) => {
    const updated = { ...params, ...newParams };
    setParams(updated);

    const battE = calculateBatteryEnergy(updated.batteryCapacityKwh, updated.initialSoc, updated.targetSoc);
    const expE = calculateExpectedGridEnergy(battE, updated.chargingEfficiency);
    const res = calculateEnergyResidual(actualEnergyInput, expE);
    const dev = calculateDeviationPercent(actualEnergyInput, expE);
    const status = classifyDeviation(dev, thresholds);
    const explanation = generateForensicExplanation(
      expE,
      actualEnergyInput,
      dev,
      status,
      updated.batteryCapacityKwh,
      updated.initialSoc,
      updated.targetSoc,
      updated.ambientTemperatureC || 25
    );

    const updatedSession: ChargingSession = {
      ...activeSession,
      batteryCapacityKwh: updated.batteryCapacityKwh,
      initialSoc: updated.initialSoc,
      targetSoc: updated.targetSoc,
      chargingEfficiency: updated.chargingEfficiency,
      chargingPowerKw: updated.chargingPowerKw,
      ambientTemperatureC: updated.ambientTemperatureC,
      expectedEnergyKwh: expE,
      actualEnergyKwh: actualEnergyInput,
      residualKwh: res,
      deviationPercent: dev,
      status,
      explanation,
    };

    setActiveSession(updatedSession);
  };

  // Recalculate when actualEnergyInput changes
  useEffect(() => {
    const battE = calculateBatteryEnergy(params.batteryCapacityKwh, params.initialSoc, params.targetSoc);
    const expE = calculateExpectedGridEnergy(battE, params.chargingEfficiency);
    const res = calculateEnergyResidual(actualEnergyInput, expE);
    const dev = calculateDeviationPercent(actualEnergyInput, expE);
    const status = classifyDeviation(dev, thresholds);
    const explanation = generateForensicExplanation(
      expE,
      actualEnergyInput,
      dev,
      status,
      params.batteryCapacityKwh,
      params.initialSoc,
      params.targetSoc,
      params.ambientTemperatureC || 25
    );

    setActiveSession((prev) => ({
      ...prev,
      actualEnergyKwh: actualEnergyInput,
      expectedEnergyKwh: expE,
      residualKwh: res,
      deviationPercent: dev,
      status,
      explanation,
    }));
  }, [actualEnergyInput, params, thresholds]);

  // Simulation playback loop
  useEffect(() => {
    if (!isSimulating) return;

    const intervalMs = Math.max(100, Math.round(1000 / playbackSpeed));
    const timer = setInterval(() => {
      setCurrentPointIndex((prev) => {
        if (prev >= activeTelemetryPoints.length - 1) {
          setIsSimulating(false);
          return prev;
        }
        const nextIdx = prev + 1;
        const pt = activeTelemetryPoints[nextIdx];
        if (pt) {
          setActualEnergyInput(pt.actualEnergyKwh);
        }
        return nextIdx;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulating, playbackSpeed, activeTelemetryPoints]);

  // Fault Injection in Simulation
  const handleInjectFault = (
    fault: 'NONE' | 'WARNING_LOSS' | 'ANOMALY_LEAKAGE' | 'SUDDEN_SPIKE' | 'CV_FAULT' | 'PERSISTENT'
  ) => {
    setActiveFaultType(fault);
    const battE = calculateBatteryEnergy(params.batteryCapacityKwh, params.initialSoc, params.targetSoc);
    const expE = calculateExpectedGridEnergy(battE, params.chargingEfficiency);

    let newActual = expE;
    if (fault === 'NONE') {
      newActual = parseFloat((expE * (1 + (Math.random() * 0.03 - 0.015))).toFixed(2));
    } else if (fault === 'WARNING_LOSS') {
      newActual = parseFloat((expE * 1.10).toFixed(2));
    } else if (fault === 'ANOMALY_LEAKAGE') {
      newActual = parseFloat((expE * 1.28).toFixed(2));
    } else if (fault === 'SUDDEN_SPIKE') {
      newActual = parseFloat((expE * 1.35).toFixed(2));
    } else if (fault === 'CV_FAULT') {
      newActual = parseFloat((expE * 1.22).toFixed(2));
    } else if (fault === 'PERSISTENT') {
      newActual = parseFloat((expE * 1.25).toFixed(2));
    }

    setActualEnergyInput(newActual);
  };

  // Add newly imported sessions
  const handleAddSessions = (newSessions: ChargingSession[]) => {
    setSessions((prev) => [...newSessions, ...prev]);
    if (newSessions.length > 0) {
      handleSelectSession(newSessions[0]);
    }
  };

  const handleUpdateActiveTelemetry = (points: ChargingTelemetryPoint[]) => {
    const updated = { ...activeSession, telemetryPoints: points };
    setActiveSession(updated);
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  // Reset/Clear History to default clean sample set
  const handleClearHistory = () => {
    const freshDefaults = getInitialSampleSessions();
    setSessions(freshDefaults);
    handleSelectSession(freshDefaults[0]);
    setIsSimulating(false);
    setCurrentPointIndex(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Application Header with Navigation */}
      <Header
        activeTab={currentTab}
        setActiveTab={setCurrentTab}
        arduinoState={arduinoState}
        onOpenProfessorDemo={() => setShowProfessorDemo(true)}
        onOpenReportModal={() => setShowReportModal(true)}
      />

      {/* Real-time Hardware & Model Telemetry Status Banner */}
      <LiveTelemetryBanner
        currentPoint={activeTelemetryPoints[currentPointIndex] || activeTelemetryPoints[0]}
        params={params}
        status={activeSession.status}
        isSimulating={isSimulating}
        session={activeSession}
        latestSerialPacket={latestSerialPacket}
        arduinoState={arduinoState}
      />

      {/* Main Content Area Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'DASHBOARD' && (
          <DashboardTab
            activeSession={activeSession}
            sessions={sessions}
            currentTelemetry={activeTelemetryPoints}
            currentPointIndex={currentPointIndex}
            isSimulating={isSimulating}
            onToggleSimulate={() => setIsSimulating(!isSimulating)}
            onResetSimulation={() => {
              setIsSimulating(false);
              setCurrentPointIndex(0);
            }}
            playbackSpeed={playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
            params={params}
            thresholds={thresholds}
            chargerProfiles={chargerProfiles}
            onSelectSession={handleSelectSession}
            onNavigateTab={setCurrentTab}
            onClearHistory={handleClearHistory}
          />
        )}

        {currentTab === 'MANUAL_FEED' && (
          <ManualDataFeedTab
            sessions={sessions}
            onAddSessions={handleAddSessions}
            activeSession={activeSession}
            onSelectSession={handleSelectSession}
            currentTelemetry={activeTelemetryPoints}
            onUpdateActiveTelemetry={handleUpdateActiveTelemetry}
            thresholds={thresholds}
            chargerProfiles={chargerProfiles}
            onUpdateChargerProfiles={setChargerProfiles}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'CHARGER_HEALTH' && (
          <ChargerHealthTab
            chargerProfiles={chargerProfiles}
            onUpdateProfiles={setChargerProfiles}
            sessions={sessions}
            onSelectSession={handleSelectSession}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'DIGITAL_TWIN' && (
          <DigitalTwinTab
            params={params}
            onUpdateParams={handleUpdateParams}
            actualEnergyInput={actualEnergyInput}
            setActualEnergyInput={setActualEnergyInput}
          />
        )}

        {currentTab === 'ANOMALIES' && (
          <AnomalyAnalyticsTab
            sessions={sessions}
            activeSession={activeSession}
            thresholds={thresholds}
            onSelectSession={handleSelectSession}
          />
        )}

        {currentTab === 'SIMULATION_LAB' && (
          <SimulationLabTab
            isSimulating={isSimulating}
            onToggleSimulate={() => setIsSimulating(!isSimulating)}
            onResetSimulation={() => {
              setIsSimulating(false);
              setCurrentPointIndex(0);
              const firstPt = activeTelemetryPoints[0];
              if (firstPt) setActualEnergyInput(firstPt.actualEnergyKwh);
            }}
            onStepSimulation={() => {
              if (currentPointIndex < activeTelemetryPoints.length - 1) {
                const nextIdx = currentPointIndex + 1;
                setCurrentPointIndex(nextIdx);
                const pt = activeTelemetryPoints[nextIdx];
                if (pt) setActualEnergyInput(pt.actualEnergyKwh);
              }
            }}
            playbackSpeed={playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
            currentPointIndex={currentPointIndex}
            telemetryPoints={activeTelemetryPoints}
            params={params}
            thresholds={thresholds}
            activeFaultType={activeFaultType}
            onInjectFault={handleInjectFault}
          />
        )}

        {currentTab === 'VALIDATION' && (
          <ModelValidationTab />
        )}

        {currentTab === 'HISTORY' && (
          <SessionHistoryTab
            sessions={sessions}
            onAddSessions={handleAddSessions}
            thresholds={thresholds}
            onSelectSession={handleSelectSession}
            activeSession={activeSession}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'ARDUINO' && (
          <ArduinoSerialTab
            arduinoState={arduinoState}
            latestSerialPacket={latestSerialPacket}
          />
        )}

        {currentTab === 'SETTINGS' && (
          <SettingsTab
            thresholds={thresholds}
            onUpdateThresholds={(newT) => setThresholds({ ...thresholds, ...newT })}
            onResetThresholds={() => setThresholds(DEFAULT_THRESHOLDS)}
          />
        )}
      </main>

      {/* Academic & Operations Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/95 py-6 px-4 sm:px-6 text-xs text-slate-400 w-full mt-auto">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900/80 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <span className="text-slate-200">
                  <strong className="text-white font-semibold tracking-tight">VoltTwin Synapse</strong>
                  <span className="text-slate-400 ml-1.5 font-normal hidden sm:inline">— Physics-Informed Digital Twin &amp; Anomaly Intelligence</span>
                </span>
              </div>

              {/* High-Tech Developer Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-slate-900 via-cyan-950/50 to-slate-900 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] text-slate-400">Developed by</span>
                <span className="font-mono text-xs font-bold tracking-wider bg-gradient-to-r from-cyan-300 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
                  neonscodeshanks07
                </span>
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
              </div>
            </div>

            <div className="font-mono text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Non-Accusatory Diagnostics • ISO 15118 &amp; SAE J1772 Standards</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
            <div className="text-slate-400 flex items-center gap-2">
              <span>&copy; {new Date().getFullYear()}</span>
              <span className="font-bold text-slate-200 tracking-wide">neonscodeshanks07</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-500">All Rights Reserved</span>
            </div>

            <div className="text-amber-300/90 flex items-center gap-2 bg-amber-950/40 border border-amber-900/50 px-3 py-1.5 rounded-lg shadow-sm">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong className="text-amber-300 font-semibold">Reliability Notice:</strong> This app can make mistakes. Always cross-verify critical telemetry and diagnostics with physical hardware meters.
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Executive & Forensic Summary Report Modal */}
      <SummaryReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        sessions={sessions}
        activeSession={activeSession}
        thresholds={thresholds}
        chargerProfiles={chargerProfiles}
      />

      {/* Live Demonstration & Benchmark Scenarios Modal */}
      <ProfessorDemoModal
        isOpen={showProfessorDemo}
        onClose={() => setShowProfessorDemo(false)}
        onLaunchScenario={(scenarioSession) => {
          setSessions((prev) => {
            const exists = prev.some((s) => s.id === scenarioSession.id);
            return exists ? prev : [scenarioSession, ...prev];
          });
          handleSelectSession(scenarioSession);
          setCurrentTab('DASHBOARD');
        }}
      />
    </div>
  );
}
