import React from 'react';
import {
  ChargingTelemetryPoint,
  PhysicalParameters,
  ThresholdSettings,
  AnomalyStatus,
} from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Zap,
  AlertTriangle,
  Flame,
  Layers,
  ShieldCheck,
  FlaskConical,
  Gauge,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface SimulationLabTabProps {
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onResetSimulation: () => void;
  onStepSimulation: () => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  currentPointIndex: number;
  telemetryPoints: ChargingTelemetryPoint[];
  params: PhysicalParameters;
  thresholds: ThresholdSettings;
  activeFaultType: string;
  onInjectFault: (fault: 'NONE' | 'WARNING_LOSS' | 'ANOMALY_LEAKAGE' | 'SUDDEN_SPIKE' | 'CV_FAULT' | 'PERSISTENT') => void;
}

export const SimulationLabTab: React.FC<SimulationLabTabProps> = ({
  isSimulating,
  onToggleSimulate,
  onResetSimulation,
  onStepSimulation,
  playbackSpeed,
  setPlaybackSpeed,
  currentPointIndex,
  telemetryPoints,
  params,
  thresholds,
  activeFaultType,
  onInjectFault,
}) => {
  const currentPoint = telemetryPoints[currentPointIndex] || telemetryPoints[0];
  const progressPercent = telemetryPoints.length > 0
    ? Math.round(((currentPointIndex + 1) / telemetryPoints.length) * 100)
    : 0;

  // Comparison metrics for "Show exactly what changed"
  const expectedEnergy = currentPoint?.expectedEnergyKwh ?? 0;
  const actualEnergy = currentPoint?.actualEnergyKwh ?? 0;
  const residual = currentPoint?.residualKwh ?? 0;
  const deviation = currentPoint?.deviationPercent ?? 0;
  const status: AnomalyStatus = currentPoint?.status ?? 'NORMAL';

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Digital Twin Simulation Laboratory</h2>
              <p className="text-xs text-slate-400">
                Interactive real-time charging testbed with live parameter perturbation & fault injection
              </p>
            </div>
          </div>

          {/* Simulation Primary Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSimulate}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs transition shadow-md ${
                isSimulating
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                  : 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 shadow-cyan-500/20'
              }`}
            >
              {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isSimulating ? 'Pause Simulation' : 'Start Simulation'}</span>
            </button>

            <button
              onClick={onStepSimulation}
              disabled={isSimulating || currentPointIndex >= telemetryPoints.length - 1}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 font-medium transition"
              title="Step 1 interval forward"
            >
              <SkipForward className="w-4 h-4" />
              <span>Step</span>
            </button>

            <button
              onClick={onResetSimulation}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 font-medium transition"
              title="Reset to 0% progress"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Playback Progress & Speed Slider */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 items-center">
          <div className="md:col-span-2 space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">
                Simulation Step: <strong className="text-cyan-400">{currentPointIndex + 1}</strong> / {telemetryPoints.length}
              </span>
              <span className="text-slate-400">
                Elapsed: <strong className="text-slate-200">{Math.round((currentPoint?.timeSeconds || 0) / 60)} min</strong> ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 text-xs">
            <span className="text-slate-400 font-medium">Speed:</span>
            {[1, 2, 5, 10].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded font-mono transition ${
                  playbackSpeed === spd
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fault Injection Control Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Live Scenario & Anomaly Injection Triggers
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Perturb digital twin parameters in real-time to demonstrate anomaly detection without physical hardware
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Button 1: Normal Session */}
          <button
            onClick={() => onInjectFault('NONE')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeFaultType === 'NONE'
                ? 'bg-emerald-950/50 border-emerald-500/60 ring-1 ring-emerald-500/40'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Generate Normal Session
              </span>
              <span className="text-[10px] font-mono text-emerald-400/80">&lt;5% Dev</span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Simulates calibrated nominal energy flow with mild ±1.2% stochastic measurement noise.
            </p>
          </button>

          {/* Button 2: Generate Warning */}
          <button
            onClick={() => onInjectFault('WARNING_LOSS')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeFaultType === 'WARNING_LOSS'
                ? 'bg-amber-950/50 border-amber-500/60 ring-1 ring-amber-500/40'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Generate Warning Level
              </span>
              <span className="text-[10px] font-mono text-amber-400/80">~10% Dev</span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Injects moderate thermal loss / mild inverter degradation entering the 5–15% warning tolerance band.
            </p>
          </button>

          {/* Button 3: Inject Anomaly */}
          <button
            onClick={() => onInjectFault('ANOMALY_LEAKAGE')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeFaultType === 'ANOMALY_LEAKAGE'
                ? 'bg-rose-950/50 border-rose-500/60 ring-1 ring-rose-500/40'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Inject Anomaly (Overconsumption)
              </span>
              <span className="text-[10px] font-mono text-rose-400/80">&gt;25% Dev</span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Simulates severe power electronic inverter loss or unmetered shunt draw (+28% grid consumption).
            </p>
          </button>

          {/* Button 4: Inject Sudden Spike */}
          <button
            onClick={() => onInjectFault('SUDDEN_SPIKE')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeFaultType === 'SUDDEN_SPIKE'
                ? 'bg-purple-950/50 border-purple-500/60 ring-1 ring-purple-500/40'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> Inject Sudden Transient Spike
              </span>
              <span className="text-[10px] font-mono text-purple-300/80">+75% Step Surge</span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Injects sudden transient auxiliary chiller spike or CT sensor step glitch between intervals.
            </p>
          </button>

          {/* Button 5: Persistent Anomaly */}
          <button
            onClick={() => onInjectFault('PERSISTENT')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeFaultType === 'PERSISTENT'
                ? 'bg-red-950/50 border-red-500/60 ring-1 ring-red-500/40'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Generate Persistent Anomaly
              </span>
              <span className="text-[10px] font-mono text-red-400/80">3+ Cycles</span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Simulates repeated charger station component degradation requiring physical technician dispatch.
            </p>
          </button>

          {/* Button 6: CV Phase Regulation Anomaly */}
          <button
            onClick={() => onInjectFault('CV_FAULT')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeFaultType === 'CV_FAULT'
                ? 'bg-cyan-950/50 border-cyan-500/60 ring-1 ring-cyan-500/40'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" /> CV Taper Regulation Anomaly
              </span>
              <span className="text-[10px] font-mono text-cyan-400/80">SOC &gt; 80%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Simulates failure of the charger/BMS to properly taper down power during Constant Voltage phase.
            </p>
          </button>
        </div>
      </div>

      {/* "Show Exactly What Changed" Forensic Delta Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Live Delta Inspector — Exactly What Changed
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Current Fault: {activeFaultType}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">Expected Energy</div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{expectedEnergy.toFixed(2)} kWh</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Model digital twin prediction</div>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">Actual Metered Energy</div>
            <div className="text-xl font-bold font-mono text-slate-100 mt-1">{actualEnergy.toFixed(2)} kWh</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Measured grid input</div>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">Deviation Percentage</div>
            <div className={`text-xl font-bold font-mono mt-1 ${deviation > 15 ? 'text-rose-400' : deviation >= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
              Δ {deviation.toFixed(2)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Residual: {residual > 0 ? '+' : ''}{residual.toFixed(2)} kWh
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            status === 'ANOMALY' || status === 'PERSISTENT_ANOMALY'
              ? 'bg-rose-950/80 border-rose-800/80 text-rose-300'
              : status === 'WARNING'
              ? 'bg-amber-950/80 border-amber-800/80 text-amber-300'
              : status === 'SUDDEN_SPIKE'
              ? 'bg-purple-950/80 border-purple-800/80 text-purple-300'
              : 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300'
          }`}>
            <div className="text-xs font-semibold uppercase tracking-wider">Classification Status</div>
            <div className="text-base font-bold font-mono mt-1">{status}</div>
            <div className="text-[11px] opacity-80 mt-0.5">
              {status === 'ANOMALY'
                ? 'Action: Flag session for review'
                : status === 'WARNING'
                ? 'Action: Monitor subsequent cycles'
                : status === 'SUDDEN_SPIKE'
                ? 'Action: Inspect telemetry rate'
                : 'Action: Nominal baseline operation'}
            </div>
          </div>
        </div>

        {/* Injected Fault Annotation */}
        {currentPoint?.injectedFault && (
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              <strong>Active Injected Condition:</strong> {currentPoint.injectedFault}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
