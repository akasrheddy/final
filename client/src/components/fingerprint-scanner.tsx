interface FingerprintScannerProps {
  status: string;
  isScanning: boolean;
}

export default function FingerprintScanner({ status, isScanning }: FingerprintScannerProps) {
  // Define the status color
  const getStatusColor = () => {
    if (status.includes("verified") || status.includes("registered")) {
      return "text-green-600";
    }
    if (status.includes("failed") || status.includes("Error")) {
      return "text-red-500";
    }
    return "text-primary";
  };
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="fingerprint-scanner mb-4" id="fingerprint-scanner">
        <div className={`scanning ${isScanning ? 'block' : 'hidden'}`}></div>
      </div>
      <div className="text-center">
        <p className="text-neutral-medium mb-2">Place your finger on the scanner</p>
        <div className={`${getStatusColor()} font-semibold`}>{status}</div>
      </div>
    </div>
  );
}
