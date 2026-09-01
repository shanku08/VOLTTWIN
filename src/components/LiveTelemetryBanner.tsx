import React from 'react';
import {
  ChargingTelemetryPoint,
  PhysicalParameters,
  AnomalyStatus,
  ChargingSession,
  ArduinoConnectionState,
  SerialTelemetryPacket,
} from '../types';
import { BatteryCharging, Zap, Gauge, AlertTriangle, ShieldCheck, Flame, Layers } from 'lucide-react';

interface LiveTelemetryBannerProps {
  currentPoint?: ChargingTelemetryPoint;
  params?: PhysicalParameters;
  status?: AnomalyStatus;
  isSimulating?: boolean;
  session?: ChargingSession;
  latestSerialPacket?: SerialTelemetryPacket | null;
  arduinoState?: ArduinoConnectionState;
}

export const LiveTelemetryBanner: React.FC<LiveTelemetryBannerProps> = ({
  currentPoint,
  params,
  status,
  isSimulating = false,
  session,
  latestSerialPacket,
  arduinoState,
}) => {
  // Extract parameters with safe cascading fallbacks
  const chargerId = params?.chargerId ?? session?.chargerId ?? 'CHG-NODE-01';
  const evId = params?.evId ?? session?.evId ?? 'EV-UNKNOWN';
  const batteryCap = params?.batteryCapacityKwh ?? session?.batteryCapacityKwh ?? 60.0;
  const initialSoc = params?.initialSoc ?? session?.initialSoc ?? 20.0;
  const targetSoc = params?.targetSoc ?? session?.targetSoc ?? 80.0;
  const chargingPower = params?.chargingPowerKw ?? session?.chargingPowerKw ?? 50.0;

  const currentStatus: AnomalyStatus =
    status ?? session?.status ?? (currentPoint?.status as AnomalyStatus) ?? 'NORMAL';

  const expectedEnergy =
    currentPoint?.expectedEnergyKwh ??
    session?.expectedEnergyKwh ??
    0;

  const actualEnergy =
    latestSerialPacket?.actualEnergyKwh ??
    currentPoint?.actualEnergyKwh ??
    session?.actualEnergyKwh ??
    0;

  const soc =
    currentPoint?.soc ??
    (batteryCap > 0
      ? Math.min(100, Math.max(0, initialSoc + (actualEnergy / batteryCap) * 100 * (params?.chargingEfficiency ? params.chargingEfficiency / 100 : 0.9)))
      : initialSoc);

  const power =
    latestSerialPacket?.powerKw ??
    currentPoint?.actualPowerKw ??
    chargingPower;

  const residual =
    currentPoint?.residualKwh ??
    session?.residualKwh ??
    (actualEnergy - expectedEnergy);

  const deviation =
    currentPoint?.deviationPercent ??
    session?.deviationPercent ??
    (expectedEnergy > 0 ? (Math.abs(actualEnergy - expectedEnergy) / expectedEnergy) * 100 : 0);

  const getStatusBadge = (st: AnomalyStatus) => {
    switch (st) {
      case 'NORMAL':
        return {
          bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400',
          icon: ShieldCheck,
          label: 'NORMAL BEHAVIOUR',
          desc: 'Deviation < 5.0% (calibrated baseline)',
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-950/60 border-amber-500/40 text-amber-400',
          icon: AlertTriangle,
          label: 'WARNING: DEVIATION',
          desc: '5.0% - 15.0% tolerance threshold',
        };
      case 'ANOMALY':
        return {
          bg: 'bg-rose-950/80 border-rose-500/60 text-rose-400 animate-pulse',
          icon: AlertTriangle,
          label: 'ANOMALY DETECTED',
          desc: 'Deviation > 15.0% (significant over-consumption)',
        };
      case 'SUDDEN_SPIKE':
        return {
          bg: 'bg-purple-950/80 border-purple-500/60 text-purple-300 animate-pulse',
          icon: Flame,
          label: 'SUDDEN POWER SPIKE',
          desc: 'Transient step surge detected in telemetry',
        };
      case 'PERSISTENT_ANOMALY':
        return {
          bg: 'bg-red-950/90 border-red-500/80 text-red-300 ring-1 ring-red-500',
          icon: Layers,
          label: 'PERSISTENT ABNORMAL BEHAVIOUR',
          desc: 'Repeated anomaly over consecutive sessions',
        };
      default:
        return {
          bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400',
          icon: ShieldCheck,
          label: 'NORMAL BEHAVIOUR',
          desc: 'Deviation within nominal bounds',
        };
    }
  };

  const badge = getStatusBadge(currentStatus);
  const StatusIcon = badge.icon;

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-5">
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Hardware Node Card */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Hardware Node</span>
            <span className="font-mono text-cyan-400">{chargerId}</span>
          </div>
          <div className="mt-1.5">
            <div className="text-sm font-semibold text-slate-100 truncate">{evId}</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">Cap: {batteryCap} kWh</div>
          </div>
        </div>

        {/* Battery SOC Card */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <BatteryCharging className="w-3.5 h-3.5 text-cyan-400" /> SOC
            </span>
            <span className="text-xs text-slate-400">Target: {targetSoc}%</span>
          </div>
          <div className="mt-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-cyan-300">{soc.toFixed(1)}%</span>
              <span className="text-xs text-slate-400 font-mono">Init: {initialSoc}%</span>
            </div>
            <div className="w-full bg-slate-700/80 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, soc))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active Charging Power */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Active Power
            </span>
            <span className="text-xs text-slate-400">Grid DC</span>
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-bold font-mono text-amber-300">{power.toFixed(1)} <span className="text-xs font-normal text-slate-400">kW</span></div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">Rating: {chargingPower} kW</div>
          </div>
        </div>

        {/* Expected vs Actual Energy */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Energy Required</span>
            <span className="text-xs text-slate-400">E_exp vs E_act</span>
          </div>
          <div className="mt-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400 font-mono">Exp:</span>
              <span className="text-xs font-mono text-cyan-400 font-semibold">{expectedEnergy.toFixed(2)} kWh</span>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-xs text-slate-400 font-mono">Act:</span>
              <span className="text-sm font-mono text-slate-100 font-bold">{actualEnergy.toFixed(2)} kWh</span>
            </div>
          </div>
        </div>

        {/* Residual & Deviation */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-rose-400" /> Residual
            </span>
            <span className="text-xs text-slate-400">Deviation</span>
          </div>
          <div className="mt-1.5">
            <div className="text-base font-bold font-mono text-slate-100">
              {residual > 0 ? '+' : ''}{residual.toFixed(2)} <span className="text-xs font-normal text-slate-400">kWh</span>
            </div>
            <div className={`text-xs font-mono font-bold mt-0.5 ${deviation > 15 ? 'text-rose-400' : deviation >= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
              Δ {deviation.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Anomaly Decision Banner (spans 2 cols on lg) */}
        <div className={`col-span-2 sm:col-span-1 lg:col-span-2 border rounded-xl p-3 flex items-center gap-3 ${badge.bg}`}>
          <div className="p-2 rounded-lg bg-slate-950/60 border border-current/20 shrink-0">
            <StatusIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold tracking-wide uppercase">{badge.label}</div>
            <div className="text-xs opacity-85 truncate mt-0.5">{badge.desc}</div>
            <div className="text-[11px] font-mono opacity-70 mt-1">
              {arduinoState?.isConnected
                ? arduinoState.isVirtual
                  ? '● Virtual Arduino Stream (1 Hz)'
                  : '● Physical Hardware Active'
                : isSimulating
                ? '● Telemetry Ingesting...'
                : '⏸ Simulation Ready'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
