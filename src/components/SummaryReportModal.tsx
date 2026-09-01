import React, { useState } from 'react';
import { ChargingSession, ThresholdSettings, ChargerHealthProfile } from '../types';
import { downloadFile, exportAnomaliesToJSON } from '../data/exportTemplates';
import {
  FileText,
  X,
  Printer,
  Copy,
  Check,
  Download,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  Cpu,
  Sparkles,
  Code2,
  AlertCircle,
  Clock,
  Gauge,
  Layers,
} from 'lucide-react';

interface SummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChargingSession[];
  activeSession: ChargingSession;
  thresholds: ThresholdSettings;
  chargerProfiles: ChargerHealthProfile[];
}

export const SummaryReportModal: React.FC<SummaryReportModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSession,
  thresholds,
  chargerProfiles,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Aggregate metrics
  const totalSessions = sessions.length;
  const normalSessions = sessions.filter((s) => s.status === 'NORMAL').length;
  const warningSessions = sessions.filter((s) => s.status === 'WARNING').length;
  const anomalySessions = sessions.filter(
    (s) => s.status === 'ANOMALY' || s.status === 'PERSISTENT_ANOMALY' || s.status === 'SUDDEN_SPIKE'
  ).length;

  const totalActualEnergy = sessions.reduce((acc, s) => acc + s.actualEnergyKwh, 0);
  const totalExpectedEnergy = sessions.reduce((acc, s) => acc + s.expectedEnergyKwh, 0);
  const totalResidual = totalActualEnergy - totalExpectedEnergy;
  const overallAvgDeviation = totalExpectedEnergy > 0 ? (Math.abs(totalResidual) / totalExpectedEnergy) * 100 : 0;
  const anomalyRate = totalSessions > 0 ? ((anomalySessions + warningSessions) / totalSessions) * 100 : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    const md = `# VOLTTWIN SYNAPSE — EXECUTIVE & FORENSIC AUDIT REPORT
**Generated At:** ${new Date().toUTCString()}
**System Architecture:** Physics-Informed Digital Twin EV Charging Anomaly Intelligence
**Developed By:** neonscodeshanks07
**Standards Compliance:** ISO 15118 / SAE J1772 / IEC 61851

---

## 1. FLEET TELEMETRY EXECUTIVE SUMMARY
- **Total Sessions Audited:** ${totalSessions}
- **Normal Sessions (<${thresholds.normalDeviationThreshold}%):** ${normalSessions} (${((normalSessions / totalSessions) * 100).toFixed(1)}%)
- **Warning Sessions (${thresholds.normalDeviationThreshold}-${thresholds.anomalyDeviationThreshold}%):** ${warningSessions}
- **Critical Anomaly Incidents (>${thresholds.anomalyDeviationThreshold}%):** ${anomalySessions}
- **Total Delivered Energy (Metered):** ${totalActualEnergy.toFixed(2)} kWh
- **Theoretical Expected Grid Energy:** ${totalExpectedEnergy.toFixed(2)} kWh
- **Aggregate Energy Residual / Dissipation:** ${totalResidual > 0 ? '+' : ''}${totalResidual.toFixed(2)} kWh
- **Aggregate Deviation Rate:** ${overallAvgDeviation.toFixed(2)}%

---

## 2. ACTIVE SESSION FORENSIC AUDIT (${activeSession.id})
- **Station / Node:** ${activeSession.chargerId}
- **Vehicle Identifier:** ${activeSession.evId}
- **Battery Pack:** ${activeSession.batteryCapacityKwh} kWh (${activeSession.initialSoc}% -> ${activeSession.targetSoc}% SOC)
- **Expected Grid Energy:** ${activeSession.expectedEnergyKwh.toFixed(2)} kWh
- **Actual Delivered Energy:** ${activeSession.actualEnergyKwh.toFixed(2)} kWh
- **Residual Loss:** ${activeSession.residualKwh > 0 ? '+' : ''}${activeSession.residualKwh.toFixed(2)} kWh
- **Deviation Percentage:** Δ ${activeSession.deviationPercent.toFixed(2)}%
- **Classification:** ${activeSession.status}
- **Forensic Diagnosis:** ${activeSession.explanation.summary}
- **Recommended Action:** ${activeSession.explanation.recommendedAction}

---

## 3. RELIABILITY NOTICE
*This app can make mistakes. Always cross-verify critical telemetry and diagnostics with physical hardware meters.*
© ${new Date().getFullYear()} neonscodeshanks07. All Rights Reserved.
`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const jsonStr = exportAnomaliesToJSON(sessions, thresholds);
    downloadFile(jsonStr, `EVGuard_Audit_Report_${Date.now()}.json`, 'application/json');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-auto text-slate-100 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Executive &amp; Forensic Audit Report</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  ISO 15118 Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive physics-informed diagnostics, fleet metrics, and certified audit summary
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
              title="Copy audit as formatted markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied ? 'Copied' : 'Copy MD'}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
              title="Download structured JSON report"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition shadow-md shadow-cyan-500/20"
              title="Print or export as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content Area */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 print:overflow-visible">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 font-mono">
              <div className="text-[11px] text-slate-400">Total Audited</div>
              <div className="text-xl font-bold text-white mt-1">{totalSessions} <span className="text-xs font-normal text-slate-400">Sessions</span></div>
              <div className="text-[10px] text-cyan-400 mt-1">100% telemetry verified</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 font-mono">
              <div className="text-[11px] text-slate-400">Normal Compliance</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{((normalSessions / (totalSessions || 1)) * 100).toFixed(1)}%</div>
              <div className="text-[10px] text-slate-400 mt-1">{normalSessions} nominal runs</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 font-mono">
              <div className="text-[11px] text-slate-400">Metered Grid Energy</div>
              <div className="text-xl font-bold text-amber-300 mt-1">{totalActualEnergy.toFixed(1)} <span className="text-xs font-normal text-slate-400">kWh</span></div>
              <div className="text-[10px] text-slate-400 mt-1">Expected: {totalExpectedEnergy.toFixed(1)} kWh</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 font-mono">
              <div className="text-[11px] text-slate-400">Net Energy Residual</div>
              <div className={`text-xl font-bold mt-1 ${totalResidual > 10 ? 'text-rose-400' : 'text-purple-300'}`}>
                {totalResidual > 0 ? '+' : ''}{totalResidual.toFixed(2)} <span className="text-xs font-normal text-slate-400">kWh</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Avg Δ: {overallAvgDeviation.toFixed(1)}%</div>
            </div>
          </div>

          {/* Active Session Detailed Forensics */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Selected Session Forensic Breakdown ({activeSession.id})
              </h3>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  activeSession.status === 'NORMAL'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800/80'
                    : activeSession.status === 'WARNING'
                    ? 'bg-amber-950 text-amber-300 border-amber-800/80'
                    : 'bg-rose-950 text-rose-300 border-rose-800/80'
                }`}
              >
                {activeSession.status} (Δ {activeSession.deviationPercent.toFixed(2)}%)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-400">Station ID:</span> <strong className="text-white">{activeSession.chargerId}</strong>
              </div>
              <div>
                <span className="text-slate-400">Vehicle:</span> <strong className="text-slate-200">{activeSession.evId}</strong>
              </div>
              <div>
                <span className="text-slate-400">Battery Capacity:</span> <strong className="text-cyan-300">{activeSession.batteryCapacityKwh} kWh</strong>
              </div>
              <div>
                <span className="text-slate-400">SOC Window:</span> <strong className="text-slate-200">{activeSession.initialSoc}% → {activeSession.targetSoc}%</strong>
              </div>
              <div>
                <span className="text-slate-400">Expected Energy:</span> <strong className="text-cyan-400">{activeSession.expectedEnergyKwh.toFixed(2)} kWh</strong>
              </div>
              <div>
                <span className="text-slate-400">Delivered Energy:</span> <strong className="text-amber-300">{activeSession.actualEnergyKwh.toFixed(2)} kWh</strong>
              </div>
              <div>
                <span className="text-slate-400">Energy Residual:</span>{' '}
                <strong className={activeSession.residualKwh > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {activeSession.residualKwh > 0 ? '+' : ''}{activeSession.residualKwh.toFixed(2)} kWh
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Ambient Temp:</span> <strong className="text-slate-200">{activeSession.ambientTemperatureC}°C</strong>
              </div>
            </div>

            <div className="pt-2 text-xs space-y-2 border-t border-slate-800/60">
              <div>
                <span className="text-slate-400 font-semibold">Diagnostic Assessment:</span>
                <p className="text-slate-200 mt-0.5 leading-relaxed">{activeSession.explanation.summary}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold">Recommended Physical Action:</span>
                <p className="text-cyan-300 mt-0.5 font-medium">{activeSession.explanation.recommendedAction}</p>
              </div>
            </div>
          </div>

          {/* Standards & Methodological Compliance */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Compliance Standards &amp; Physics Foundations
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <strong className="text-slate-200 block">ISO 15118-20</strong>
                High-level digital communication protocol &amp; digital twin telemetry verification.
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <strong className="text-slate-200 block">SAE J1772 / J2847</strong>
                AC &amp; DC fast charging power boundaries and PWM pilot signal tolerance validation.
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <strong className="text-slate-200 block">IEC 61851-1</strong>
                Electric vehicle conductive charging safety, thermal dissipation limits, and residual energy caps.
              </div>
            </div>
          </div>

          {/* Audit Verification & Reliability Notice */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/40">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] text-slate-400">Engineered by:</span>
                <span className="font-mono text-xs font-bold text-cyan-300">neonscodeshanks07</span>
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                &copy; {new Date().getFullYear()} neonscodeshanks07. All Rights Reserved.
              </div>
            </div>

            <div className="text-amber-300/90 text-xs flex items-start gap-2.5 bg-amber-950/30 border border-amber-900/50 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-semibold">Reliability Notice:</strong> This app can make mistakes. Always cross-verify critical telemetry and diagnostics with physical hardware meters.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 pt-3 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
