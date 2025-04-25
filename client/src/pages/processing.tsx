import { useEffect, useState, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import ProgressRing from "@/components/progress-ring";
import { submitVote } from "@/lib/blockchain";
import { useToast } from "@/hooks/use-toast";

export default function Processing() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/processing');
  const { toast } = useToast();
  
  // Progress states
  const [overallProgress, setOverallProgress] = useState(0);
  const [bioProgress, setBioProgress] = useState(0);
  const [identityProgress, setIdentityProgress] = useState(0);
  const [blockchainProgress, setBlockchainProgress] = useState(0);
  const [voteProgress, setVoteProgress] = useState(0);
  
  // Verified states
  const [isBioVerified, setIsBioVerified] = useState(false);
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [isBlockchainVerified, setIsBlockchainVerified] = useState(false);
  const [isVoteVerified, setIsVoteVerified] = useState(false);
  
  // Status message
  const [statusMessage, setStatusMessage] = useState("Initializing secure voting process...");
  
  // Transaction details
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  const candidateId = window.history.state?.candidateId;
  const voterId = sessionStorage.getItem('voterId') || '1'; // Fallback to 1 if not set
  
  // Refs to store intervals
  const bioIntervalRef = useRef<number | null>(null);
  const identityIntervalRef = useRef<number | null>(null);
  const blockchainIntervalRef = useRef<number | null>(null);
  const voteIntervalRef = useRef<number | null>(null);
  
  // Clear all intervals on unmount
  useEffect(() => {
    return () => {
      [bioIntervalRef, identityIntervalRef, blockchainIntervalRef, voteIntervalRef].forEach(ref => {
        if (ref.current) window.clearInterval(ref.current);
      });
    };
  }, []);
  
  // Start the processing simulation on component mount
  useEffect(() => {
    if (!candidateId) {
      toast({
        title: "Error",
        description: "No candidate selected. Please return to voting page.",
        variant: "destructive",
      });
      setLocation("/voting");
      return;
    }
    
    // Start the processing steps
    startProcessing();
  }, []);
  
  const startProcessing = () => {
    // Step 1: Biometric verification
    setTimeout(stepOne, 500);
  };
  
  const stepOne = () => {
    let progress = 0;
    bioIntervalRef.current = window.setInterval(() => {
      progress += 5;
      setBioProgress(progress);
      setOverallProgress(Math.min(25, progress / 4));
      
      if (progress >= 100) {
        if (bioIntervalRef.current) window.clearInterval(bioIntervalRef.current);
        setIsBioVerified(true);
        setStatusMessage("Biometric verification complete...");
        setTimeout(stepTwo, 500);
      }
    }, 100);
  };
  
  const stepTwo = () => {
    let progress = 0;
    identityIntervalRef.current = window.setInterval(() => {
      progress += 5;
      setIdentityProgress(progress);
      setOverallProgress(25 + Math.min(25, progress / 4));
      
      if (progress >= 100) {
        if (identityIntervalRef.current) window.clearInterval(identityIntervalRef.current);
        setIsIdentityVerified(true);
        setStatusMessage("Identity validation complete...");
        setTimeout(stepThree, 500);
      }
    }, 150);
  };
  
  const stepThree = () => {
    let progress = 0;
    blockchainIntervalRef.current = window.setInterval(() => {
      progress += 2;
      setBlockchainProgress(progress);
      setOverallProgress(50 + Math.min(25, progress / 4));
      
      if (progress >= 100) {
        if (blockchainIntervalRef.current) window.clearInterval(blockchainIntervalRef.current);
        setIsBlockchainVerified(true);
        setStatusMessage("Blockchain transaction complete...");
        
        // Actually submit the vote here
        submitVote(voterId, candidateId.toString())
          .then(transaction => {
            setTransactionId(transaction.id);
            setTimeout(stepFour, 500);
          })
          .catch(err => {
            toast({
              title: "Error",
              description: "Failed to submit vote to blockchain. Please try again.",
              variant: "destructive",
            });
            setLocation("/voting");
          });
      }
    }, 200);
  };
  
  const stepFour = () => {
    let progress = 0;
    voteIntervalRef.current = window.setInterval(() => {
      progress += 5;
      setVoteProgress(progress);
      setOverallProgress(75 + Math.min(25, progress / 4));
      
      if (progress >= 100) {
        if (voteIntervalRef.current) window.clearInterval(voteIntervalRef.current);
        setIsVoteVerified(true);
        setStatusMessage("Vote successfully recorded!");
        
        // Store transaction ID for success page
        if (transactionId) {
          sessionStorage.setItem('transactionId', transactionId);
        }
        
        // Navigate to success page after completion
        setTimeout(() => {
          setLocation("/success");
        }, 1000);
      }
    }, 100);
  };
  
  return (
    <main className="container mx-auto px-4 py-6">
      <section className="mb-10">
        <Card className="bg-white rounded-lg shadow-md p-6">
          <CardContent className="p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold text-neutral-dark mb-6">Processing Your Vote</h2>
            
            <div className="relative w-32 h-32 mb-6">
              <ProgressRing progress={overallProgress} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-semibold text-primary">{Math.round(overallProgress)}%</span>
              </div>
            </div>
            
            <div className="w-full max-w-md">
              <div className="mb-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="material-icons text-primary mr-2">fingerprint</span>
                  Biometric Verification
                  {isBioVerified && <span className="ml-2 text-green-600">✓</span>}
                </h3>
                <div className="h-2 bg-neutral-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${bioProgress}%` }}></div>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="material-icons text-primary mr-2">verified_user</span>
                  Identity Validation
                  {isIdentityVerified && <span className="ml-2 text-green-600">✓</span>}
                </h3>
                <div className="h-2 bg-neutral-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${identityProgress}%` }}></div>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="material-icons text-primary mr-2">link</span>
                  Blockchain Transaction
                  {isBlockchainVerified && <span className="ml-2 text-green-600">✓</span>}
                </h3>
                <div className="h-2 bg-neutral-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${blockchainProgress}%` }}></div>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="material-icons text-primary mr-2">how_to_vote</span>
                  Vote Confirmation
                  {isVoteVerified && <span className="ml-2 text-green-600">✓</span>}
                </h3>
                <div className="h-2 bg-neutral-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${voteProgress}%` }}></div>
                </div>
              </div>
            </div>
            
            <p className="text-neutral-medium mt-4">{statusMessage}</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
