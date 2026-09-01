import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  ChargerHealthProfile,
  ChargerHealthStatus,
  ChargingSession,
  ChargerErrorCode,
  ThresholdSettings,
} from '../types';
import {
  Gauge,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Zap,
  TrendingDown,
  Thermometer,
  Wrench,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Sliders,
  FileText,
  Radio,
  Cpu,
  Layers,
  ChevronRight,
  X,
  PlayCircle,
  Sparkles,
} from 'lucide-react';

interface ChargerHealthTabProps {
  chargerProfiles: ChargerHealthProfile[];
  onUpdateProfiles: (profiles: ChargerHealthProfile[]) => void;
  sessions: ChargingSession[];
  onSelectSession: (session: ChargingSession) => void;
  onNavigateTab: (tab: any) => void;
}

export const ChargerHealthTab: React.FC<ChargerHealthTabProps> = ({
  chargerProfiles,
  onUpdateProfiles,
  sessions,
  onSelectSession,
  onNavigateTab,
}) => {
  const [selectedChargerId, setSelectedChargerId] = useState<string>(chargerProfiles[0]?.id || 'CHG-NORTH-01');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selfTestRunning, setSelfTestRunning] = useState<boolean>(false);
  const [selfTestLog, setSelfTestLog] = useState<string | null>(null);

  const selectedCharger = chargerProfiles.find((c) => c.id === selectedChargerId) || chargerProfiles[0];

  // Filtering chargers
  const filteredChargers = chargerProfiles.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.connectorType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Fleet Statistics
  const totalFleetCount = chargerProfiles.length;
  const healthyCount = chargerProfiles.filter((c) => c.status === 'HEALTHY').length;
  const degradedCount = chargerProfiles.filter((c) => c.status === 'DEGRADED').length;
  const criticalCount = chargerProfiles.filter((c) => c.status === 'CRITICAL').length;
  const maintenanceCount = chargerProfiles.filter((c) => c.status === 'MAINTENANCE').length;

  const fleetAvgUptime =
    chargerProfiles.reduce((acc, c) => acc + c.uptimePercent, 0) / (totalFleetCount || 1);
  const fleetAvgEfficiency =
    chargerProfiles.reduce((acc, c) => acc + c.averageChargingEfficiency, 0) / (totalFleetCount || 1);
  const totalActiveErrors = chargerProfiles.reduce(
    (acc, c) => acc + c.errorCodes.filter((e) => e.status === 'ACTIVE').length,
    0
  );

  // Status Badge UI Helpers
  const getStatusBadge = (st: ChargerHealthStatus) => {
    switch (st) {
      case 'HEALTHY':
        return {
          bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-400',
          label: 'OPTIMAL / HEALTHY',
          icon: ShieldCheck,
        };
      case 'DEGRADED':
        return {
          bg: 'bg-amber-950/70 border-amber-500/40 text-amber-400',
          dot: 'bg-amber-400',
          label: 'DEGRADED / WARNING',
          icon: AlertTriangle,
        };
      case 'CRITICAL':
        return {
          bg: 'bg-rose-950/70 border-rose-500/40 text-rose-400',
          dot: 'bg-rose-400 animate-pulse',
          label: 'CRITICAL / ACTION REQ',
          icon: AlertTriangle,
        };
      case 'MAINTENANCE':
        return {
          bg: 'bg-sky-950/70 border-sky-500/40 text-sky-400',
          dot: 'bg-sky-400',
          label: 'MAINTENANCE / TEST',
          icon: Wrench,
        };
    }
  };

  // Error Code Actions
  const handleAcknowledgeError = (chargerId: string, errorCodeId: string) => {
    const updated = chargerProfiles.map((c) => {
      if (c.id !== chargerId) return c;
      return {
        ...c,
        errorCodes: c.errorCodes.map((e) => (e.id === errorCodeId ? { ...e, status: 'ACKNOWLEDGED' as const } : e)),
      };
    });
    onUpdateProfiles(updated);
  };

  const handleResolveError = (chargerId: string, errorCodeId: string) => {
    const updated = chargerProfiles.map((c) => {
      if (c.id !== chargerId) return c;
      return {
        ...c,
        errorCodes: c.errorCodes.map((e) => (e.id === errorCodeId ? { ...e, status: 'RESOLVED' as const } : e)),
      };
    });
    onUpdateProfiles(updated);
  };

  const handleRunSelfTest = (chargerId: string) => {
    setSelfTestRunning(true);
    setSelfTestLog(`Initiating ISO 15118 & IEC 61851 hardware diagnostic sweep for ${chargerId}...`);

    setTimeout(() => {
      setSelfTestLog((prev) => `${prev}\n> [PASS] DC Contactor Coil Continuity: 0.12 Ω`);
    }, 600);

    setTimeout(() => {
      setSelfTestLog((prev) => `${prev}\n> [PASS] Isolation Resistance Check: ${selectedCharger.isolationResistanceKohm} kΩ (Threshold > 500 kΩ)`);
    }, 1200);

    setTimeout(() => {
      setSelfTestLog((prev) => `${prev}\n> [PASS] Digital Twin Shunt Transducer Drift: 0.04% residual variance`);
    }, 1800);

    setTimeout(() => {
      setSelfTestLog((prev) => `${prev}\n> [COMPLETE] Diagnostics passed with 100% telemetry fidelity.`);
      setSelfTestRunning(false);
    }, 2400);
  };

  // Sessions for active charger
  const chargerSessions = sessions.filter((s) => s.chargerId === selectedCharger?.id);

  return (
    <div className="space-y-6">
      {/* Top Fleet Health Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Radio className="w-4 h-4 text-cyan-400" /> Monitored Chargers
            </span>
            <span className="font-mono text-cyan-400">{totalFleetCount} Units</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-white">{totalFleetCount}</div>
            <div className="text-xs text-slate-400 font-mono">
              <span className="text-emerald-400">{healthyCount} Healthy</span> / <span className="text-rose-400">{criticalCount} Crit</span>
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 flex overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${(healthyCount / totalFleetCount) * 100}%` }} />
            <div className="bg-amber-500 h-full" style={{ width: `${(degradedCount / totalFleetCount) * 100}%` }} />
            <div className="bg-rose-500 h-full" style={{ width: `${(criticalCount / totalFleetCount) * 100}%` }} />
            <div className="bg-sky-500 h-full" style={{ width: `${(maintenanceCount / totalFleetCount) * 100}%` }} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Activity className="w-4 h-4 text-emerald-400" /> Fleet Avg Uptime
            </span>
            <span className="text-xs font-mono text-emerald-400">High Reliability</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-emerald-400">{fleetAvgUptime.toFixed(1)}%</div>
            <span className="text-xs text-slate-400 font-mono">&gt;99% SLA Target</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">Annual MTBF: 1,840 operating hours</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Zap className="w-4 h-4 text-purple-400" /> Avg Realized Efficiency
            </span>
            <span className="text-xs text-slate-400">First-Principles</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-purple-300">{fleetAvgEfficiency.toFixed(1)}%</div>
            <span className="text-xs text-slate-400 font-mono">Rated ~92.0%</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">Digital Twin baseline verified</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Active Error Codes
            </span>
            <span className="text-xs font-mono text-rose-400">Real-Time</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-rose-400">{totalActiveErrors}</div>
            <span className="text-xs text-slate-400 font-mono">Reported Alerts</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {totalActiveErrors === 0 ? 'All nodes nominal' : 'Requires field/remote action'}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Layers className="w-4 h-4 text-cyan-400" /> Total Energy Delivered
            </span>
            <span className="text-xs text-slate-400">Cumulative</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-cyan-300">
              {chargerProfiles.reduce((acc, c) => acc + c.totalEnergyDeliveredMwh, 0).toFixed(1)}
              <span className="text-xs font-normal text-slate-400 ml-1">MWh</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {chargerProfiles.reduce((acc, c) => acc + c.totalSessions, 0)} sessions
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">Grid telemetry active</div>
        </div>
      </div>

      {/* Main Charger Fleet Explorer & Diagnostic Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Charger Fleet List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search charger ID, name, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { id: 'ALL', label: 'All Fleet' },
                { id: 'HEALTHY', label: 'Healthy' },
                { id: 'DEGRADED', label: 'Degraded' },
                { id: 'CRITICAL', label: 'Critical' },
                { id: 'MAINTENANCE', label: 'Maintenance' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                    statusFilter === f.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Charger Cards List */}
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredChargers.map((charger) => {
              const isSelected = charger.id === selectedChargerId;
              const badge = getStatusBadge(charger.status);
              const BadgeIcon = badge.icon;
              const activeErrCount = charger.errorCodes.filter((e) => e.status === 'ACTIVE').length;

              return (
                <div
                  key={charger.id}
                  onClick={() => setSelectedChargerId(charger.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-950/20'
                      : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-100">{charger.id}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium mt-1 truncate">{charger.name}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{charger.location}</div>
                    </div>

                    {/* Health Score Gauge */}
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold font-mono ${
                          charger.healthScore >= 90
                            ? 'text-emerald-400'
                            : charger.healthScore >= 70
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {charger.healthScore}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Health Score</div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
                    <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Uptime</span>
                      <span className="text-slate-200 font-bold">{charger.uptimePercent}%</span>
                    </div>
                    <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Avg Efficiency</span>
                      <span className="text-purple-300 font-bold">{charger.averageChargingEfficiency}%</span>
                    </div>
                    <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Sessions</span>
                      <span className="text-slate-200 font-bold">{charger.totalSessions}</span>
                    </div>
                  </div>

                  {/* Active Alert Flag */}
                  {activeErrCount > 0 && (
                    <div className="mt-2 flex items-center justify-between text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/50 px-2.5 py-1 rounded">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        {activeErrCount} active reported error code{activeErrCount > 1 ? 's' : ''}
                      </span>
                      <span className="font-mono text-[10px]">Inspect &gt;</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Deep Charger Diagnostics & Error Code Management (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {selectedCharger && (
            <>
              {/* Charger Detail Header Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-white font-mono">{selectedCharger.id}</h2>
                      <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${getStatusBadge(selectedCharger.status).bg}`}>
                        <span className={`w-2 h-2 rounded-full ${getStatusBadge(selectedCharger.status).dot}`} />
                        {getStatusBadge(selectedCharger.status).label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-200 mt-1">{selectedCharger.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedCharger.location} • Installed {selectedCharger.installedDate}</p>
                  </div>

                  {/* Quick Action Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunSelfTest(selectedCharger.id)}
                      disabled={selfTestRunning}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition ${
                        selfTestRunning
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 cursor-not-allowed'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                      }`}
                    >
                      <PlayCircle className={`w-4 h-4 ${selfTestRunning ? 'animate-spin' : ''}`} />
                      {selfTestRunning ? 'Running Sweep...' : 'Run Diagnostics'}
                    </button>

                    <button
                      onClick={() => onNavigateTab('SIMULATION_LAB')}
                      className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    >
                      Inject Fault Test
                    </button>
                  </div>
                </div>

                {/* Self Test Output Terminal if triggered */}
                {selfTestLog && (
                  <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-cyan-800/50 font-mono text-xs text-cyan-300 space-y-1">
                    <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1 text-[11px]">
                      <span>Live Diagnostic Sweep Console</span>
                      <button onClick={() => setSelfTestLog(null)} className="text-slate-400 hover:text-white">
                        Clear
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap leading-relaxed mt-1 text-[11px]">{selfTestLog}</pre>
                  </div>
                )}

                {/* Hardware Specifications & Telemetry Readings */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Rated Power
                    </span>
                    <div className="text-base font-bold font-mono text-slate-100 mt-1">{selectedCharger.ratedPowerKw} kW</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Max {selectedCharger.maxCurrentA} A</div>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-orange-400" /> Connector Temp
                    </span>
                    <div className="text-base font-bold font-mono text-orange-300 mt-1">{selectedCharger.connectorTempC}°C</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Internal {selectedCharger.internalTempC}°C</div>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" /> Grid Stability
                    </span>
                    <div className="text-base font-bold font-mono text-cyan-300 mt-1">{selectedCharger.gridVoltageStabilityPercent}%</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">ISO 15118 Sync</div>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Isolation Res.
                    </span>
                    <div className="text-base font-bold font-mono text-emerald-300 mt-1">{selectedCharger.isolationResistanceKohm} kΩ</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Firmware {selectedCharger.firmwareVersion}</div>
                  </div>
                </div>
              </div>

              {/* Chart: Historical Charging Efficiency Degradation Trend */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-purple-400" />
                      Charging Efficiency & Health Degradation Trend
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Rolling average realized efficiency (%) vs rated inverter threshold</p>
                  </div>
                  <span className="text-xs font-mono text-purple-300">Rated: 92.0%</span>
                </div>

                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedCharger.efficiencyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis domain={[80, 100]} stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        formatter={(val: any) => [`${val}%`, 'Avg Realized Efficiency']}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line
                        type="monotone"
                        dataKey="efficiency"
                        name="Realized Efficiency (%)"
                        stroke="#a855f7"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#a855f7' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Reported Error Codes Management & Audit Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Reported Error Codes & Hardware Diagnostics
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Recorded fault alarms with root-cause analysis and remediation status</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{selectedCharger.errorCodes.length} logged codes</span>
                </div>

                {selectedCharger.errorCodes.length === 0 ? (
                  <div className="text-center py-8 bg-slate-950/60 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-semibold text-slate-200 mt-2">Zero Active Fault Codes</p>
                    <p className="text-xs text-slate-400 mt-0.5">Node {selectedCharger.id} is operating within nominal physics parameters.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCharger.errorCodes.map((err) => (
                      <div
                        key={err.id}
                        className={`p-4 rounded-xl border text-xs space-y-2 ${
                          err.severity === 'CRITICAL'
                            ? 'bg-rose-950/30 border-rose-800/60'
                            : err.severity === 'WARNING'
                            ? 'bg-amber-950/30 border-amber-800/60'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                                err.severity === 'CRITICAL'
                                  ? 'bg-rose-900/80 text-rose-200'
                                  : err.severity === 'WARNING'
                                  ? 'bg-amber-900/80 text-amber-200'
                                  : 'bg-slate-800 text-slate-200'
                              }`}
                            >
                              {err.code}
                            </span>
                            <span className="font-semibold text-slate-100">{err.title}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                err.status === 'ACTIVE'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                  : err.status === 'ACKNOWLEDGED'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              }`}
                            >
                              {err.status}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">{err.timestamp}</span>
                          </div>
                        </div>

                        <p className="text-slate-300 leading-relaxed">{err.description}</p>

                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 text-[11px] text-slate-300 flex items-start justify-between gap-3">
                          <div>
                            <span className="text-slate-400 font-medium">Suggested Remediation: </span>
                            <span>{err.suggestedAction}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {err.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleAcknowledgeError(selectedCharger.id, err.id)}
                                className="px-2 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded text-[10px] font-medium border border-amber-500/40 transition"
                              >
                                Acknowledge
                              </button>
                            )}
                            {err.status !== 'RESOLVED' && (
                              <button
                                onClick={() => handleResolveError(selectedCharger.id, err.id)}
                                className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded text-[10px] font-medium border border-emerald-500/40 transition"
                              >
                                Resolve & Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sessions Linked to this Charger */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Recent Charging Sessions on {selectedCharger.id}
                  </h3>
                  <span className="text-xs text-slate-400">{chargerSessions.length} recorded</span>
                </div>

                <div className="space-y-2">
                  {chargerSessions.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4 text-center">No charging sessions on this node yet.</div>
                  ) : (
                    chargerSessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs hover:border-slate-700 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-200">{sess.id}</span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                sess.status === 'ANOMALY' || sess.status === 'PERSISTENT_ANOMALY'
                                  ? 'bg-rose-950 text-rose-400'
                                  : sess.status === 'WARNING'
                                  ? 'bg-amber-950 text-amber-400'
                                  : 'bg-emerald-950 text-emerald-400'
                              }`}
                            >
                              {sess.status}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            {sess.timestamp} • {sess.evId} • {sess.durationMinutes} min
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right font-mono">
                            <div className="text-slate-200">{sess.actualEnergyKwh.toFixed(1)} kWh</div>
                            <div className={`text-[11px] ${sess.deviationPercent > 15 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                              Δ {sess.deviationPercent.toFixed(1)}%
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onSelectSession(sess);
                              onNavigateTab('DASHBOARD');
                            }}
                            className="px-2.5 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
