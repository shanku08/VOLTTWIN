import React, { useState, useMemo } from 'react';
import {
  SyntheticDatasetConfig,
  ValidationMetrics,
} from '../types';
import {
  generateSyntheticDataset,
  DEFAULT_SYNTHETIC_CONFIG,
} from '../core/validationSuite';
import {
  evaluatePhysicsDetector,
  evaluateIsolationForest,
  evaluateStatisticalZScore,
  evaluateLocalOutlierFactor,
  MLModelEvaluationResult,
  DataSamplePoint,
} from '../core/mlDetection';
import {
  CheckCircle2,
  Sliders,
  RotateCcw,
  Zap,
  Layers,
  Scale,
  Activity,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ModelValidationTabProps {
  uploadedSamples?: DataSamplePoint[];
}

export const ModelValidationTab: React.FC<ModelValidationTabProps> = ({
  uploadedSamples,
}) => {
  const [activeDataSource, setActiveDataSource] = useState<'SYNTHETIC' | 'UPLOADED'>('SYNTHETIC');
  const [config, setConfig] = useState<SyntheticDatasetConfig>(DEFAULT_SYNTHETIC_CONFIG);
  const [seedKey, setSeedKey] = useState<number>(0);

  // Generate synthetic dataset reactively based on config and seedKey
  const syntheticDataset = useMemo(() => {
    return generateSyntheticDataset(config);
  }, [config, seedKey]);

  const activeDataset = activeDataSource === 'UPLOADED' && uploadedSamples && uploadedSamples.length > 0
    ? uploadedSamples
    : syntheticDataset;

  // Evaluate All 4 Models deterministically on current active dataset
  const physicsResults: MLModelEvaluationResult = useMemo(() => {
    return evaluatePhysicsDetector(activeDataset, 15.0);
  }, [activeDataset]);

  const isolationForestResults: MLModelEvaluationResult = useMemo(() => {
    return evaluateIsolationForest(activeDataset, 40, (config.anomalyRatePercent + config.spikeProbabilityPercent) / 100);
  }, [activeDataset, config]);

  const zScoreResults: MLModelEvaluationResult = useMemo(() => {
    return evaluateStatisticalZScore(activeDataset, 2.0);
  }, [activeDataset]);

  const lofResults: MLModelEvaluationResult = useMemo(() => {
    return evaluateLocalOutlierFactor(activeDataset, 8, 1.3);
  }, [activeDataset]);

  const allModelResults = [physicsResults, isolationForestResults, zScoreResults, lofResults];

  // Currently focused model for deep confusion matrix display
  const [selectedModelIndex, setSelectedModelIndex] = useState<number>(0);
  const currentModel = allModelResults[selectedModelIndex] || physicsResults;
  const m = currentModel.metrics;

  const totalPositives = m.truePositives + m.falseNegatives;
  const totalNegatives = m.trueNegatives + m.falsePositives;

  return (
    <div className="space-y-6">
      {/* Validation Header & Data Source Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Physics & ML Model Validation Suite</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
                  Zero Fabricated Metrics
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rigorous empirical evaluation on ground-truth benchmark datasets with real-time confusion matrix
              </p>
            </div>
          </div>

          {/* Dataset source selector tab */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveDataSource('SYNTHETIC')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeDataSource === 'SYNTHETIC'
                  ? 'bg-slate-800 text-cyan-300 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Validation on Synthetic Data ({syntheticDataset.length} samples)
            </button>
            <button
              onClick={() => setActiveDataSource('UPLOADED')}
              disabled={!uploadedSamples || uploadedSamples.length === 0}
              className={`px-3 py-1.5 rounded-md font-medium transition disabled:opacity-40 ${
                activeDataSource === 'UPLOADED'
                  ? 'bg-slate-800 text-cyan-300 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Validation on Uploaded Data ({uploadedSamples?.length || 0} samples)
            </button>
          </div>
        </div>

        {/* Dataset transparency disclaimer */}
        <div className="mt-3 p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {activeDataSource === 'SYNTHETIC'
                ? 'Dataset Source: Controlled Synthetic Ground-Truth Benchmark (Gaussian Noise + Injected Anomaly Modes)'
                : 'Dataset Source: Real-world CSV Uploaded Records'}
            </span>
          </div>
          <span className="font-mono text-cyan-300 text-[11px] font-semibold">
            {activeDataSource === 'SYNTHETIC' ? 'Label: Synthetic/Test Data' : 'Label: Real-World Data'}
          </span>
        </div>
      </div>

      {/* Synthetic Dataset Configuration Generator Deck */}
      {activeDataSource === 'SYNTHETIC' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">Synthetic Dataset Hyperparameters</h3>
            </div>
            <button
              onClick={() => setSeedKey((k) => k + 1)}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg border border-slate-700 font-medium transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Re-generate Dataset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Control 1: Sample Count */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300">Sample Count</label>
                <span className="font-mono text-cyan-400 font-semibold">{config.sampleCount} sessions</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={config.sampleCount}
                onChange={(e) => setConfig({ ...config, sampleCount: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Control 2: Noise Level */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300">Base Noise Level</label>
                <span className="font-mono text-cyan-400 font-semibold">±{config.noiseLevelPercent}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.5"
                value={config.noiseLevelPercent}
                onChange={(e) => setConfig({ ...config, noiseLevelPercent: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Control 3: Anomaly Percentage */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300">Anomaly Prevalence</label>
                <span className="font-mono text-rose-400 font-semibold">{config.anomalyRatePercent}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={config.anomalyRatePercent}
                onChange={(e) => setConfig({ ...config, anomalyRatePercent: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-400"
              />
            </div>

            {/* Control 4: Anomaly Magnitude */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300">Anomaly Magnitude</label>
                <span className="font-mono text-purple-400 font-semibold">+{config.anomalyMagnitudePercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="2"
                value={config.anomalyMagnitudePercent}
                onChange={(e) => setConfig({ ...config, anomalyMagnitudePercent: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Model Comparison Table: Physics vs. ML Detectors */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              Algorithm Performance Comparison (Physics Baseline vs. Lightweight ML)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluated on {activeDataset.length} ground-truth labeled charging records
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Detector Model</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Accuracy</th>
                <th className="py-2.5 px-3">Precision</th>
                <th className="py-2.5 px-3">Recall</th>
                <th className="py-2.5 px-3">F1-Score</th>
                <th className="py-2.5 px-3">FPR (%)</th>
                <th className="py-2.5 px-3">FNR (%)</th>
                <th className="py-2.5 px-3">Avg Latency</th>
                <th className="py-2.5 px-3 text-right">View Matrix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {allModelResults.map((res, idx) => {
                const isSelected = selectedModelIndex === idx;
                return (
                  <tr
                    key={res.modelName}
                    className={`hover:bg-slate-800/40 transition cursor-pointer ${
                      isSelected ? 'bg-cyan-950/30' : ''
                    }`}
                    onClick={() => setSelectedModelIndex(idx)}
                  >
                    <td className="py-3 px-3 font-bold text-slate-200">
                      <div className="flex items-center gap-2">
                        {res.isBaseline && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-normal">
                            Baseline
                          </span>
                        )}
                        <span>{res.modelName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{res.type}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400">{res.metrics.accuracy.toFixed(1)}%</td>
                    <td className="py-3 px-3 text-cyan-300">{res.metrics.precision.toFixed(1)}%</td>
                    <td className="py-3 px-3 text-amber-300">{res.metrics.recall.toFixed(1)}%</td>
                    <td className="py-3 px-3 font-bold text-purple-300">{res.metrics.f1Score.toFixed(1)}%</td>
                    <td className="py-3 px-3 text-slate-300">{res.metrics.falsePositiveRate.toFixed(1)}%</td>
                    <td className="py-3 px-3 text-slate-300">{res.metrics.falseNegativeRate.toFixed(1)}%</td>
                    <td className="py-3 px-3 text-slate-400">{res.metrics.averageLatencyMs} ms</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        className={`text-xs px-2.5 py-1 rounded transition ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-cyan-400 hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep Confusion Matrix & Metric Dashboard for Selected Model */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Confusion Matrix Heatmap (2x2) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Confusion Matrix (2×2)
            </h3>
            <span className="text-xs font-mono text-cyan-300">{currentModel.modelName.split(' ')[0]}</span>
          </div>

          <div className="space-y-3">
            <div className="text-[11px] text-slate-400 flex justify-between font-mono">
              <span>Predicted Positive</span>
              <span>Predicted Negative</span>
            </div>

            {/* Matrix Row 1: Actual Positive */}
            <div className="grid grid-cols-2 gap-3">
              {/* True Positive (TP) */}
              <div className="bg-emerald-950/50 border border-emerald-500/50 rounded-xl p-3.5 text-center relative overflow-hidden">
                <div className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">
                  True Positive (TP)
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">{m.truePositives}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Correctly detected anomalies</div>
              </div>

              {/* False Negative (FN) */}
              <div className="bg-rose-950/50 border border-rose-500/50 rounded-xl p-3.5 text-center relative overflow-hidden">
                <div className="text-[10px] font-mono text-rose-400 font-semibold uppercase">
                  False Negative (FN)
                </div>
                <div className="text-2xl font-bold font-mono text-rose-300 mt-1">{m.falseNegatives}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Missed anomaly anomalies</div>
              </div>
            </div>

            {/* Matrix Row 2: Actual Negative */}
            <div className="grid grid-cols-2 gap-3">
              {/* False Positive (FP) */}
              <div className="bg-amber-950/50 border border-amber-500/50 rounded-xl p-3.5 text-center relative overflow-hidden">
                <div className="text-[10px] font-mono text-amber-400 font-semibold uppercase">
                  False Positive (FP)
                </div>
                <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{m.falsePositives}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">False alarms on normal sessions</div>
              </div>

              {/* True Negative (TN) */}
              <div className="bg-blue-950/50 border border-blue-500/50 rounded-xl p-3.5 text-center relative overflow-hidden">
                <div className="text-[10px] font-mono text-blue-400 font-semibold uppercase">
                  True Negative (TN)
                </div>
                <div className="text-2xl font-bold font-mono text-blue-300 mt-1">{m.trueNegatives}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Correctly classified normal</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono text-center pt-2">
              Ground Truth: {totalPositives} Anomalies | {totalNegatives} Normal Sessions
            </div>
          </div>
        </div>

        {/* Detailed Statistical Equations & Breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Empirical Statistical Scores & Formula Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-mono">N = {m.totalSamples} sessions</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Accuracy */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Accuracy (TP+TN)/Total</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{m.accuracy}%</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                ({m.truePositives} + {m.trueNegatives}) / {m.totalSamples}
              </div>
            </div>

            {/* Precision */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Precision TP/(TP+FP)</div>
              <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{m.precision}%</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                {m.truePositives} / ({m.truePositives} + {m.falsePositives})
              </div>
            </div>

            {/* Recall */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Recall TP/(TP+FN)</div>
              <div className="text-xl font-bold font-mono text-amber-300 mt-1">{m.recall}%</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                {m.truePositives} / ({m.truePositives} + {m.falseNegatives})
              </div>
            </div>

            {/* F1-Score */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">F1-Score (Harmonic Mean)</div>
              <div className="text-xl font-bold font-mono text-purple-300 mt-1">{m.f1Score}%</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                2 × (P × R) / (P + R)
              </div>
            </div>

            {/* False Positive Rate */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">False Positive Rate (FPR)</div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1">{m.falsePositiveRate}%</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                FP / (FP + TN)
              </div>
            </div>

            {/* False Negative Rate */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">False Negative Rate (FNR)</div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1">{m.falseNegativeRate}%</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                FN / (FN + TP)
              </div>
            </div>
          </div>

          {/* Model Qualitative Description */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1">
            <span className="text-cyan-400 font-semibold uppercase font-mono">{currentModel.modelName}</span>
            <p className="text-slate-300 leading-relaxed">{currentModel.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
