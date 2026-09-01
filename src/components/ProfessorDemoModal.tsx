import React, { useState } from 'react';
import { ChargingSession } from '../types';
import {
  PlaySquare,
  X,
  Sparkles,
  Zap,
  AlertTriangle,
  Flame,
  Gauge,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Layers,
  Activity,
  Code2,
} from 'lucide-react';

interface ScenarioPreset {
  id: string;
  title: string;
  vehicle: string;
  charger: string;
  type: 'NORMAL' | 'WARNING' | 'ANOMALY' | 'SUDDEN_SPIKE' | 'PERSISTENT_ANOMALY';
  badgeColor: string;
  badgeText: string;
  batteryCapacity: number;
  initialSoc: number;
  targetSoc: number;
  powerKw: number;
  efficiency: number;
  expectedKwh: number;
  actualKwh: number;
  deviation: number;
  ambientTemp: number;
  scenarioDescription: string;
  physicsReasoning: string;
}

const DEMO_SCENARIOS: ScenarioPreset[] = [
  {
    id: 'DEMO-01',
    title: 'Nominal Baseline Charging (Tesla Model 3)',
    vehicle: 'Tesla Model 3 LR (75 kWh Pack)',
    charger: 'CHG-NORTH-01 (150 kW DC Fast)',
    type: 'NORMAL',
    badgeColor: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400',
    badgeText: 'NOMINAL (<5.0% DEVIATION)',
    batteryCapacity: 75.0,
    initialSoc: 15.0,
    targetSoc: 80.0,
    powerKw: 120.0,
    efficiency: 93.0,
    expectedKwh: 52.42,
    actualKwh: 53.21,
    deviation: 1.51,
    ambientTemp: 22.0,
    scenarioDescription: 'Nominal fast charging curve in controlled temperature. Grid energy matches first-principles battery requirements with expected 7% inverter conversion losses.',
    physicsReasoning: 'E_battery = 75 kWh × (80% - 15%) = 48.75 kWh. E_expected = 48.75 / 0.93 = 52.42 kWh. Actual metered energy is 53.21 kWh (Residual = +0.79 kWh, 1.51% dev).',
  },
  {
    id: 'DEMO-02',
    title: 'Excessive Inverter Thermal Dissipation (Hyundai Ioniq 5)',
    vehicle: 'Hyundai Ioniq 5 (77.4 kWh Pack)',
    charger: 'CHG-SOUTH-04 (175 kW DC Fast)',
    type: 'WARNING',
    badgeColor: 'bg-amber-950/80 border-amber-500/40 text-amber-400',
    badgeText: 'WARNING (10.9% DEVIATION)',
    batteryCapacity: 77.4,
    initialSoc: 10.0,
    targetSoc: 80.0,
    powerKw: 150.0,
    efficiency: 91.0,
    expectedKwh: 59.54,
    actualKwh: 66.03,
    deviation: 10.9,
    ambientTemp: 38.0,
    scenarioDescription: 'Extreme summer heatwave causing elevated junction temperature on IGBT switches and active coolant radiator pump energy consumption.',
    physicsReasoning: 'E_battery = 54.18 kWh. Rated expected = 59.54 kWh. Realized grid draw is 66.03 kWh due to +6.49 kWh auxiliary chilling and thermal I²R losses.',
  },
  {
    id: 'DEMO-03',
    title: 'Current Sensor Shunt Drift / Energy Discrepancy (Porsche Taycan)',
    vehicle: 'Porsche Taycan 4S (93.4 kWh Pack)',
    charger: 'CHG-DOWNTOWN-02 (250 kW Ultra-Fast)',
    type: 'ANOMALY',
    badgeColor: 'bg-rose-950/80 border-rose-500/40 text-rose-400',
    badgeText: 'CRITICAL ANOMALY (26.3% DEVIATION)',
    batteryCapacity: 93.4,
    initialSoc: 20.0,
    targetSoc: 85.0,
    powerKw: 220.0,
    efficiency: 92.0,
    expectedKwh: 65.99,
    actualKwh: 83.34,
    deviation: 26.29,
    ambientTemp: 24.0,
    scenarioDescription: 'Significant energy discrepancy exceeding 26%. Indicates Hall-effect current transducer calibration drift or unmetered energy dissipation in power stage.',
    physicsReasoning: 'E_battery = 60.71 kWh. Expected = 65.99 kWh. Meter registered 83.34 kWh (+17.35 kWh residual). Exceeds ISO 15118 anomaly bounds.',
  },
  {
    id: 'DEMO-04',
    title: 'Transient Power Step Spike (Ford F-150 Lightning)',
    vehicle: 'Ford F-150 Lightning (131 kWh Pack)',
    charger: 'CHG-EAST-03 (150 kW DC Fast)',
    type: 'SUDDEN_SPIKE',
    badgeColor: 'bg-purple-950/80 border-purple-500/40 text-purple-300',
    badgeText: 'SUDDEN SPIKE (+38 kW STEP)',
    batteryCapacity: 131.0,
    initialSoc: 25.0,
    targetSoc: 75.0,
    powerKw: 130.0,
    efficiency: 90.0,
    expectedKwh: 72.78,
    actualKwh: 78.45,
    deviation: 7.79,
    ambientTemp: 18.0,
    scenarioDescription: 'Rapid instantaneous step change in power electronics switching frequency causing power surge detection and contactor stress.',
    physicsReasoning: 'Digital Twin step-delta monitor detected instantaneous +38 kW power jump in telemetry stream. Handled as transient power electronics fault.',
  },
  {
    id: 'DEMO-05',
    title: 'Persistent Station Degradation (Rivian R1T)',
    vehicle: 'Rivian R1T (135 kWh Pack)',
    charger: 'CHG-WEST-05 (200 kW Station)',
    type: 'PERSISTENT_ANOMALY',
    badgeColor: 'bg-rose-950/80 border-rose-500/40 text-rose-300',
    badgeText: 'PERSISTENT HARDWARE FAULT (3x STRIKES)',
    batteryCapacity: 135.0,
    initialSoc: 15.0,
    targetSoc: 70.0,
    powerKw: 160.0,
    efficiency: 89.0,
    expectedKwh: 83.43,
    actualKwh: 104.28,
    deviation: 24.99,
    ambientTemp: 27.0,
    scenarioDescription: 'Charger CHG-WEST-05 has failed tolerance in 3 consecutive charging sessions, automatically triggering hardware maintenance work orders.',
    physicsReasoning: 'Sequential telemetry rule triggers PERSISTENT_ANOMALY when N >= 3 consecutive sessions breach 15% threshold on the same charger node.',
  },
];

interface ProfessorDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchScenario: (session: ChargingSession) => void;
}

export const ProfessorDemoModal: React.FC<ProfessorDemoModalProps> = ({
  isOpen,
  onClose,
  onLaunchScenario,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioPreset>(DEMO_SCENARIOS[0]);

  if (!isOpen) return null;

  const handleLaunch = () => {
    const s = selectedScenario;
    const sessionObj: ChargingSession = {
      id: `SESS-${s.id}-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      evId: s.vehicle.split(' ')[0] + '-' + s.id,
      chargerId: s.charger.split(' ')[0],
      batteryCapacityKwh: s.batteryCapacity,
      initialSoc: s.initialSoc,
      targetSoc: s.targetSoc,
      chargingPowerKw: s.powerKw,
      chargingEfficiency: s.efficiency,
      ambientTemperatureC: s.ambientTemp,
      durationMinutes: Math.round((s.expectedKwh / s.powerKw) * 60),
      expectedEnergyKwh: s.expectedKwh,
      actualEnergyKwh: s.actualKwh,
      residualKwh: parseFloat((s.actualKwh - s.expectedKwh).toFixed(2)),
      deviationPercent: s.deviation,
      status: s.type,
      explanation: {
        primaryClassification: s.type,
        deviationPercent: s.deviation,
        summary: s.scenarioDescription,
        deviationStatement: `Deviation is ${s.deviation}% (${s.type}).`,
        possibleCauses: [s.physicsReasoning],
        recommendedAction: s.type === 'NORMAL' ? 'No action needed; nominal operation.' : 'Dispatch maintenance technician to inspect station.',
        confidenceScore: 98,
      } as any,
      telemetryPoints: [],
      dataSource: 'SIMULATION',
    };

    onLaunchScenario(sessionObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-auto text-slate-100 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <PlaySquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Live Academic Demonstration &amp; Scenarios</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                  Interactive Lab
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Load curated physics-informed benchmark scenarios into the Digital Twin with real-time graphs
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two column layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 pr-1">
          {/* Left Column: Scenario Selection List (5 cols) */}
          <div className="md:col-span-5 space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Select Benchmark Scenario:
            </label>
            {DEMO_SCENARIOS.map((sc) => {
              const isSelected = sc.id === selectedScenario.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc)}
                  className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500/70 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">{sc.id}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${sc.badgeColor}`}>
                      {sc.type}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 line-clamp-1">{sc.title}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Δ {sc.deviation.toFixed(1)}% | {sc.expectedKwh.toFixed(1)} kWh → {sc.actualKwh.toFixed(1)} kWh
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Scenario Physics Details & Live Preview (7 cols) */}
          <div className="md:col-span-7 bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-mono text-cyan-400">{selectedScenario.id}</span>
                <h3 className="text-sm font-bold text-white">{selectedScenario.title}</h3>
              </div>
              <span className={`text-[10px] font-mono px-2 py-1 rounded-lg border ${selectedScenario.badgeColor}`}>
                {selectedScenario.badgeText}
              </span>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Expected Energy</span>
                <span className="font-bold text-cyan-300">{selectedScenario.expectedKwh.toFixed(2)} kWh</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Actual Metered</span>
                <span className="font-bold text-amber-300">{selectedScenario.actualKwh.toFixed(2)} kWh</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Deviation</span>
                <span className={`font-bold ${selectedScenario.deviation > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  Δ {selectedScenario.deviation.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Narrative & Physics description */}
            <div className="space-y-2 text-xs">
              <div className="text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800/80">
                <strong className="text-white block mb-1">Scenario Narrative:</strong>
                {selectedScenario.scenarioDescription}
              </div>

              <div className="text-slate-300 leading-relaxed bg-cyan-950/20 p-3 rounded-lg border border-cyan-800/40">
                <strong className="text-cyan-300 block mb-1">First-Principles Physics Proof:</strong>
                <span className="font-mono text-[11px] text-slate-200">{selectedScenario.physicsReasoning}</span>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simulates full 20-point telemetry</span>
              </div>

              <button
                onClick={handleLaunch}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg shadow-lg shadow-cyan-500/20 transition transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Launch into Live Twin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
