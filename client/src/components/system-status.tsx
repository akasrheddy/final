import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { getSystemStatus, SystemStatus as SystemStatusType } from "@/lib/arduino";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function SystemStatus() {
  const { data: status, isLoading, error } = useQuery<SystemStatusType>({
    queryKey: ['/api/status'],
    refetchInterval: 3000, // Refetch every 3 seconds for more real-time updates
  });
  
  const getStatusIcon = (isActive: boolean, type: string) => {
    if (isLoading) return "sync";
    
    if (isActive) {
      return type === "security" ? "security" : "check_circle";
    } else {
      return "error";
    }
  };
  
  const getStatusColor = (isActive: boolean) => {
    if (isLoading) return "text-primary";
    return isActive ? "text-green-600" : "text-red-500";
  };

  // Function to get appropriate badge variant
  const getBadgeVariant = (isActive: boolean): "default" | "destructive" | "outline" | "secondary" => {
    if (isLoading) return "outline";
    return isActive ? "secondary" : "destructive";
  };
  
  // Check if the fingerprint sensor is connected
  const isFingerprintConnected = status?.fingerprintSensor?.connected ?? false;
  
  // Get a detailed message about the fingerprint sensor
  const getFingerprintMessage = () => {
    if (isLoading) return "Checking fingerprint sensor status...";
    if (!status?.arduino?.connected) return "Arduino disconnected - fingerprint sensor unavailable";
    if (!isFingerprintConnected) return "Fingerprint sensor offline or not detected";
    return status?.fingerprintSensor?.message || "Fingerprint sensor ready for scanning";
  };
  
  return (
    <>
      {/* Prominent Alert for Fingerprint Sensor Status */}
      <Alert className={`mb-4 ${isFingerprintConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <span className={`material-icons ${getStatusColor(isFingerprintConnected)} mr-2`}>
          {isFingerprintConnected ? "fingerprint" : "fingerprint_error"}
        </span>
        <AlertTitle className="text-lg flex items-center">
          Fingerprint Sensor Status 
          <Badge className="ml-2" variant={getBadgeVariant(isFingerprintConnected)}>
            {isFingerprintConnected ? "CONNECTED" : "DISCONNECTED"}
          </Badge>
        </AlertTitle>
        <AlertDescription>
          {getFingerprintMessage()}
        </AlertDescription>
      </Alert>
    
      <Card className="bg-white rounded-lg shadow-md p-4">
        <CardContent className="p-0">
          <h3 className="text-lg font-semibold text-neutral-dark mb-2">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Arduino Connectivity */}
            <div className="flex items-center p-3 border rounded-md">
              <span className={`material-icons ${getStatusColor(status?.arduino?.connected ?? false)} mr-2`}>
                {getStatusIcon(status?.arduino?.connected ?? false, "normal")}
              </span>
              <div>
                <div className="text-sm font-semibold">Arduino Connectivity</div>
                <div className="text-xs text-neutral-medium">
                  {isLoading ? "Checking..." : 
                   status?.arduino?.connected ? "Connected" : "Disconnected"}
                </div>
                {status?.arduino?.message && (
                  <div className="text-xs italic mt-1">
                    {status.arduino.message}
                  </div>
                )}
              </div>
            </div>
            
            {/* Fingerprint Sensor - with enhanced UI */}
            <div className={`flex items-center p-3 border rounded-md ${isFingerprintConnected ? 'bg-green-50' : 'bg-red-50'}`}>
              <span className={`material-icons ${getStatusColor(isFingerprintConnected)} mr-2`}>
                {isFingerprintConnected ? "fingerprint" : "fingerprint_error"}
              </span>
              <div>
                <div className="text-sm font-semibold">Fingerprint Sensor</div>
                <div className={`text-xs ${isFingerprintConnected ? 'text-green-700' : 'text-red-700'} font-semibold`}>
                  {isLoading ? "Checking..." : 
                   isFingerprintConnected ? "READY" : "OFFLINE"}
                </div>
                {status?.fingerprintSensor?.message && (
                  <div className="text-xs italic mt-1">
                    {status.fingerprintSensor.message}
                  </div>
                )}
              </div>
            </div>
            
            {/* Blockchain Node */}
            <div className="flex items-center p-3 border rounded-md">
              <span className={`material-icons ${getStatusColor(status?.blockchainNode?.synced ?? false)} mr-2`}>
                {getStatusIcon(status?.blockchainNode?.synced ?? false, "normal")}
              </span>
              <div>
                <div className="text-sm font-semibold">Blockchain Node</div>
                <div className="text-xs text-neutral-medium">
                  {isLoading ? "Checking..." : 
                   status?.blockchainNode?.synced ? "Synced" : "Not Synced"}
                </div>
                {status?.blockchainNode?.message && (
                  <div className="text-xs italic mt-1">
                    {status.blockchainNode.message}
                  </div>
                )}
              </div>
            </div>
            
            {/* System Security */}
            <div className="flex items-center p-3 border rounded-md">
              <span className={`material-icons text-primary mr-2`}>
                {getStatusIcon(true, "security")}
              </span>
              <div>
                <div className="text-sm font-semibold">System Security</div>
                <div className="text-xs text-neutral-medium">
                  {isLoading ? "Checking..." : status?.systemSecurity?.status || "Protected"}
                </div>
                {status?.systemSecurity?.message && (
                  <div className="text-xs italic mt-1">
                    {status.systemSecurity.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
