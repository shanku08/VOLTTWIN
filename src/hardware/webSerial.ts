import { ArduinoConnectionState, SerialTelemetryPacket } from '../types';

type PacketCallback = (packet: SerialTelemetryPacket, rawLine: string) => void;
type StatusCallback = (state: ArduinoConnectionState) => void;

class WebSerialManager {
  private port: any = null;
  private reader: any = null;
  private isReading = false;
  private virtualTimer: any = null;
  private packetCallback: PacketCallback | null = null;
  private statusCallback: StatusCallback | null = null;

  private stateListeners: Set<(state: ArduinoConnectionState) => void> = new Set();
  private packetListeners: Set<(packet: SerialTelemetryPacket) => void> = new Set();

  public state: ArduinoConnectionState = {
    isConnected: false,
    baudRate: 115200,
    isVirtual: false,
    rxPacketCount: 0,
    txPacketCount: 0,
    droppedPackets: 0,
    rawBuffer: [],
    statusText: 'Disconnected (Ready to connect physical Arduino or launch virtual serial)',
  };

  public getState(): ArduinoConnectionState {
    return this.state;
  }

  public onStateChange(listener: (state: ArduinoConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public onPacket(listener: (packet: SerialTelemetryPacket) => void): () => void {
    this.packetListeners.add(listener);
    return () => {
      this.packetListeners.delete(listener);
    };
  }

  public init(onPacket?: PacketCallback, onStatus?: StatusCallback) {
    if (onPacket) this.packetCallback = onPacket;
    if (onStatus) this.statusCallback = onStatus;

    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      (navigator as any).serial.addEventListener('disconnect', () => {
        this.handleDisconnect('Physical Arduino device disconnected from USB port.');
      });
    }
  }

  public isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /**
   * Connects to real physical Arduino via Web Serial API.
   */
  public async connectPhysical(baudRate: number = 115200): Promise<boolean> {
    if (!this.isWebSerialSupported()) {
      this.updateState({
        statusText: 'Web Serial API is not supported in this browser. Please use Chrome/Edge or start Virtual Arduino.',
      });
      return false;
    }

    try {
      this.updateState({ statusText: 'Requesting USB Serial port authorization...' });
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate });

      this.updateState({
        isConnected: true,
        isVirtual: false,
        baudRate,
        portName: 'Arduino Uno (USB Serial)',
        statusText: `Connected to physical Arduino at ${baudRate} baud.`,
      });

      this.startReading();
      return true;
    } catch (err: any) {
      const errorMsg = err?.message || 'Port request cancelled or denied';
      this.updateState({
        isConnected: false,
        statusText: `Physical connection notice: ${errorMsg}. (Note: WebSerial requires HTTPS & Chromium. You can launch the built-in Virtual Arduino Uno below for zero-setup hardware emulation).`,
      });
      return false;
    }
  }

  /**
   * Starts Virtual Arduino hardware simulation mode with customizable fault injection profile.
   */
  public startVirtualArduino(
    baudRate: number = 115200,
    faultProfile: 'NORMAL' | 'CURRENT_LEAKAGE' | 'VOLTAGE_SURGE' | 'THERMAL_OVERHEAT' = 'NORMAL'
  ): boolean {
    this.stopVirtualArduino();
    if (this.port) {
      this.disconnectPhysical();
    }

    const profileLabels = {
      NORMAL: 'Nominal Calibration (400V / 125A)',
      CURRENT_LEAKAGE: 'Fault Simulation: Current Leakage & Over-consumption (+28%)',
      VOLTAGE_SURGE: 'Fault Simulation: Voltage Transient Step Surge (+35%)',
      THERMAL_OVERHEAT: 'Fault Simulation: Thermal Runaway & Resistance Loss',
    };

    this.updateState({
      isConnected: true,
      isVirtual: true,
      baudRate,
      portName: 'Virtual Arduino Uno (USB Emulation /dev/ttyUSB0)',
      statusText: `Virtual Arduino Uno active — [${profileLabels[faultProfile]}] transmitting ADC frames at 1 Hz.`,
    });

    let frameCount = 0;
    let cumulativeEnergy = 0;

    this.virtualTimer = setInterval(() => {
      frameCount++;
      let voltage = 398.5 + Math.sin(frameCount * 0.2) * 3.5;
      let current = 124.8 + Math.cos(frameCount * 0.15) * 3.0;
      let temp = 26.5 + Math.sin(frameCount * 0.05) * 2.0;

      // Apply fault profiles
      if (faultProfile === 'CURRENT_LEAKAGE') {
        current = current * 1.28 + (Math.random() * 4 - 2); // 28% excess draw
        temp += Math.min(25, frameCount * 0.5); // temperature rise
      } else if (faultProfile === 'VOLTAGE_SURGE') {
        voltage = frameCount % 6 < 3 ? 465.0 + Math.random() * 10 : voltage; // surge spikes
        current = current * 1.15;
      } else if (faultProfile === 'THERMAL_OVERHEAT') {
        temp = 48.0 + Math.min(35, frameCount * 1.2);
        current = current * 1.20;
      }

      const power = (voltage * current) / 1000;
      cumulativeEnergy += (power * (1 / 3600));

      const packet: SerialTelemetryPacket = {
        sessionId: `ARD-SESS-${String(frameCount).padStart(4, '0')}`,
        chargerId: 'ARD-PORT-01',
        voltageV: parseFloat(voltage.toFixed(1)),
        currentA: parseFloat(current.toFixed(1)),
        powerKw: parseFloat(power.toFixed(2)),
        actualEnergyKwh: parseFloat(cumulativeEnergy.toFixed(3)),
        ambientTempC: parseFloat(temp.toFixed(1)),
        checksumValid: true,
      };

      const rawJson = JSON.stringify({
        v: packet.voltageV,
        i: packet.currentA,
        p: packet.powerKw,
        e: packet.actualEnergyKwh,
        t: packet.ambientTempC,
        chk: 'OK',
      });

      this.processRawLine(rawJson, packet);
    }, 1000);

    return true;
  }

  public clearBuffer() {
    this.updateState({
      rawBuffer: [],
      rxPacketCount: 0,
      droppedPackets: 0,
    });
  }

  public stopVirtualArduino() {
    if (this.virtualTimer) {
      clearInterval(this.virtualTimer);
      this.virtualTimer = null;
    }
  }

  /**
   * Disconnects any active physical or virtual serial connection.
   */
  public async disconnect(): Promise<void> {
    if (this.state.isVirtual) {
      this.stopVirtualArduino();
      this.updateState({
        isConnected: false,
        isVirtual: false,
        portName: undefined,
        statusText: 'Virtual Arduino disconnected.',
      });
      return;
    }

    await this.disconnectPhysical();
  }

  private async disconnectPhysical(): Promise<void> {
    this.isReading = false;
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (e) {
      // safe cleanup
    }

    this.updateState({
      isConnected: false,
      isVirtual: false,
      portName: undefined,
      statusText: 'Physical Arduino disconnected safely.',
    });
  }

  private handleDisconnect(reason: string) {
    this.stopVirtualArduino();
    this.isReading = false;
    this.reader = null;
    this.port = null;

    this.updateState({
      isConnected: false,
      statusText: `Connection terminated: ${reason}. System fallback to standalone simulation.`,
    });
  }

  private async startReading() {
    if (!this.port || this.isReading) return;
    this.isReading = true;

    try {
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
      this.reader = textDecoder.readable.getReader();

      let lineBuffer = '';

      while (this.isReading) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          lineBuffer += value;
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 0) {
              this.parsePhysicalPacket(trimmed);
            }
          }
        }
      }
    } catch (err: any) {
      if (this.isReading) {
        this.handleDisconnect(err?.message || 'Read error');
      }
    }
  }

  private parsePhysicalPacket(rawLine: string) {
    try {
      // Security guard: Limit maximum line size to prevent buffer bloat
      if (rawLine.length > 2048) {
        this.updateState({
          droppedPackets: this.state.droppedPackets + 1,
          rawBuffer: [...this.state.rawBuffer.slice(-49), `[OVERSIZED DROPPED]: line length ${rawLine.length} exceeds 2048 bytes`],
        });
        return;
      }

      // Supports JSON formatted packet: {"v": 402.1, "i": 125.0, "p": 50.2, "e": 14.8, "t": 28.0}
      // Or CSV formatted packet: 402.1,125.0,50.2,14.8,28.0
      if (rawLine.startsWith('{') && rawLine.endsWith('}')) {
        const data = JSON.parse(rawLine);
        // Security bounds clamping
        const voltage = typeof data.v === 'number' && Number.isFinite(data.v) ? Math.max(0, Math.min(1500, data.v)) : 400.0;
        const current = typeof data.i === 'number' && Number.isFinite(data.i) ? Math.max(0, Math.min(1000, data.i)) : 50.0;
        const power = typeof data.p === 'number' && Number.isFinite(data.p) ? Math.max(0, Math.min(1000, data.p)) : (voltage * current) / 1000;
        const energy = typeof data.e === 'number' && Number.isFinite(data.e) ? Math.max(0, Math.min(5000, data.e)) : 0;
        const temp = typeof data.t === 'number' && Number.isFinite(data.t) ? Math.max(-50, Math.min(100, data.t)) : 25.0;

        const packet: SerialTelemetryPacket = {
          sessionId: `ARD-PHYS-${Date.now().toString().slice(-4)}`,
          chargerId: 'ARD-PHYS-01',
          voltageV: parseFloat(voltage.toFixed(1)),
          currentA: parseFloat(current.toFixed(1)),
          powerKw: parseFloat(power.toFixed(2)),
          actualEnergyKwh: parseFloat(energy.toFixed(3)),
          ambientTempC: parseFloat(temp.toFixed(1)),
          checksumValid: true,
        };
        this.processRawLine(rawLine, packet);
      } else {
        // Parse CSV or comma separated numbers
        const tokens = rawLine.split(',').map((t) => parseFloat(t.trim()));
        const voltage = Number.isFinite(tokens[0]) ? Math.max(0, Math.min(1500, tokens[0])) : 400;
        const current = Number.isFinite(tokens[1]) ? Math.max(0, Math.min(1000, tokens[1])) : 50;
        const power = Number.isFinite(tokens[2]) ? Math.max(0, Math.min(1000, tokens[2])) : (voltage * current) / 1000;
        const energy = Number.isFinite(tokens[3]) ? Math.max(0, Math.min(5000, tokens[3])) : 0;
        const temp = Number.isFinite(tokens[4]) ? Math.max(-50, Math.min(100, tokens[4])) : 25;

        const packet: SerialTelemetryPacket = {
          sessionId: `ARD-PHYS-${Date.now().toString().slice(-4)}`,
          chargerId: 'ARD-PHYS-01',
          voltageV: parseFloat(voltage.toFixed(1)),
          currentA: parseFloat(current.toFixed(1)),
          powerKw: parseFloat(power.toFixed(2)),
          actualEnergyKwh: parseFloat(energy.toFixed(3)),
          ambientTempC: parseFloat(temp.toFixed(1)),
          checksumValid: true,
        };
        this.processRawLine(rawLine, packet);
      }
    } catch (e) {
      this.updateState({
        droppedPackets: this.state.droppedPackets + 1,
        rawBuffer: [...this.state.rawBuffer.slice(-49), `[CORRUPT]: ${rawLine.slice(0, 80)}`],
      });
    }
  }

  private processRawLine(rawLine: string, packet: SerialTelemetryPacket) {
    const rawBuffer = [...this.state.rawBuffer.slice(-49), `[RX ${new Date().toLocaleTimeString()}]: ${rawLine}`];
    this.updateState({
      lastMessageTimestamp: Date.now(),
      rxPacketCount: this.state.rxPacketCount + 1,
      rawBuffer,
    });

    if (this.packetCallback) {
      this.packetCallback(packet, rawLine);
    }
    this.packetListeners.forEach((fn) => fn(packet));
  }

  private updateState(partial: Partial<ArduinoConnectionState>) {
    this.state = { ...this.state, ...partial };
    if (this.statusCallback) {
      this.statusCallback(this.state);
    }
    this.stateListeners.forEach((fn) => fn(this.state));
  }
}

export const webSerialManager = new WebSerialManager();
