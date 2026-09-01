import React from 'react';
import { PhysicalParameters } from '../types';
import {
  calculateBatteryEnergy,
  calculateExpectedGridEnergy,
  calculateEnergyResidual,
  calculateDeviationPercent,
  calculateTemperatureThermalFactor,
  estimateRealizedEfficiency,
} from '../core/digitalTwin';
import { Cpu, Zap, Battery, Thermometer, ShieldAlert, ArrowRight, Gauge, Layers } from 'lucide-react';

interface DigitalTwinTabProps {
  params: PhysicalParameters;
  onUpdateParams: (newParams: Partial<PhysicalParameters>) => void;
  actualEnergyInput: number;
  setActualEnergyInput: (val: number) => void;
}

export const DigitalTwinTab: React.FC<DigitalTwinTabProps> = ({
  params,
  onUpdateParams,
  actualEnergyInput,
  setActualEnergyInput,
}) => {
  const {
    batteryCapacityKwh,
    initialSoc,
    targetSoc,
    chargingEfficiency,
    chargingPowerKw,
    ambientTemperatureC = 25,
    chargerId,
    evId,
    sessionId,
  } = params;

  // Real-time Physics calculations
  const batteryEnergyKwh = calculateBatteryEnergy(batteryCapacityKwh, initialSoc, targetSoc);
  const expectedGridEnergyKwh = calculateExpectedGridEnergy(batteryEnergyKwh, chargingEfficiency);
  const residualKwh = calculateEnergyResidual(actualEnergyInput, expectedGridEnergyKwh);
  const deviationPercent = calculateDeviationPercent(actualEnergyInput, expectedGridEnergyKwh);
  const realizedEfficiency = estimateRealizedEfficiency(batteryEnergyKwh, actualEnergyInput);
  const thermalFactors = calculateTemperatureThermalFactor(ambientTemperatureC);

  const deltaSoc = Math.max(0, targetSoc - initialSoc);
  const estimatedDurationMinutes = chargingPowerKw > 0
    ? Math.round((expectedGridEnergyKwh / chargingPowerKw) * 60)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Physics-Informed Digital Twin Charging Model</h2>
              <p className="text-xs text-slate-400">First-principles conservation of energy equations and real-time loss modeling</p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-300">
            Node: {chargerId} | Session: {sessionId}
          </span>
        </div>
      </div>

      {/* Interactive Physics Schematic & Energy Flow Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Digital Twin Physical Energy Architecture
          </h3>
          <span className="text-xs text-slate-400 font-mono">Realized η: {realizedEfficiency.toFixed(1)}%</span>
        </div>

        {/* Multi-stage flow schematic */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 py-2">
          {/* Stage 1: Grid Input */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">1. Grid Supply</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold font-mono text-amber-300">{actualEnergyInput.toFixed(2)} <span className="text-xs font-normal text-slate-400">kWh</span></div>
              <div className="text-xs text-slate-400 mt-1 font-mono">Actual Delivered (E_actual)</div>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between">
              <span>Nominal Power:</span>
              <span className="font-mono text-slate-200">{chargingPowerKw} kW</span>
            </div>
          </div>

          {/* Stage 2: Power Electronics & Inverter */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 relative">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">2. Charger Inverter</span>
              <Gauge className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold font-mono text-purple-300">{chargingEfficiency.toFixed(1)}% <span className="text-xs font-normal text-slate-400">Rated η</span></div>
              <div className="text-xs text-slate-400 mt-1 font-mono">Expected: {expectedGridEnergyKwh.toFixed(2)} kWh</div>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between">
              <span>Conversion Loss:</span>
              <span className="font-mono text-slate-200">{(expectedGridEnergyKwh - batteryEnergyKwh).toFixed(2)} kWh</span>
            </div>
          </div>

          {/* Stage 3: Battery Pack Ingestion */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 relative">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">3. Battery Pack</span>
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold font-mono text-emerald-300">{batteryEnergyKwh.toFixed(2)} <span className="text-xs font-normal text-slate-400">kWh</span></div>
              <div className="text-xs text-slate-400 mt-1 font-mono">E_battery Required</div>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between">
              <span>Δ SOC (+{deltaSoc}%):</span>
              <span className="font-mono text-slate-200">{initialSoc}% → {targetSoc}%</span>
            </div>
          </div>

          {/* Stage 4: Residual Energy & Thermal */}
          <div className={`border rounded-xl p-4 relative ${
            deviationPercent > 15
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              : deviationPercent >= 5
              ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
              : 'bg-slate-950/80 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">4. Energy Residual</span>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold font-mono">
                {residualKwh > 0 ? '+' : ''}{residualKwh.toFixed(2)} <span className="text-xs font-normal">kWh</span>
              </div>
              <div className="text-xs mt-1 font-mono">Deviation: {deviationPercent.toFixed(2)}%</div>
            </div>
            <div className="mt-3 text-[11px] border-t border-current/20 pt-2 flex justify-between">
              <span>Ambient Temp:</span>
              <span className="font-mono">{ambientTemperatureC}°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Physical Parameter Controls vs Mathematical Derivations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Configurable Model Inputs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              Digital Twin Input Parameters
            </h3>
            <span className="text-xs text-slate-400">Validated physical constraints</span>
          </div>

          {/* Battery Capacity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 font-medium">Battery Capacity (kWh)</label>
              <span className="font-mono text-cyan-400 font-semibold">{batteryCapacityKwh} kWh</span>
            </div>
            <input
              type="range"
              min="20"
              max="150"
              step="1"
              value={batteryCapacityKwh}
              onChange={(e) => onUpdateParams({ batteryCapacityKwh: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>20 kWh (City Car)</span>
              <span>75 kWh (Standard)</span>
              <span>150 kWh (Heavy Duty)</span>
            </div>
          </div>

          {/* SOC Range Controls */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300">Initial SOC (%)</label>
                <span className="font-mono text-cyan-400 font-semibold">{initialSoc}%</span>
              </div>
              <input
                type="number"
                min="0"
                max="99"
                value={initialSoc}
                onChange={(e) => {
                  const val = Math.min(targetSoc - 1, Math.max(0, parseFloat(e.target.value) || 0));
                  onUpdateParams({ initialSoc: val });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300">Target SOC (%)</label>
                <span className="font-mono text-emerald-400 font-semibold">{targetSoc}%</span>
              </div>
              <input
                type="number"
                min="1"
                max="100"
                value={targetSoc}
                onChange={(e) => {
                  const val = Math.max(initialSoc + 1, Math.min(100, parseFloat(e.target.value) || 100));
                  onUpdateParams({ targetSoc: val });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Charging Efficiency & Power */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300">Charging Efficiency (%)</label>
                <span className="font-mono text-purple-400 font-semibold">{chargingEfficiency}%</span>
              </div>
              <input
                type="number"
                min="60"
                max="99"
                step="0.5"
                value={chargingEfficiency}
                onChange={(e) => onUpdateParams({ chargingEfficiency: parseFloat(e.target.value) || 90 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300">Charging Power (kW)</label>
                <span className="font-mono text-amber-400 font-semibold">{chargingPowerKw} kW</span>
              </div>
              <input
                type="number"
                min="3"
                max="350"
                value={chargingPowerKw}
                onChange={(e) => onUpdateParams({ chargingPowerKw: parseFloat(e.target.value) || 50 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Ambient Temperature */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-orange-400" /> Ambient Temperature (°C)
              </label>
              <span className="font-mono text-orange-400 font-semibold">{ambientTemperatureC}°C</span>
            </div>
            <input
              type="range"
              min="-15"
              max="50"
              step="1"
              value={ambientTemperatureC}
              onChange={(e) => onUpdateParams({ ambientTemperatureC: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-400"
            />
            <div className="text-[11px] text-slate-400 mt-1">
              Thermal impact: {thermalFactors.description}
            </div>
          </div>

          {/* Actual Measured Energy Input */}
          <div className="space-y-1.5 pt-3 border-t border-slate-800">
            <div className="flex justify-between text-xs">
              <label className="text-slate-200 font-semibold">Simulated / Actual Metered Energy (kWh)</label>
              <span className="font-mono text-slate-100 font-bold">{actualEnergyInput.toFixed(2)} kWh</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="300"
                step="0.1"
                value={actualEnergyInput}
                onChange={(e) => setActualEnergyInput(parseFloat(e.target.value) || 0)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => setActualEnergyInput(parseFloat(expectedGridEnergyKwh.toFixed(2)))}
                className="px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg border border-slate-700 font-medium transition"
              >
                Match Expected
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Mathematical Derivations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Live Equation Solvers & Unit Calculations
            </h3>
            <span className="text-xs text-slate-400 font-mono">SI & Engineering Units</span>
          </div>

          {/* Equation 1: Battery Energy Required */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">1. Battery Energy Required (E_battery)</span>
              <span className="font-mono text-emerald-400 font-bold">{batteryEnergyKwh.toFixed(2)} kWh</span>
            </div>
            <div className="text-xs font-mono text-cyan-300/90">
              E_battery = Battery Capacity × (Target SOC − Initial SOC) / 100
            </div>
            <div className="text-xs font-mono text-slate-400">
              = {batteryCapacityKwh} kWh × ({targetSoc}% − {initialSoc}%) / 100 = <strong className="text-slate-100">{batteryEnergyKwh.toFixed(3)} kWh</strong>
            </div>
          </div>

          {/* Equation 2: Expected Grid Energy */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">2. Expected Grid Energy (E_expected)</span>
              <span className="font-mono text-cyan-400 font-bold">{expectedGridEnergyKwh.toFixed(2)} kWh</span>
            </div>
            <div className="text-xs font-mono text-cyan-300/90">
              E_expected = E_battery / (Charging Efficiency / 100)
            </div>
            <div className="text-xs font-mono text-slate-400">
              = {batteryEnergyKwh.toFixed(2)} kWh / ({chargingEfficiency}% / 100) = <strong className="text-slate-100">{expectedGridEnergyKwh.toFixed(3)} kWh</strong>
            </div>
          </div>

          {/* Equation 3: Energy Residual */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">3. Energy Residual</span>
              <span className="font-mono text-purple-400 font-bold">{residualKwh > 0 ? '+' : ''}{residualKwh.toFixed(2)} kWh</span>
            </div>
            <div className="text-xs font-mono text-cyan-300/90">
              Residual = E_actual − E_expected
            </div>
            <div className="text-xs font-mono text-slate-400">
              = {actualEnergyInput.toFixed(2)} kWh − {expectedGridEnergyKwh.toFixed(2)} kWh = <strong className="text-slate-100">{residualKwh.toFixed(3)} kWh</strong>
            </div>
          </div>

          {/* Equation 4: Deviation Percentage */}
          <div className={`p-3.5 rounded-xl border space-y-1.5 ${
            deviationPercent > 15
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              : deviationPercent >= 5
              ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
              : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">4. Deviation Percentage</span>
              <span className="font-mono font-bold text-sm">Δ {deviationPercent.toFixed(2)}%</span>
            </div>
            <div className="text-xs font-mono opacity-90">
              Deviation (%) = |E_actual − E_expected| / E_expected × 100
            </div>
            <div className="text-xs font-mono opacity-80">
              = |{actualEnergyInput.toFixed(2)} − {expectedGridEnergyKwh.toFixed(2)}| / {expectedGridEnergyKwh.toFixed(2)} × 100 = <strong>{deviationPercent.toFixed(2)}%</strong>
            </div>
          </div>

          {/* Charging Time Estimate */}
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-300">Theoretical Duration at {chargingPowerKw} kW:</span>
            <span className="font-mono text-slate-100 font-semibold">~{estimatedDurationMinutes} minutes ({Math.round(estimatedDurationMinutes * 60)} s)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
