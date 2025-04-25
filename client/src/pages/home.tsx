import { useState } from "react";
import { useLocation } from "wouter";
import AuthenticationSection from "@/components/authentication-section";
import BlockchainInfo from "@/components/blockchain-info";

export default function Home() {
  const [_, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVerificationSuccess = () => {
    setIsProcessing(true);
    // Navigate to voting page after successful verification
    setTimeout(() => {
      navigate("/voting");
    }, 1000);
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <AuthenticationSection onVerificationSuccess={handleVerificationSuccess} />
      <BlockchainInfo />
    </main>
  );
}
