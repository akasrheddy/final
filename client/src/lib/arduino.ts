import { apiRequest } from "./queryClient";

export interface FingerprintStatus {
  connected: boolean;
  message: string;
}

export interface ArduinoStatus {
  connected: boolean;
  message: string;
}

export interface SystemStatus {
  arduino: ArduinoStatus;
  fingerprintSensor: FingerprintStatus;
  blockchainNode: {
    connected: boolean;
    synced: boolean;
    message: string;
  };
  systemSecurity: {
    status: string;
    message: string;
  };
}

// Get the current status of the Arduino and fingerprint sensor
export async function getSystemStatus(): Promise<SystemStatus> {
  const response = await fetch('/api/status');
  return await response.json();
}

// Register a new fingerprint
export async function registerFingerprint(voterID: string): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest('POST', '/api/fingerprints/register', { voterID });
  return await response.json();
}

// Verify a fingerprint
export async function verifyFingerprint(voterID: string): Promise<{ success: boolean; message: string; verified: boolean }> {
  const response = await apiRequest('POST', '/api/fingerprints/verify', { voterID });
  return await response.json();
}
