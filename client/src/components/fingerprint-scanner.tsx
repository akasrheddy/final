interface FingerprintScannerProps {
  status: string;
  isScanning: boolean;
  step?: string; // Added step prop to track registration/verification process
  errorCode?: string; // Added error code for specific error handling
}

export default function FingerprintScanner({ status, isScanning, step, errorCode }: FingerprintScannerProps) {
  // Define the status color
  const getStatusColor = () => {
    if (status.includes("verified") || status.includes("registered") || status.includes("success")) {
      return "text-green-600";
    }
    if (status.includes("failed") || status.includes("Error") || status.includes("error")) {
      return "text-red-500";
    }
    if (status.includes("Place") || status.includes("Remove")) {
      return "text-amber-500 font-bold";
    }
    return "text-primary";
  };
  
  // Get instruction based on current step in the enrollment process
  const getInstruction = () => {
    if (!step) return "Place your finger on the scanner";
    
    switch (step) {
      case "PLACE_FINGER":
        return "Place your finger on the scanner";
      case "IMAGE_TAKEN":
        return "Keep your finger still";
      case "REMOVE_FINGER":
        return "Please remove your finger from the scanner";
      case "PLACE_AGAIN":
        return "Place the SAME finger on the scanner again";
      case "ERROR":
        if (errorCode === "TEMPLATE2_ERROR") {
          return "The second scan didn't match. Try to place your finger in the exact same position.";
        } else if (errorCode === "IMAGING_ERROR") {
          return "Could not capture a clear image. Ensure your finger is clean and properly placed.";
        } else if (errorCode === "TEMPLATE_ERROR") {
          return "Could not process the fingerprint. Try a different finger position.";
        }
        return "An error occurred. Please try again.";
      default:
        return "Place your finger on the scanner";
    }
  };
  
  // Get a tip message based on current step or error
  const getTip = () => {
    if (errorCode === "TEMPLATE2_ERROR") {
      return "Try to use the same part of your finger and keep consistent pressure";
    }
    if (step === "PLACE_AGAIN") {
      return "Remember to position your finger exactly the same way as before";
    }
    if (step === "PLACE_FINGER") {
      return "Position your finger flat on the sensor with moderate pressure";
    }
    return "";
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-background">
      <div className="fingerprint-scanner mb-4 relative" id="fingerprint-scanner">
        <div className={`scanning ${isScanning ? 'block' : 'hidden'}`}></div>
        {step === "REMOVE_FINGER" && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <span className="text-amber-500 text-xs font-bold animate-pulse">Remove now</span>
          </div>
        )}
      </div>
      <div className="text-center space-y-2">
        <p className="text-neutral-medium font-medium">{getInstruction()}</p>
        <div className={`${getStatusColor()} font-semibold`}>{status}</div>
        {getTip() && (
          <div className="text-xs text-muted-foreground mt-2 max-w-xs italic">
            Tip: {getTip()}
          </div>
        )}
      </div>
    </div>
  );
}
