import React, { useState, useRef } from 'react';
import {
  ChargingSession,
  ThresholdSettings,
} from '../types';
import {
  exportSessionsToCSV,
  exportAnomaliesToJSON,
  downloadFile,
} from '../data/exportTemplates';
import { validateAndParseCSV, CSVValidationResult } from '../core/security';
import {
  History,
  Download,
  Upload,
  Search,
  Filter,
  FileSpreadsheet,
  FileJson,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';

interface SessionHistoryTabProps {
  sessions: ChargingSession[];
  onAddSessions: (newSessions: ChargingSession[]) => void;
  thresholds: ThresholdSettings;
  onSelectSession: (session: ChargingSession) => void;
  activeSession: ChargingSession;
  onNavigateTab?: (tab: any) => void;
}

export const SessionHistoryTab: React.FC<SessionHistoryTabProps> = ({
  sessions,
  onAddSessions,
  thresholds,
  onSelectSession,
  activeSession,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [importResult, setImportResult] = useState<CSVValidationResult | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedDetailSession, setSelectedDetailSession] = useState<ChargingSession | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered Sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.chargerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.evId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesSource = sourceFilter === 'ALL' || s.dataSource === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateAndParseCSV(content);
      setImportResult(result);
      if (result.isValid && result.sessions.length > 0) {
        onAddSessions(result.sessions);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadSampleCSVTemplate = () => {
    const sampleCsv = `timestamp,session_id,charger_id,ev_id,battery_capacity_kwh,initial_soc,target_soc,charging_power_kw,charging_efficiency,actual_energy_kwh,ambient_temp_c
2026-08-30T18:00:00Z,SESS-IMP-001,CHG-EAST-01,EV-M3-901,60.0,20.0,80.0,50.0,91.0,39.6,23.5
2026-08-30T18:45:00Z,SESS-IMP-002,CHG-EAST-01,EV-IONIQ-220,77.4,10.0,85.0,75.0,90.0,71.2,25.0
2026-08-30T19:30:00Z,SESS-IMP-003,CHG-NORTH-04,EV-TAYCAN-881,93.4,15.0,80.0,150.0,89.0,83.4,26.0
2026-08-30T20:15:00Z,SESS-IMP-004,CHG-SOUTH-02,EV-LEAF-305,40.0,25.0,75.0,22.0,88.0,28.9,28.0`;

    const res = validateAndParseCSV(sampleCsv);
    setImportResult(res);
    if (res.isValid) {
      onAddSessions(res.sessions);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Fleet Charging Session History</h2>
              <p className="text-xs text-slate-400">
                Audited historical sessions with full digital twin residuals, export tools, and secure CSV import
              </p>
            </div>
          </div>

          {/* Action CTAs: Export & Import & Manual Feed */}
          <div className="flex flex-wrap items-center gap-2">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('MANUAL_FEED')}
                className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-md shadow-cyan-950/40"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Feed Data Manually</span>
              </button>
            )}

            <button
              onClick={() => {
                const csvData = exportSessionsToCSV(sessions);
                downloadFile(csvData, `evguard_twin_sessions_${Date.now()}.csv`, 'text/csv');
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3.5 py-2 rounded-lg border border-slate-700 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                const jsonData = exportAnomaliesToJSON(sessions, thresholds);
                downloadFile(jsonData, `evguard_twin_anomalies_${Date.now()}.json`, 'application/json');
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3.5 py-2 rounded-lg border border-slate-700 transition"
            >
              <FileJson className="w-3.5 h-3.5 text-purple-400" />
              <span>Export Anomaly JSON</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-md shadow-cyan-500/20"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Session ID, Charger ID, or EV ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
          >
            <option value="ALL">All Classifications</option>
            <option value="NORMAL">Normal (&lt;5%)</option>
            <option value="WARNING">Warning (5-15%)</option>
            <option value="ANOMALY">Anomaly (&gt;15%)</option>
            <option value="SUDDEN_SPIKE">Sudden Spike</option>
            <option value="PERSISTENT_ANOMALY">Persistent Anomaly</option>
          </select>
        </div>

        {/* Source Filter Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Source:</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
          >
            <option value="ALL">All Sources</option>
            <option value="SIMULATION">Simulation</option>
            <option value="ARDUINO_SERIAL">Arduino Hardware</option>
            <option value="CSV_IMPORT">CSV Import</option>
          </select>
        </div>
      </div>

      {/* Sessions Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono">
                <th className="py-3 px-3.5">Session ID</th>
                <th className="py-3 px-3.5">Timestamp</th>
                <th className="py-3 px-3.5">Charger ID</th>
                <th className="py-3 px-3.5">EV ID</th>
                <th className="py-3 px-3.5">SOC (Init → Target)</th>
                <th className="py-3 px-3.5">Expected (kWh)</th>
                <th className="py-3 px-3.5">Actual (kWh)</th>
                <th className="py-3 px-3.5">Residual (kWh)</th>
                <th className="py-3 px-3.5">Deviation (%)</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredSessions.map((sess) => {
                const isActive = sess.id === activeSession.id;
                return (
                  <tr
                    key={sess.id}
                    className={`hover:bg-slate-800/40 transition ${
                      isActive ? 'bg-cyan-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3.5 font-bold text-slate-200">{sess.id}</td>
                    <td className="py-3 px-3.5 text-slate-400">{sess.timestamp}</td>
                    <td className="py-3 px-3.5 text-cyan-300">{sess.chargerId}</td>
                    <td className="py-3 px-3.5 text-slate-300">{sess.evId}</td>
                    <td className="py-3 px-3.5 text-slate-300">
                      {sess.initialSoc}% → {sess.targetSoc}%
                    </td>
                    <td className="py-3 px-3.5 text-slate-300">{sess.expectedEnergyKwh.toFixed(2)}</td>
                    <td className="py-3 px-3.5 text-slate-100 font-bold">{sess.actualEnergyKwh.toFixed(2)}</td>
                    <td className="py-3 px-3.5 text-purple-300">
                      {sess.residualKwh > 0 ? '+' : ''}{sess.residualKwh.toFixed(2)}
                    </td>
                    <td className={`py-3 px-3.5 font-bold ${
                      sess.deviationPercent > 15 ? 'text-rose-400' : sess.deviationPercent >= 5 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      Δ {sess.deviationPercent.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border ${
                          sess.status === 'ANOMALY' || sess.status === 'PERSISTENT_ANOMALY'
                            ? 'bg-rose-950 text-rose-400 border-rose-800/60'
                            : sess.status === 'WARNING'
                            ? 'bg-amber-950 text-amber-400 border-amber-800/60'
                            : sess.status === 'SUDDEN_SPIKE'
                            ? 'bg-purple-950 text-purple-300 border-purple-800/60'
                            : 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
                        }`}
                      >
                        {sess.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right space-x-2">
                      <button
                        onClick={() => onSelectSession(sess)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                      >
                        Load Twin
                      </button>
                      <button
                        onClick={() => setSelectedDetailSession(sess)}
                        className="text-xs text-slate-400 hover:text-slate-200"
                      >
                        Forensics
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSessions.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            No charging sessions matched the filter criteria.
          </div>
        )}
      </div>

      {/* CSV Import Modal with Security Validations */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Import Charging Sessions CSV</h3>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Upload historical EV charging session logs. All uploaded files undergo strict security sanitization, numeric bounds checking (SOC 0–100%, non-negative energy), and CSV formula injection neutralization.
              </p>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/50">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload-input"
                />
                <label htmlFor="csv-upload-input" className="cursor-pointer block space-y-2">
                  <FileSpreadsheet className="w-8 h-8 text-cyan-400 mx-auto" />
                  <div className="text-slate-200 font-semibold">Click or drag CSV file here to upload</div>
                  <div className="text-slate-400 text-[11px]">Maximum file size: 5MB | Sanitized schema validation</div>
                </label>
              </div>

              {/* Load Sample Template CTA */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Need a sample template?</span>
                <button
                  onClick={loadSampleCSVTemplate}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2"
                >
                  Load 4-Session Sample CSV
                </button>
              </div>

              {/* Import Results Box */}
              {importResult && (
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    importResult.isValid
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {importResult.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>
                      {importResult.isValid
                        ? `Successfully validated & parsed ${importResult.validRowCount} charging sessions.`
                        : 'CSV Validation Failed.'}
                    </span>
                  </div>

                  {importResult.warnings.length > 0 && (
                    <div className="text-[11px] text-amber-300 space-y-1">
                      <div className="font-semibold">Sanitization Warnings:</div>
                      {importResult.warnings.slice(0, 3).map((w, i) => (
                        <div key={i}>• {w}</div>
                      ))}
                    </div>
                  )}

                  {importResult.errors.length > 0 && (
                    <div className="text-[11px] text-rose-300 space-y-1">
                      <div className="font-semibold">Errors:</div>
                      {importResult.errors.map((e, i) => (
                        <div key={i}>• {e}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forensic Detail Modal */}
      {selectedDetailSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Forensic Diagnostic Audit: {selectedDetailSession.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailSession(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-400">Node / Charger:</span>{' '}
                  <strong className="text-cyan-300">{selectedDetailSession.chargerId}</strong>
                </div>
                <div>
                  <span className="text-slate-400">EV Identifier:</span>{' '}
                  <strong className="text-slate-200">{selectedDetailSession.evId}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Expected Grid Energy:</span>{' '}
                  <strong className="text-cyan-400">{selectedDetailSession.expectedEnergyKwh.toFixed(2)} kWh</strong>
                </div>
                <div>
                  <span className="text-slate-400">Actual Metered Energy:</span>{' '}
                  <strong className="text-slate-100">{selectedDetailSession.actualEnergyKwh.toFixed(2)} kWh</strong>
                </div>
                <div>
                  <span className="text-slate-400">Residual Energy:</span>{' '}
                  <strong className="text-purple-300">
                    {selectedDetailSession.residualKwh > 0 ? '+' : ''}{selectedDetailSession.residualKwh.toFixed(2)} kWh
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Deviation Percentage:</span>{' '}
                  <strong className={selectedDetailSession.deviationPercent > 15 ? 'text-rose-400' : 'text-emerald-400'}>
                    Δ {selectedDetailSession.deviationPercent.toFixed(2)}%
                  </strong>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <span className="text-cyan-400 font-semibold uppercase tracking-wider">Forensic Diagnostic Summary</span>
                <p className="text-slate-200 font-medium leading-relaxed">
                  {selectedDetailSession.explanation.summary}
                </p>

                <div className="pt-2">
                  <span className="text-slate-400 font-semibold">Hypothesized Physical Causes:</span>
                  <ul className="mt-1 space-y-1">
                    {selectedDetailSession.explanation.possibleCauses.map((c, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  onSelectSession(selectedDetailSession);
                  setSelectedDetailSession(null);
                }}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-semibold rounded-lg transition"
              >
                Open in Live Twin
              </button>
              <button
                onClick={() => setSelectedDetailSession(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
