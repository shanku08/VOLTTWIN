import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  ChargingSession,
  ChargingTelemetryPoint,
  PhysicalParameters,
  ThresholdSettings,
  ChargerHealthProfile,
} from '../types';
import {
  Activity,
  AlertTriangle,
  Zap,
  BatteryCharging,
  Gauge,
  Thermometer,
  ShieldCheck,
  TrendingUp,
  Clock,
  Flame,
  CheckCircle2,
  Info,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ExternalLink,
  PlusCircle,
  Cpu,
  Layers,
  HelpCircle,
  Trash2,
  Scale,
} from 'lucide-react';

interface DashboardTabProps {
  sessions: ChargingSession[];
  activeSession: ChargingSession;
  currentTelemetry: ChargingTelemetryPoint[];
  currentPointIndex: number;
  isSimulating?: boolean;
  onToggleSimulate?: () => void;
  onResetSimulation?: () => void;
  playbackSpeed?: number;
  setPlaybackSpeed?: (speed: number) => void;
  params: PhysicalParameters;
  thresholds: ThresholdSettings;
  chargerProfiles?: ChargerHealthProfile[];
  onSelectSession: (session: ChargingSession) => void;
  onNavigateTab?: (tab: any) => void;
  onClearHistory?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  sessions,
  activeSession,
  currentTelemetry,
  currentPointIndex,
  isSimulating = false,
  onToggleSimulate,
  onResetSimulation,
  playbackSpeed = 1,
  setPlaybackSpeed,
  params,
  thresholds,
  chargerProfiles = [],
  onSelectSession,
  onNavigateTab,
  onClearHistory,
}) => {
  const [timelineFilter, setTimelineFilter] = useState<string>('ALL');
  const [activeChartTab, setActiveChartTab] = useState<'ALL' | 'ENERGY' | 'DEVIATION' | 'SOC' | 'POWER'>('ALL');

  // CRITICAL GRAPH FIX:
  // If simulating, slice from 0 to currentPointIndex.
  // If not simulating, ALWAYS show the full telemetry points array (all 20-30 points)
  // so graphs are immediately fully drawn and visible!
  const hasTelemetry = currentTelemetry && currentTelemetry.length > 0;
  const visibleTelemetry = isSimulating
    ? currentTelemetry.slice(0, Math.max(2, currentPointIndex + 1))
    : hasTelemetry
    ? currentTelemetry
    : [];

  const latestPoint = isSimulating
    ? visibleTelemetry[visibleTelemetry.length - 1]
    : currentTelemetry[currentTelemetry.length - 1];

  // Active charger health profile lookup
  const activeChargerProfile = chargerProfiles.find((c) => c.id === activeSession.chargerId);
  const activeChargerHealthScore = activeChargerProfile?.healthScore ?? 96;

  // Filtered sessions for timeline
  const filteredTimeline = sessions.filter((s) => {
    if (timelineFilter === 'ALL') return true;
    if (timelineFilter === 'ANOMALIES_ONLY') return s.status !== 'NORMAL';
    return s.status === timelineFilter;
  });

  // Calculate telemetry values with robust fallbacks
  const actualEnergy = latestPoint?.actualEnergyKwh ?? activeSession.actualEnergyKwh ?? 0;
  const expectedEnergy = latestPoint?.expectedEnergyKwh ?? activeSession.expectedEnergyKwh ?? 0;
  const residualEnergy = latestPoint?.residualKwh ?? (actualEnergy - expectedEnergy);
  const deviation = latestPoint?.deviationPercent ?? (expectedEnergy > 0 ? (Math.abs(residualEnergy) / expectedEnergy) * 100 : activeSession.deviationPercent);
  const soc = latestPoint?.soc ?? params.targetSoc ?? 80;
  const power = latestPoint?.actualPowerKw ?? params.chargingPowerKw ?? 50;
  const temp = latestPoint?.temperatureC ?? params.ambientTemperatureC ?? 25;

  const normalLimit = thresholds.normalDeviationThreshold ?? 5.0;
  const warningLimit = thresholds.anomalyDeviationThreshold ?? 15.0;

  // Status configuration
  const isAnomaly = activeSession.status === 'ANOMALY' || activeSession.status === 'PERSISTENT_ANOMALY';
  const isWarning = activeSession.status === 'WARNING';
  const isSpike = activeSession.status === 'SUDDEN_SPIKE';

  return (
    <div className="space-y-6">
      {/* 1. Quick Scenario Switcher (Super simple 1-click test cases) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Quick Test Vehicles &amp; Scenarios:
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">(Click any vehicle to switch data &amp; graphs instantly)</span>
          </div>

          <div className="flex items-center gap-2">
            {onClearHistory && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-rose-950/70 text-slate-300 hover:text-rose-300 rounded-lg text-xs font-medium border border-slate-700 hover:border-rose-700/60 transition shadow"
                title="Clear imported session records and reset to default test scenarios"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('MANUAL_FEED')}
                className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600/90 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition shadow"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Enter Custom Data</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {sessions.slice(0, 6).map((sess) => {
            const isSelected = sess.id === activeSession.id;
            const isNorm = sess.status === 'NORMAL';
            const isWarn = sess.status === 'WARNING';

            return (
              <button
                key={sess.id}
                onClick={() => onSelectSession(sess)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-all text-left ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-lg ring-1 ring-cyan-400/50 scale-[1.02]'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isNorm ? 'bg-emerald-400' : isWarn ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                />
                <div>
                  <div className="font-semibold text-slate-100">{sess.evId}</div>
                  <div className="text-[11px] text-slate-400">
                    Δ {sess.deviationPercent.toFixed(1)}% • {sess.actualEnergyKwh.toFixed(1)} kWh
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Energy Required & Metered Delivered */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <Zap className="w-4 h-4 text-cyan-400" /> Grid Energy Delivered
            </span>
            <span className="font-mono text-cyan-400 text-[11px]">{activeSession.id}</span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-bold font-mono text-white">
                  {actualEnergy.toFixed(2)}
                  <span className="text-xs font-normal text-slate-400 ml-1">kWh</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  Actual Metered Grid
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    deviation > warningLimit
                      ? 'bg-rose-950/90 text-rose-400 border-rose-800/60'
                      : deviation >= normalLimit
                      ? 'bg-amber-950/90 text-amber-400 border-amber-800/60'
                      : 'bg-emerald-950/90 text-emerald-400 border-emerald-800/60'
                  }`}
                >
                  Δ {deviation.toFixed(2)}%
                </span>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  {deviation > warningLimit ? 'Critical Deviation' : deviation >= normalLimit ? 'Warning Level' : 'Nominal Match'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Energy Required Box (Expected Energy) */}
        <div className="bg-slate-900/90 border border-cyan-900/40 rounded-xl p-4.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-cyan-300">
              <Layers className="w-4 h-4 text-cyan-400" /> Energy Required (Physics)
            </span>
            <span className="text-[11px] font-mono text-slate-400">{params.chargingEfficiency}% η</span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-bold font-mono text-cyan-300">
                  {expectedEnergy.toFixed(2)}
                  <span className="text-xs font-normal text-slate-400 ml-1">kWh</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  E_expected = E_batt / η
                </div>
              </div>
              <div className="text-right font-mono text-[11px] text-slate-300">
                <div>Pack: {((params.batteryCapacityKwh * Math.max(0, params.targetSoc - params.initialSoc)) / 100).toFixed(2)} kWh</div>
                <div className="text-slate-400">{params.initialSoc}% → {params.targetSoc}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Energy Residual Box (Residual Energy) */}
        <div className={`border rounded-xl p-4.5 shadow-sm flex flex-col justify-between ${
          deviation > warningLimit
            ? 'bg-rose-950/30 border-rose-800/60'
            : deviation >= normalLimit
            ? 'bg-amber-950/30 border-amber-800/60'
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <Scale className={`w-4 h-4 ${
                deviation > warningLimit
                  ? 'text-rose-400'
                  : deviation >= normalLimit
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`} /> Energy Residual (E_res)
            </span>
            <span className="text-[11px] font-mono text-slate-400">E_act − E_exp</span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <div>
                <div className={`text-2xl font-bold font-mono ${
                  deviation > warningLimit
                    ? 'text-rose-300'
                    : deviation >= normalLimit
                    ? 'text-amber-300'
                    : 'text-emerald-300'
                }`}>
                  {residualEnergy > 0 ? '+' : ''}{residualEnergy.toFixed(2)}
                  <span className="text-xs font-normal text-slate-400 ml-1">kWh</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  Physical Balance Gap
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    isAnomaly
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : isWarning
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}
                >
                  {activeSession.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Battery SOC & Charger Node Health */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <BatteryCharging className="w-4 h-4 text-emerald-400" /> Battery &amp; Charger
            </span>
            <span className="font-mono text-cyan-300 text-[11px]">{activeSession.chargerId}</span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold font-mono text-emerald-400">{soc.toFixed(1)}%</div>
              <div className="text-xs text-slate-400 font-mono">
                {power.toFixed(1)} kW Flow
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold font-mono text-white flex items-center justify-end gap-1">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                {activeChargerHealthScore}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
              <div className="text-xs text-orange-400 font-mono flex items-center justify-end gap-0.5">
                <Thermometer className="w-3 h-3" /> {temp.toFixed(1)}°C
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Telemetry Graphs Section (Guaranteed Working & Fully Sized) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                Real-Time Telemetry &amp; Physics Graphs
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous comparison between first-principles digital twin model and metered hardware delivery
            </p>
          </div>

          {/* Controls: Simulation Play/Pause & Chart View Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Simulation controls */}
            {onToggleSimulate && (
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                <button
                  onClick={onToggleSimulate}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold font-mono transition ${
                    isSimulating
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {isSimulating ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" /> Play Live Stream
                    </>
                  )}
                </button>

                {onResetSimulation && (
                  <button
                    onClick={onResetSimulation}
                    title="Reset to start of session"
                    className="p-1 text-slate-400 hover:text-white rounded"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                {setPlaybackSpeed && (
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-mono rounded px-1 py-0.5"
                  >
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={5}>5x</option>
                  </select>
                )}
              </div>
            )}

            {/* Chart View Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
              {[
                { id: 'ALL', label: 'All 4 Graphs' },
                { id: 'ENERGY', label: 'Expected vs Actual' },
                { id: 'DEVIATION', label: 'Deviation %' },
                { id: 'SOC', label: 'SOC (%)' },
                { id: 'POWER', label: 'Power Flow (kW)' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveChartTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-md transition font-mono text-xs ${
                    activeChartTab === t.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* The 4 Core Graphs Grid */}
        <div
          className={`grid gap-5 min-w-0 ${
            activeChartTab === 'ALL' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {/* Chart 1: Expected vs Actual Energy (Area Chart) */}
          {(activeChartTab === 'ALL' || activeChartTab === 'ENERGY') && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 shadow-lg min-w-0 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    1. Expected vs. Actual Grid Energy Delivery (kWh)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    E_expected = (ΔSOC × Cap) / η vs metered grid supply E_actual
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-cyan-400">Exp: {expectedEnergy.toFixed(1)} kWh</span>
                  <span className="mx-1 text-slate-600">|</span>
                  <span className="text-rose-400 font-bold">Act: {actualEnergy.toFixed(1)} kWh</span>
                </div>
              </div>

              <div className="h-72 w-full min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={visibleTelemetry}
                    margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="timeSeconds"
                      tickFormatter={(v) => `${Math.round(Number(v) / 60)}m`}
                      stroke="#64748b"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" kWh" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelFormatter={(v) => `Charging Time: ${Math.round(Number(v) / 60)} minutes`}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Area
                      type="monotone"
                      dataKey="actualEnergyKwh"
                      name="Actual Metered Energy (kWh)"
                      stroke="#f43f5e"
                      fillOpacity={1}
                      fill="url(#actGrad)"
                      strokeWidth={2.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="expectedEnergyKwh"
                      name="Expected Digital Twin (kWh)"
                      stroke="#06b6d4"
                      fillOpacity={1}
                      fill="url(#expGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 2: Energy Deviation (%) & Threshold Bands */}
          {(activeChartTab === 'ALL' || activeChartTab === 'DEVIATION') && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 shadow-lg min-w-0 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                    <Activity className="w-4 h-4 text-amber-400" />
                    2. Residual Deviation (%) &amp; Safety Thresholds
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Continuous error % with Normal (&lt;{normalLimit}%) and Anomaly (&gt;{warningLimit}%) bands
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      deviation > warningLimit
                        ? 'text-rose-400 bg-rose-950/80'
                        : deviation >= normalLimit
                        ? 'text-amber-400 bg-amber-950/80'
                        : 'text-emerald-400 bg-emerald-950/80'
                    }`}
                  >
                    Δ {deviation.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="h-72 w-full min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={visibleTelemetry}
                    margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="timeSeconds"
                      tickFormatter={(v) => `${Math.round(Number(v) / 60)}m`}
                      stroke="#64748b"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelFormatter={(v) => `Charging Time: ${Math.round(Number(v) / 60)}m`}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <ReferenceLine
                      y={normalLimit}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{ value: `Normal (<${normalLimit}%)`, fill: '#10b981', fontSize: 10 }}
                    />
                    <ReferenceLine
                      y={warningLimit}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{ value: `Warning (<${warningLimit}%)`, fill: '#f59e0b', fontSize: 10 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="deviationPercent"
                      name="Residual Deviation (%)"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 3: Battery State of Charge (SOC %) Progression */}
          {(activeChartTab === 'ALL' || activeChartTab === 'SOC') && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 shadow-lg min-w-0 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                    <BatteryCharging className="w-4 h-4 text-emerald-400" />
                    3. Battery Pack State of Charge (SOC %) Trajectory
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Electrochemical pack progression ({params.initialSoc}% → {params.targetSoc}%)
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-emerald-400 font-bold">
                  {soc.toFixed(1)}% SOC
                </div>
              </div>

              <div className="h-72 w-full min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={visibleTelemetry}
                    margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="socGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="timeSeconds"
                      tickFormatter={(v) => `${Math.round(Number(v) / 60)}m`}
                      stroke="#64748b"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelFormatter={(v) => `Elapsed: ${Math.round(Number(v) / 60)}m`}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <ReferenceLine
                      y={80}
                      stroke="#38bdf8"
                      strokeDasharray="3 3"
                      label={{ value: 'Constant Voltage (80%)', fill: '#38bdf8', fontSize: 10 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="soc"
                      name="Pack SOC (%)"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#socGrad)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 4: Charging Power Flow (kW) & CC/CV Curve */}
          {(activeChartTab === 'ALL' || activeChartTab === 'POWER') && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 shadow-lg min-w-0 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-amber-400" />
                    4. Active Power Delivery Flow (kW) vs Expected Taper
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    High power CC fast-charge stage followed by CV taper
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-amber-300 font-bold">
                  {power.toFixed(1)} kW
                </div>
              </div>

              <div className="h-72 w-full min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={visibleTelemetry}
                    margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="timeSeconds"
                      tickFormatter={(v) => `${Math.round(Number(v) / 60)}m`}
                      stroke="#64748b"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" kW" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelFormatter={(v) => `Elapsed: ${Math.round(Number(v) / 60)}m`}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Line
                      type="monotone"
                      dataKey="expectedPowerKw"
                      name="Expected Digital Twin (kW)"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                    <Line
                      type="monotone"
                      dataKey="actualPowerKw"
                      name="Actual Delivered Power (kW)"
                      stroke="#fbbf24"
                      strokeWidth={2.5}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Plain-English Root Cause Explanation & Diagnosis */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                isAnomaly
                  ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                  : isWarning
                  ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Forensic Analysis &amp; Diagnostic Verdict: {activeSession.id}
              </h3>
              <p className="text-xs text-slate-400">
                Non-accusatory physics explanation for vehicle {activeSession.evId} at charger station {activeSession.chargerId}
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border ${
              isAnomaly
                ? 'bg-rose-950 text-rose-300 border-rose-800/80'
                : isWarning
                ? 'bg-amber-950 text-amber-300 border-amber-800/80'
                : 'bg-emerald-950 text-emerald-300 border-emerald-800/80'
            }`}
          >
            {activeSession.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
              1. Mathematical Deviation
            </span>
            <p className="text-xs text-slate-200">{activeSession.explanation.deviationStatement}</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
              2. Probable Physical Cause
            </span>
            <p className="text-xs text-slate-200">
              {activeSession.explanation.possibleCauses.join('; ')}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
              3. Recommended Action
            </span>
            <p className="text-xs text-emerald-300 font-medium">{activeSession.explanation.recommendedAction}</p>
          </div>
        </div>
      </div>

      {/* 5. Session History & Incident Chronology Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Fleet Charging Session Records ({filteredTimeline.length} Sessions)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any row to load its telemetry curves onto the graphs above
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'NORMAL', label: 'Normal' },
              { id: 'WARNING', label: 'Warning' },
              { id: 'ANOMALY', label: 'Anomaly' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTimelineFilter(f.id)}
                className={`px-2.5 py-1 rounded font-mono text-[11px] transition ${
                  timelineFilter === f.id
                    ? 'bg-slate-800 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-2.5">Session ID</th>
                <th className="p-2.5">Vehicle</th>
                <th className="p-2.5">Station</th>
                <th className="p-2.5">Exp (kWh)</th>
                <th className="p-2.5">Act (kWh)</th>
                <th className="p-2.5">Deviation %</th>
                <th className="p-2.5">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTimeline.map((sess) => {
                const isSelected = sess.id === activeSession.id;
                return (
                  <tr
                    key={sess.id}
                    onClick={() => onSelectSession(sess)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-cyan-950/60 text-white font-semibold'
                        : 'hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <td className="p-2.5 text-cyan-400">{sess.id}</td>
                    <td className="p-2.5 text-white">{sess.evId}</td>
                    <td className="p-2.5 text-slate-400">{sess.chargerId}</td>
                    <td className="p-2.5 text-slate-300">{sess.expectedEnergyKwh.toFixed(2)}</td>
                    <td className="p-2.5 text-white font-bold">{sess.actualEnergyKwh.toFixed(2)}</td>
                    <td className="p-2.5">
                      <span
                        className={
                          sess.deviationPercent > 15
                            ? 'text-rose-400 font-bold'
                            : sess.deviationPercent >= 5
                            ? 'text-amber-400 font-bold'
                            : 'text-emerald-400'
                        }
                      >
                        Δ {sess.deviationPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border ${
                          sess.status === 'NORMAL'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800/80'
                            : sess.status === 'WARNING'
                            ? 'bg-amber-950 text-amber-300 border-amber-800/80'
                            : 'bg-rose-950 text-rose-300 border-rose-800/80'
                        }`}
                      >
                        {sess.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
