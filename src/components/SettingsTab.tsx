import React, { useState } from 'react';
import { ThresholdSettings, UnitTestResult } from '../types';
import { runAllUnitTests } from '../core/unitTests';
import { PYTHON_BACKEND_CODE, ACADEMIC_README_MARKDOWN } from '../data/embeddedSourceCode';
import { downloadFile } from '../data/exportTemplates';
import {
  Settings,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  FileCode,
  Download,
  Copy,
  Check,
  BookOpen,
  Shield,
  Code2,
  Sparkles,
  Terminal,
  Award,
  Cpu,
} from 'lucide-react';

interface SettingsTabProps {
  thresholds: ThresholdSettings;
  onUpdateThresholds: (newThresholds: Partial<ThresholdSettings>) => void;
  onResetThresholds: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  thresholds,
  onUpdateThresholds,
  onResetThresholds,
}) => {
  const [testResults, setTestResults] = useState<UnitTestResult[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [activeCodeViewer, setActiveCodeViewer] = useState<'PYTHON' | 'PAPER'>('PYTHON');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const results = runAllUnitTests();
      setTestResults(results);
      setIsRunningTests(false);
    }, 200);
  };

  const handleCopyCode = () => {
    const text = activeCodeViewer === 'PYTHON' ? PYTHON_BACKEND_CODE : ACADEMIC_README_MARKDOWN;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadCode = () => {
    if (activeCodeViewer === 'PYTHON') {
      downloadFile(PYTHON_BACKEND_CODE, 'digital_twin_engine.py', 'text/x-python');
    } else {
      downloadFile(ACADEMIC_README_MARKDOWN, 'EVGUARD_TWIN_ACADEMIC_METHODOLOGY.md', 'text/markdown');
    }
  };

  const allPassed = testResults && testResults.every((t) => t.passed);
  const passCount = testResults?.filter((t) => t.passed).length || 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">System Thresholds & Academic Artifacts</h2>
              <p className="text-xs text-slate-400">
                Configure anomaly bounds, execute verification unit tests, and export standalone Python/Documentation code
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetThresholds}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>
      </div>

      {/* Threshold Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive Sliders */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Anomaly Detection Classification Thresholds
            </h3>
            <span className="text-xs text-slate-400 font-mono">ISO 15118 & SAE J1772</span>
          </div>

          {/* Normal Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300">Normal Tolerance Band Limit (&lt;%)</label>
              <span className="font-mono text-emerald-400 font-semibold">{thresholds.normalDeviationThreshold}%</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.5"
              value={thresholds.normalDeviationThreshold}
              onChange={(e) => onUpdateThresholds({ normalDeviationThreshold: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="text-[11px] text-slate-400">
              Deviations below {thresholds.normalDeviationThreshold}% are classified as <strong>NORMAL</strong> baseline.
            </div>
          </div>

          {/* Anomaly Threshold */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300">Critical Anomaly Threshold (&gt;%)</label>
              <span className="font-mono text-rose-400 font-semibold">{thresholds.anomalyDeviationThreshold}%</span>
            </div>
            <input
              type="range"
              min="10.0"
              max="35.0"
              step="1.0"
              value={thresholds.anomalyDeviationThreshold}
              onChange={(e) => onUpdateThresholds({ anomalyDeviationThreshold: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-400"
            />
            <div className="text-[11px] text-slate-400">
              Deviations above {thresholds.anomalyDeviationThreshold}% trigger a <strong>CRITICAL ANOMALY</strong> flag.
            </div>
          </div>

          {/* Sudden Spike Delta Threshold */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300">Sudden Power Step Spike Threshold (kW)</label>
              <span className="font-mono text-purple-300 font-semibold">{thresholds.spikeDeltaThresholdKw} kW</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={thresholds.spikeDeltaThresholdKw}
              onChange={(e) => onUpdateThresholds({ spikeDeltaThresholdKw: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
            <div className="text-[11px] text-slate-400">
              Interval jumps &ge;{thresholds.spikeDeltaThresholdKw} kW trigger <strong>SUDDEN SPIKE</strong> detection.
            </div>
          </div>

          {/* Persistent Anomaly Count */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300">Persistent Anomaly Consecutive Sessions Count</label>
              <span className="font-mono text-amber-400 font-semibold">{thresholds.consecutiveAnomalyCountForPersistent} sessions</span>
            </div>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              value={thresholds.consecutiveAnomalyCountForPersistent}
              onChange={(e) => onUpdateThresholds({ consecutiveAnomalyCountForPersistent: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="text-[11px] text-slate-400">
              Flags persistent charger hardware degradation if {thresholds.consecutiveAnomalyCountForPersistent} consecutive sessions exceed tolerance.
            </div>
          </div>
        </div>

        {/* Right: Automated Verification Unit Test Runner */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">Automated Core Verification Suite</h3>
            </div>
            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-md shadow-cyan-500/20"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunningTests ? 'Executing Tests...' : 'Run Unit Tests'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Executes deterministic automated unit tests validating digital twin physics, bounds checking, CSV formula injection defense, and anomaly classifiers.
          </p>

          {testResults ? (
            <div className="space-y-2">
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono font-bold ${
                  allPassed
                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                }`}
              >
                <span>Status: {allPassed ? 'ALL TESTS PASSED (100%)' : 'SOME TESTS FAILED'}</span>
                <span>{passCount} / {testResults.length} passed</span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {testResults.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {t.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-200">{t.name}</span>
                        <div className="text-[11px] text-slate-400 font-mono">{t.message}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{t.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-400">
              Click <strong>"Run Unit Tests"</strong> to verify system integrity.
            </div>
          )}
        </div>
      </div>

      {/* Embedded Academic Artifacts & Python Digital Twin Code */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeViewer('PYTHON')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                activeCodeViewer === 'PYTHON'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>digital_twin_engine.py</span>
            </button>

            <button
              onClick={() => setActiveCodeViewer('PAPER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                activeCodeViewer === 'PAPER'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>Academic Methodology Paper (Markdown)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Artifact'}</span>
            </button>

            <button
              onClick={handleDownloadCode}
              className="flex items-center gap-1 text-xs text-slate-200 hover:text-white bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 rounded-lg font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {activeCodeViewer === 'PYTHON' ? '.py' : '.md'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 h-96 overflow-y-auto">
          <pre className="text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
            {activeCodeViewer === 'PYTHON' ? PYTHON_BACKEND_CODE : ACADEMIC_README_MARKDOWN}
          </pre>
        </div>
      </div>

      {/* Author Attribution & System Identity Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-cyan-900/40 rounded-2xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-slate-800 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                Project Ownership &amp; System Architecture
              </h4>
              <p className="text-xs text-slate-400">Physics-Informed Digital Twin &amp; Anomaly Detection Platform</p>
            </div>
          </div>

          {/* Premium Developer Hologram Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-slate-950 via-cyan-950/60 to-slate-950 border border-cyan-500/50 shadow-[0_0_16px_rgba(6,182,212,0.3)]">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400 font-medium">Developed by</span>
            <span className="font-mono text-sm font-extrabold tracking-wider bg-gradient-to-r from-cyan-300 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
              neonscodeshanks07
            </span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-400">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Copyright &amp; Intellectual Property</span>
            </div>
            <p className="font-mono text-[11px] text-slate-400 leading-relaxed">
              &copy; {new Date().getFullYear()} <strong className="text-cyan-300 font-semibold">neonscodeshanks07</strong>. All Rights Reserved.
            </p>
            <p className="text-[11px] text-slate-500">
              Physics-informed digital twin models, classification engines, and hardware telemetry architectures developed and maintained under modern high-reliability engineering standards.
            </p>
          </div>

          <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Reliability &amp; Safety Disclaimer</span>
            </div>
            <p className="text-amber-200/80 text-[11px] font-medium">
              Notice: This application can make mistakes.
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Real-time calculations, simulated residual deviations, and automated diagnostic flags are provided for analytical decision-support. Always verify critical load balances with certified physical instrumentation before dispatching maintenance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
