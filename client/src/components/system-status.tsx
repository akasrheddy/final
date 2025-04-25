import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { getSystemStatus } from "@/lib/arduino";

export default function SystemStatus() {
  const { data: status, isLoading, error } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 10000, // Refetch every 10 seconds
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
  
  return (
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
            </div>
          </div>
          
          {/* Fingerprint Sensor */}
          <div className="flex items-center p-3 border rounded-md">
            <span className={`material-icons ${getStatusColor(status?.fingerprintSensor?.connected ?? false)} mr-2`}>
              {getStatusIcon(status?.fingerprintSensor?.connected ?? false, "normal")}
            </span>
            <div>
              <div className="text-sm font-semibold">Fingerprint Sensor</div>
              <div className="text-xs text-neutral-medium">
                {isLoading ? "Checking..." : 
                 status?.fingerprintSensor?.connected ? "Online" : "Offline"}
              </div>
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
                {isLoading ? "Checking..." : "Protected"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
