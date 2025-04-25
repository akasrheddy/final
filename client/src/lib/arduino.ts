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

export interface FingerprintRegistrationResponse {
  success: boolean;
  message: string;
  statusCode?: string;
  fingerprintId?: number;
  originalError?: string;
}

export type FingerprintRegistrationStep = 
  | "PLACE_FINGER" 
  | "IMAGE_TAKEN" 
  | "REMOVE_FINGER" 
  | "PLACE_AGAIN" 
  | "SUCCESS" 
  | "ERROR";

export type FingerprintRegistrationCallback = (
  step: FingerprintRegistrationStep, 
  message: string, 
  errorCode?: string
) => void;

// Register a new fingerprint with real-time status updates
export async function registerFingerprint(
  voterID: string, 
  onStepUpdate?: FingerprintRegistrationCallback
): Promise<FingerprintRegistrationResponse> {
  try {
    // Initial step
    onStepUpdate?.("PLACE_FINGER", "Waiting for you to place your finger on the scanner");
    
    const response = await apiRequest('POST', '/api/fingerprints/register', { voterID });
    const result = await response.json();
    
    // Process the result
    if (result.success) {
      onStepUpdate?.("SUCCESS", result.message);
      return result;
    } else {
      // Handle specific error codes with appropriate UI feedback
      if (result.statusCode === "TEMPLATE2_ERROR") {
        onStepUpdate?.("ERROR", result.message, result.statusCode);
      } else if (result.statusCode === "IMAGING_ERROR") {
        onStepUpdate?.("ERROR", result.message, result.statusCode);
      } else {
        onStepUpdate?.("ERROR", result.message, result.statusCode);
      }
      return result;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error during fingerprint registration";
    onStepUpdate?.("ERROR", errorMessage);
    return {
      success: false,
      message: errorMessage,
      statusCode: "CONNECTION_ERROR"
    };
  }
}

// Verify a fingerprint
export async function verifyFingerprint(voterID: string): Promise<{ success: boolean; message: string; verified: boolean }> {
  const response = await apiRequest('POST', '/api/fingerprints/verify', { voterID });
  return await response.json();
}
