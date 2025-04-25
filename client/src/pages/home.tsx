import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import AuthenticationSection from "@/components/authentication-section";
import BlockchainInfo from "@/components/blockchain-info";

export default function Home() {
  const [_, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleVerificationSuccess = () => {
    setIsProcessing(true);
    // Navigate to voting page after successful verification
    setTimeout(() => {
      navigate("/voting");
    }, 1000);
  };

  const handleAdminAccess = () => {
    if (adminPassword === "123456") {
      navigate("/admin");
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-8 flex justify-end">
        <Button 
          variant="outline" 
          className="bg-primary/10 hover:bg-primary/20" 
          onClick={() => setAdminDialogOpen(true)}
        >
          Admin Access
        </Button>
      </div>

      <AuthenticationSection onVerificationSuccess={handleVerificationSuccess} />
      <BlockchainInfo />

      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Access</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdminAccess}>Access Admin Panel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
