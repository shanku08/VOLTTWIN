import React, { useState } from 'react';
import {
  ChargingSession,
  ThresholdSettings,
  ForensicExplanation,
  AnomalyStatus,
} from '../types';
import {
  detectSuddenSpike,
  detectPersistentAnomaly,
  generateForensicExplanation,
} from '../core/anomalyDetection';
import {
  AlertTriangle,
  ShieldCheck,
  Flame,
  Layers,
  TrendingDown,
  Info,
  CheckCircle2,
  Sliders,
  Filter,
} from 'lucide-react';

interface AnomalyAnalyticsTabProps {
  sessions: ChargingSession[];
  activeSession: ChargingSession;
  thresholds: ThresholdSettings;
  onSelectSession: (session: ChargingSession) => void;
}

export const AnomalyAnalyticsTab: React.FC<AnomalyAnalyticsTabProps> = ({
  sessions,
  activeSession,
  thresholds,
  onSelectSession,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Multi-session analytics
  const filteredSessions = sessions.filter((s) => {
    if (filterStatus === 'ALL') return true;
    return s.status === filterStatus;
  });

  const totalSessions = sessions.length;
  const normalCount = sessions.filter((s) => s.status === 'NORMAL').length;
  const warningCount = sessions.filter((s) => s.status === 'WARNING').length;
  const anomalyCount = sessions.filter((s) => s.status === 'ANOMALY' || s.status === 'PERSISTENT_ANOMALY').length;
  const spikeCount = sessions.filter((s) => s.status === 'SUDDEN_SPIKE').length;

  // Active session spike & persistent checks
  const powerSeries = activeSession.telemetryPoints.map((p) => p.actualPowerKw);
  const spikeResult = detectSuddenSpike(powerSeries, thresholds.spikeDeltaThresholdKw);
  const persistentResult = detectPersistentAnomaly(sessions, activeSession.chargerId, thresholds);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Normal Baseline</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">{normalCount}</div>
          <div className="text-xs text-slate-400 mt-1">{((normalCount / (totalSessions || 1)) * 100).toFixed(1)}% of total sessions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Warning Level</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">{warningCount}</div>
          <div className="text-xs text-slate-400 mt-1">5% – 15% deviation band</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Critical Anomalies</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">{anomalyCount}</div>
          <div className="text-xs text-slate-400 mt-1">&gt;15% physics deviation</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Sudden Spikes</span>
            <Flame className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-purple-300">{spikeCount}</div>
          <div className="text-xs text-slate-400 mt-1">Transient step shifts &ge;{thresholds.spikeDeltaThresholdKw} kW</div>
        </div>
      </div>

      {/* Selected Session Deep Diagnostic Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              activeSession.status === 'ANOMALY' || activeSession.status === 'PERSISTENT_ANOMALY'
                ? 'bg-rose-950/80 border-rose-800/60 text-rose-400'
                : activeSession.status === 'WARNING'
                ? 'bg-amber-950/80 border-amber-800/60 text-amber-400'
                : activeSession.status === 'SUDDEN_SPIKE'
                ? 'bg-purple-950/80 border-purple-800/60 text-purple-300'
                : 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">Deep Diagnostic Inspector: {activeSession.id}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">
                  {activeSession.chargerId}
                </span>
              </div>
              <p className="text-xs text-slate-400">Recorded on {activeSession.timestamp} | EV: {activeSession.evId}</p>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
              activeSession.status === 'ANOMALY' || activeSession.status === 'PERSISTENT_ANOMALY'
                ? 'bg-rose-950 text-rose-400 border-rose-800/80'
                : activeSession.status === 'WARNING'
                ? 'bg-amber-950 text-amber-400 border-amber-800/80'
                : activeSession.status === 'SUDDEN_SPIKE'
                ? 'bg-purple-950 text-purple-300 border-purple-800/80'
                : 'bg-emerald-950 text-emerald-400 border-emerald-800/80'
            }`}>
              {activeSession.status}
            </span>
          </div>
        </div>

        {/* 3 Forensic Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Pillar 1: Metrics & Deviation */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Quantitative Residual Metrics
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Expected Energy:</span>
                <span className="text-cyan-400 font-bold">{activeSession.expectedEnergyKwh.toFixed(2)} kWh</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Actual Metered Energy:</span>
                <span className="text-slate-100 font-bold">{activeSession.actualEnergyKwh.toFixed(2)} kWh</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Energy Residual (ΔE):</span>
                <span className="text-purple-400 font-bold">
                  {activeSession.residualKwh > 0 ? '+' : ''}{activeSession.residualKwh.toFixed(2)} kWh
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Deviation Percentage:</span>
                <span className={`font-bold ${activeSession.deviationPercent > 15 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {activeSession.deviationPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Pillar 2: Spike & Persistent Analysis */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" /> Multi-Factor Checks
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex justify-between font-semibold text-slate-300">
                  <span>Sudden Power Surge:</span>
                  <span className={spikeResult.hasSpike ? 'text-purple-400 font-bold' : 'text-slate-400'}>
                    {spikeResult.hasSpike ? `DETECTED (Max Δ ${spikeResult.maxDeltaKw} kW)` : 'Normal (No step spike)'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex justify-between font-semibold text-slate-300">
                  <span>Persistent Anomaly Track:</span>
                  <span className={persistentResult.isPersistent ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    {persistentResult.isPersistent ? `FLAGGED (${persistentResult.consecutiveCount} sessions)` : 'Normal history'}
                  </span>
                </div>
                {persistentResult.isPersistent && (
                  <div className="text-[11px] text-rose-300/90 mt-1">
                    Charger node {activeSession.chargerId} shows repeated deviation (avg {persistentResult.averageDeviation}%).
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pillar 3: Efficiency Degradation Estimate */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Efficiency Loss Estimation
            </div>
            <div className="space-y-1 text-xs">
              <div className="text-slate-400">
                Rated Inverter Efficiency: <strong className="text-slate-200 font-mono">{activeSession.chargingEfficiency}%</strong>
              </div>
              <div className="text-slate-400">
                Estimated Realized Efficiency:{' '}
                <strong className="text-purple-300 font-mono">
                  {((activeSession.expectedEnergyKwh * (activeSession.chargingEfficiency / 100)) / (activeSession.actualEnergyKwh || 1) * 100).toFixed(1)}%
                </strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 mt-2">
                Estimated efficiency degradation:{' '}
                <span className="font-bold text-amber-300 font-mono">
                  {activeSession.explanation.estimatedEfficiencyDegradation || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Explainability Hypotheses Box */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <Info className="w-4 h-4" /> Explainable Engineering Hypotheses (Non-Accusatory)
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {activeSession.explanation.summary}
          </p>

          <div>
            <span className="text-xs text-slate-400 font-medium">Possible Physical Factors:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
              {activeSession.explanation.possibleCauses.map((cause, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <span>{cause}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-300">
            <span className="text-slate-400 font-medium">Recommended Operator Action: </span>
            <span className="font-semibold text-slate-100">{activeSession.explanation.recommendedAction}</span>
          </div>
        </div>
      </div>

      {/* Filterable Anomaly Event Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              Energy Anomaly Audit Log
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Historical event logs classified by physics residual criteria</p>
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {['ALL', 'ANOMALY', 'PERSISTENT_ANOMALY', 'SUDDEN_SPIKE', 'WARNING', 'NORMAL'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-md transition font-mono ${
                  filterStatus === st
                    ? 'bg-slate-800 text-cyan-300 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Session ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Node / Charger</th>
                <th className="py-2.5 px-3">Expected (kWh)</th>
                <th className="py-2.5 px-3">Actual (kWh)</th>
                <th className="py-2.5 px-3">Residual (kWh)</th>
                <th className="py-2.5 px-3">Deviation (%)</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredSessions.map((s) => {
                const isSelected = s.id === activeSession.id;
                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-800/40 transition ${
                      isSelected ? 'bg-cyan-950/30' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-200">{s.id}</td>
                    <td className="py-2.5 px-3 text-slate-400">{s.timestamp}</td>
                    <td className="py-2.5 px-3 text-cyan-300">{s.chargerId}</td>
                    <td className="py-2.5 px-3 text-slate-300">{s.expectedEnergyKwh.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-100 font-bold">{s.actualEnergyKwh.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-purple-300">
                      {s.residualKwh > 0 ? '+' : ''}{s.residualKwh.toFixed(2)}
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${s.deviationPercent > 15 ? 'text-rose-400' : s.deviationPercent >= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {s.deviationPercent.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${
                        s.status === 'ANOMALY' || s.status === 'PERSISTENT_ANOMALY'
                          ? 'bg-rose-950 text-rose-400 border-rose-800/60'
                          : s.status === 'WARNING'
                          ? 'bg-amber-950 text-amber-400 border-amber-800/60'
                          : s.status === 'SUDDEN_SPIKE'
                          ? 'bg-purple-950 text-purple-300 border-purple-800/60'
                          : 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectSession(s)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2"
                      >
                        Inspect
                      </button>
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
