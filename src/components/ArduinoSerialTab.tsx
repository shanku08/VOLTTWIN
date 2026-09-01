import React, { useState } from 'react';
import { ArduinoConnectionState, SerialTelemetryPacket } from '../types';
import { webSerialManager } from '../hardware/webSerial';
import { ARDUINO_SKETCH_CODE } from '../data/embeddedSourceCode';
import { downloadFile } from '../data/exportTemplates';
import {
  Usb,
  Power,
  Activity,
  Terminal,
  FileCode,
  Download,
  Copy,
  Check,
  Cpu,
  AlertTriangle,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface ArduinoSerialTabProps {
  arduinoState: ArduinoConnectionState;
  latestSerialPacket: SerialTelemetryPacket | null;
}

export const ArduinoSerialTab: React.FC<ArduinoSerialTabProps> = ({
  arduinoState,
  latestSerialPacket,
}) => {
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [virtualFaultProfile, setVirtualFaultProfile] = useState<
    'NORMAL' | 'CURRENT_LEAKAGE' | 'VOLTAGE_SURGE' | 'THERMAL_OVERHEAT'
  >('NORMAL');
  const [copiedSketch, setCopiedSketch] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'TERMINAL' | 'INO_CODE'>('TERMINAL');

  const isWebSerialSupported = webSerialManager.isWebSerialSupported();

  const handleConnectPhysical = async () => {
    await webSerialManager.connectPhysical(baudRate);
  };

  const handleStartVirtual = () => {
    webSerialManager.startVirtualArduino(baudRate, virtualFaultProfile);
  };

  const handleDisconnect = async () => {
    await webSerialManager.disconnect();
  };

  const handleClearTerminal = () => {
    webSerialManager.clearBuffer();
  };

  const handleCopySketch = () => {
    navigator.clipboard.writeText(ARDUINO_SKETCH_CODE);
    setCopiedSketch(true);
    setTimeout(() => setCopiedSketch(false), 2000);
  };

  const handleDownloadSketch = () => {
    downloadFile(ARDUINO_SKETCH_CODE, 'ev_monitor.ino', 'text/x-csrc');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Connection Control Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Usb className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Arduino Uno USB Hardware Bridge</h2>
                <span
                  className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                    arduinoState.isConnected
                      ? arduinoState.isVirtual
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {arduinoState.isConnected
                    ? arduinoState.isVirtual
                      ? '● Virtual Arduino Active (1 Hz Stream)'
                      : '● Physical USB Serial Connected'
                    : '○ Hardware Disconnected'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct browser WebSerial API integration with automatic fallback and fail-safe disconnect handling
              </p>
            </div>
          </div>

          {/* Connection Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Baud selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Baud:</span>
              <select
                value={baudRate}
                onChange={(e) => setBaudRate(parseInt(e.target.value))}
                disabled={arduinoState.isConnected}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value={9600}>9600</option>
                <option value={19200}>19200</option>
                <option value={38400}>38400</option>
                <option value={57600}>57600</option>
                <option value={115200}>115200 (Default)</option>
                <option value={230400}>230400</option>
              </select>
            </div>

            {/* Virtual Fault Profile Selector (When not connected or testing) */}
            {!arduinoState.isConnected && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Profile:</span>
                <select
                  value={virtualFaultProfile}
                  onChange={(e) => setVirtualFaultProfile(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="NORMAL">Nominal (400V / 125A)</option>
                  <option value="CURRENT_LEAKAGE">Leakage Fault (+28% Draw)</option>
                  <option value="VOLTAGE_SURGE">Surge Step Fault (+35%)</option>
                  <option value="THERMAL_OVERHEAT">Thermal Overheat Drift</option>
                </select>
              </div>
            )}

            {arduinoState.isConnected ? (
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-md shadow-rose-600/20 cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Disconnect Arduino</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleConnectPhysical}
                  className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold px-4 py-2 rounded-lg transition shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Usb className="w-3.5 h-3.5" />
                  <span>Connect Physical Arduino (USB)</span>
                </button>

                <button
                  onClick={handleStartVirtual}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-semibold px-4 py-2 rounded-lg transition shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Launch Virtual Arduino Uno</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Real-time Connection Status Line */}
        <div className="pt-3 text-xs text-slate-400 font-mono flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-semibold">Status:</span>
            <span className="text-cyan-300">{arduinoState.statusText}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>RX Packets: <strong className="text-slate-200">{arduinoState.rxPacketCount}</strong></span>
            <span>Dropped: <strong className="text-slate-400">{arduinoState.droppedPackets}</strong></span>
            <span>Port: <strong className="text-slate-300">{arduinoState.portName || 'None'}</strong></span>
          </div>
        </div>
      </div>

      {/* Real-time Hardware Telemetry Gauges (When Connected) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Analog Voltage (ADC)</div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
            {latestSerialPacket ? latestSerialPacket.voltageV.toFixed(1) : '398.2'} <span className="text-xs font-normal text-slate-400">V DC</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pin A0 (Divider Scaled)</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Analog Current (ADC)</div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">
            {latestSerialPacket ? latestSerialPacket.currentA.toFixed(1) : '124.5'} <span className="text-xs font-normal text-slate-400">A DC</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pin A1 (ACS712 Transducer)</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Active Real Power</div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
            {latestSerialPacket ? latestSerialPacket.powerKw.toFixed(2) : '49.58'} <span className="text-xs font-normal text-slate-400">kW</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Computed on Arduino CPU</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Cumulative Measured Energy</div>
          <div className="text-xl font-bold font-mono text-purple-300 mt-1">
            {latestSerialPacket ? latestSerialPacket.actualEnergyKwh.toFixed(3) : '18.420'} <span className="text-xs font-normal text-slate-400">kWh</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Riemann Sum Integration</div>
        </div>
      </div>

      {/* Dual Tab Panel: Live Serial Monitor Console vs ev_monitor.ino Code */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab('TERMINAL')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                activeCodeTab === 'TERMINAL'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Live Serial Monitor Log</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('INO_CODE')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                activeCodeTab === 'INO_CODE'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Arduino Firmware (ev_monitor.ino)</span>
            </button>
          </div>

          {activeCodeTab === 'TERMINAL' && (
            <button
              onClick={handleClearTerminal}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700 transition cursor-pointer"
              title="Clear terminal buffer"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Clear Terminal</span>
            </button>
          )}

          {activeCodeTab === 'INO_CODE' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySketch}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded border border-slate-700 transition"
              >
                {copiedSketch ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSketch ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownloadSketch}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded border border-slate-700 transition"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>Download .ino</span>
              </button>
            </div>
          )}
        </div>

        {activeCodeTab === 'TERMINAL' ? (
          <div className="p-4 bg-slate-950 font-mono text-xs text-emerald-400 h-80 overflow-y-auto space-y-1">
            <div className="text-slate-500 pb-2 border-b border-slate-900">
              --- Serial Communication Terminal (Baud: {baudRate}) ---
            </div>
            {arduinoState.rawBuffer.length === 0 ? (
              <div className="text-slate-500 italic py-4">
                No serial packets ingested yet. Click "Connect Physical Arduino (USB)" or "Launch Virtual Arduino Uno" to start receiving real-time hardware telemetry.
              </div>
            ) : (
              arduinoState.rawBuffer.map((line, idx) => (
                <div key={idx} className="leading-relaxed hover:bg-slate-900/50 px-1 rounded">
                  {line}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 h-96 overflow-y-auto">
            <pre className="text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
              {ARDUINO_SKETCH_CODE}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
