import { BleClient } from '@capacitor-community/bluetooth-le';

export interface BleDevice {
  deviceId: string; // MAC address or UUID
  name: string;
  rssi?: number;
  serviceUuids?: string[];
  connected: boolean;
}

export type TelemetryCallback = (distance: number) => void;

class BluetoothService {
  private static instance: BluetoothService;
  private isInitialized: boolean = false;
  private scanning: boolean = false;
  private connectedDevice: BleDevice | null = null;
  private telemetryCallbacks: Map<string, TelemetryCallback> = new Map();

  private constructor() {}

  public static getInstance(): BluetoothService {
    if (!BluetoothService.instance) {
      BluetoothService.instance = new BluetoothService();
    }
    return BluetoothService.instance;
  }

  // UI Compatibility Helper Toggles (Always return false/no-op)
  public isSimulationMode(): boolean {
    return false;
  }

  public setSimulationMode(mode: boolean): void {}

  public isMock(): boolean {
    return false;
  }

  /**
   * Initializes the Bluetooth client.
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    try {
      await BleClient.initialize();
      this.isInitialized = true;
      console.log('[BLE Service] Native/Web Bluetooth LE Client initialized successfully.');
      return true;
    } catch (error) {
      console.error('[BLE Service] Failed to initialize Bluetooth LE Client:', error);
      throw error;
    }
  }

  /**
   * Checks if Bluetooth is enabled (or requests to enable it on Android).
   */
  public async ensureBluetoothEnabled(): Promise<boolean> {
    const isWeb = (window as any).Capacitor === undefined || ((window as any).Capacitor.getPlatform() !== 'android' && (window as any).Capacitor.getPlatform() !== 'ios');
    if (isWeb) return true; // Web browsers handle power prompts natively inside the requestDevice dialog

    await this.initialize();
    try {
      const isEnabled = await BleClient.isEnabled();
      if (!isEnabled) {
        await BleClient.requestEnable();
      }
      return true;
    } catch (e) {
      console.error('[BLE Service] Error verifying Bluetooth power state:', e);
      return false;
    }
  }

  /**
   * Starts scanning for BLE devices.
   */
  public async startScan(onDeviceDiscovered: (device: BleDevice) => void): Promise<void> {
    // Real BLE Mode
    const isWeb = (window as any).Capacitor === undefined || ((window as any).Capacitor.getPlatform() !== 'android' && (window as any).Capacitor.getPlatform() !== 'ios');

    if (isWeb) {
      console.log('[BLE Service] Scanning real-world BLE devices using web requestDevice...');
      try {
        await this.initialize();
        const device = await BleClient.requestDevice({
          services: ['ffe0', '19b10000-e8f2-537e-4f6c-d104768a1214', '180d']
        });
        if (device) {
          onDeviceDiscovered({
            deviceId: device.deviceId,
            name: device.name || 'Unknown Device',
            connected: false
          });
        }
      } catch (error) {
        console.error('[BLE Service] Web Bluetooth selection canceled/failed:', error);
        throw error;
      }
      return;
    }

    // Native Mobile Mode (Android/iOS background scan)
    await this.ensureBluetoothEnabled();
    if (this.scanning) return;
    this.scanning = true;

    try {
      await BleClient.requestLEScan(
        {
          allowDuplicates: false,
        },
        (result) => {
          if (result && result.device) {
            onDeviceDiscovered({
              deviceId: result.device.deviceId,
              name: result.device.name || result.localName || 'Unknown Device',
              rssi: result.rssi,
              serviceUuids: result.uuids,
              connected: false
            });
          }
        }
      );
    } catch (error) {
      console.error('[BLE Service] Native BLE Scan failed:', error);
      this.scanning = false;
      throw error;
    }
  }

  /**
   * Stops scanning.
   */
  public async stopScan(): Promise<void> {
    const isWeb = (window as any).Capacitor === undefined || ((window as any).Capacitor.getPlatform() !== 'android' && (window as any).Capacitor.getPlatform() !== 'ios');
    if (isWeb) return; // Browsers handle stopping scans automatically

    if (!this.scanning) return;
    this.scanning = false;
    try {
      await BleClient.stopLEScan();
    } catch (error) {
      console.error('[BLE Service] Error stopping BLE scan:', error);
    }
  }

  /**
   * Connects to a specific BLE device.
   */
  public async connect(deviceId: string, onDisconnect: () => void): Promise<BleDevice> {
    await this.initialize();
    await this.stopScan();

    try {
      console.log(`[BLE Service] Connecting to device: ${deviceId}`);
      await BleClient.connect(deviceId, () => {
        console.warn(`[BLE Service] Disconnected from device: ${deviceId}`);
        this.connectedDevice = null;
        this.telemetryCallbacks.clear();
        onDisconnect();
      });

      this.connectedDevice = {
        deviceId,
        name: 'Connected BLE Device',
        connected: true
      };

      console.log(`[BLE Service] Bluetooth connection established.`);
      return this.connectedDevice;
    } catch (error) {
      console.error(`[BLE Service] Failed to connect to device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Disconnects from the current device.
   */
  public async disconnect(deviceId: string): Promise<void> {
    try {
      await BleClient.disconnect(deviceId);
      this.connectedDevice = null;
      this.telemetryCallbacks.clear();
    } catch (error) {
      console.error(`[BLE Service] Error during disconnection:`, error);
    }
  }

  /**
   * Subscribes to telemetry distance notifications.
   */
  public async startTelemetryNotifications(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
    onDataReceived: TelemetryCallback
  ): Promise<void> {
    const key = `${deviceId}-${serviceUuid}-${characteristicUuid}`;
    this.telemetryCallbacks.set(key, onDataReceived);

    try {
      console.log(`[BLE Service] Subscribing to notifications. Service: ${serviceUuid}, Char: ${characteristicUuid}`);
      await BleClient.startNotifications(
        deviceId,
        serviceUuid,
        characteristicUuid,
        (value: DataView) => {
          const distance = this.parseTelemetryValue(value);
          onDataReceived(distance);
        }
      );
    } catch (error) {
      console.error('[BLE Service] Error starting telemetry notifications:', error);
      throw error;
    }
  }

  /**
   * Stops telemetry notifications.
   */
  public async stopTelemetryNotifications(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<void> {
    const key = `${deviceId}-${serviceUuid}-${characteristicUuid}`;
    this.telemetryCallbacks.delete(key);
    try {
      await BleClient.stopNotifications(deviceId, serviceUuid, characteristicUuid);
    } catch (error) {
      console.error('[BLE Service] Error stopping notifications:', error);
    }
  }

  public setMockDistance(distance: number): void {}

  public getConnectedDevice(): BleDevice | null {
    return this.connectedDevice;
  }

  private parseTelemetryValue(value: DataView): number {
    try {
      if (value.byteLength === 0) return 0;
      if (value.byteLength === 4) {
        return value.getFloat32(0, true);
      }
      if (value.byteLength === 1) {
        return value.getUint8(0) / 100.0;
      }
      if (value.byteLength === 2) {
        return value.getUint16(0, true) / 100.0;
      }
      const decoder = new TextDecoder('utf-8');
      const textValue = decoder.decode(value).trim();
      const cleaned = textValue.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) {
        return parsed > 10 ? parsed / 100.0 : parsed;
      }
      return 1.0;
    } catch (e) {
      console.error('[BLE Service] Telemetry parsing failure:', e);
      return 1.0;
    }
  }
}

export default BluetoothService;
