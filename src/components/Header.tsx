import React from 'react';
import {
  Activity,
  Cpu,
  AlertTriangle,
  FlaskConical,
  CheckCircle2,
  History,
  Usb,
  Settings,
  FileText,
  PlaySquare,
  Zap,
  Gauge,
  PlusCircle,
  Code2,
  Sparkles,
} from 'lucide-react';
import { ArduinoConnectionState, AppTab } from '../types';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  arduinoState: ArduinoConnectionState;
  onOpenProfessorDemo?: () => void;
  onOpenReportModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  arduinoState,
  onOpenProfessorDemo,
  onOpenReportModal,
}) => {
  const tabs: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: Activity },
    { id: 'MANUAL_FEED', label: 'Manual Feed', icon: PlusCircle },
    { id: 'CHARGER_HEALTH', label: 'Charger Health', icon: Gauge },
    { id: 'DIGITAL_TWIN', label: 'Digital Twin', icon: Cpu },
    { id: 'ANOMALIES', label: 'Anomaly Detection', icon: AlertTriangle },
    { id: 'SIMULATION_LAB', label: 'Simulation Lab', icon: FlaskConical },
    { id: 'VALIDATION', label: 'Model Validation', icon: CheckCircle2 },
    { id: 'HISTORY', label: 'Session History', icon: History },
    { id: 'ARDUINO', label: 'Arduino / Serial', icon: Usb },
    { id: 'SETTINGS', label: 'Settings & Tests', icon: Settings },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-xl backdrop-blur">
      {/* Top utility row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                VoltTwin <span className="text-cyan-400 font-mono text-sm px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 shadow-[0_0_8px_rgba(6,182,212,0.3)]">SYNAPSE</span>
              </h1>
              <span className="text-xs text-slate-400 hidden lg:inline-block border-l border-slate-700 pl-2">
                Neural EV Telemetry &amp; Anomaly Intelligence
              </span>
              
              {/* Premium Developer Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                <Code2 className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Dev:</span>
                <span className="text-xs font-mono font-bold tracking-wide bg-gradient-to-r from-cyan-300 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
                  neonscodeshanks07
                </span>
                <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Physics-Informed Real-Time Diagnostics &amp; Hardware Monitoring</span>
            </p>
          </div>
        </div>

        {/* Global Action CTAs & Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Arduino status badge */}
          <div
            className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border ${
              arduinoState.isConnected
                ? arduinoState.isVirtual
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                  : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                arduinoState.isConnected ? (arduinoState.isVirtual ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping') : 'bg-slate-500'
              }`}
            />
            {arduinoState.isConnected
              ? arduinoState.isVirtual
                ? 'Virtual Arduino (1Hz)'
                : 'Arduino USB Connected'
              : 'Standalone Sim Mode'}
          </div>

          {/* Live Demo CTA */}
          <button
            onClick={onOpenProfessorDemo}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Load featured anomaly scenario for live demonstration"
          >
            <PlaySquare className="w-4 h-4" />
            <span>Live Demo Mode</span>
          </button>

          {/* Generate PDF/Print Report */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Summary Report</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto no-scrollbar">
        <nav className="flex space-x-1 border-t border-slate-800/80 py-1.5" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
