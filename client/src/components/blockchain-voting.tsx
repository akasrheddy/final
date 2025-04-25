import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Vote, Check, Clock, X } from "lucide-react";
import { getConnectedAccount, getVoterStatus, castVote, getVotingStatus } from '@/lib/ethereum';
import EthereumConnector from './ethereum-connector';

interface Candidate {
  id: number;
  name: string;
  party: string;
}

interface BlockchainVotingProps {
  candidates: Candidate[];
  voterId: string;
}

export default function BlockchainVoting({ candidates, voterId }: BlockchainVotingProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [voterStatus, setVoterStatus] = useState({
    isRegistered: false,
    hasBiometricVerification: false,
    hasVoted: false,
    votedFor: 0
  });
  const [votingStatus, setVotingStatus] = useState({
    isActive: false,
    startTime: 0,
    endTime: 0,
    remainingTime: 0
  });

  // Check connected account and voter status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get connected account
        const connectedAccount = await getConnectedAccount();
        setAccount(connectedAccount);
        
        if (connectedAccount) {
          // Get voter status
          const status = await getVoterStatus(connectedAccount);
          setVoterStatus({
            isRegistered: status.isRegistered,
            hasBiometricVerification: status.hasBiometricVerification,
            hasVoted: status.hasVoted,
            votedFor: status.votedFor.toNumber()
          });
          
          // Get voting status
          const vStatus = await getVotingStatus();
          setVotingStatus({
            isActive: vStatus.isActive,
            startTime: vStatus.startTime.toNumber(),
            endTime: vStatus.endTime.toNumber(),
            remainingTime: vStatus.remainingTime.toNumber()
          });
        }
      } catch (err: any) {
        console.error("Error checking voter status:", err);
        setError(err.message || "Failed to check voter status");
      } finally {
        setLoading(false);
      }
    };
    
    checkStatus();
    
    // Set up interval to refresh remaining time
    const interval = setInterval(() => {
      if (votingStatus.isActive && votingStatus.remainingTime > 0) {
        setVotingStatus(prev => ({
          ...prev,
          remainingTime: Math.max(0, prev.remainingTime - 1)
        }));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [account]);

  // Handle vote submission
  const handleVote = async () => {
    if (!selectedCandidate) return;
    
    try {
      setVoting(true);
      setError(null);
      
      // Cast vote on the blockchain
      await castVote(selectedCandidate);
      
      // Update voter status
      setVoterStatus(prev => ({
        ...prev,
        hasVoted: true,
        votedFor: selectedCandidate
      }));
      
    } catch (err: any) {
      console.error("Error casting vote:", err);
      setError(err.message || "Failed to cast vote");
    } finally {
      setVoting(false);
    }
  };

  // Format remaining time
  const formatRemainingTime = (seconds: number) => {
    if (seconds <= 0) return "Voting ended";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if the user can vote
  const canVote = account && 
                  voterStatus.isRegistered && 
                  voterStatus.hasBiometricVerification && 
                  !voterStatus.hasVoted && 
                  votingStatus.isActive;

  // If loading
  if (loading) {
    return (
      <div className="w-full flex flex-col space-y-4">
        <EthereumConnector />
        <Card className="w-full">
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading blockchain voting status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user needs to connect wallet
  if (!account) {
    return (
      <div className="w-full flex flex-col space-y-4">
        <EthereumConnector />
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Blockchain Voting</CardTitle>
            <CardDescription>
              Connect your wallet to participate in secure blockchain-based voting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wallet Required</AlertTitle>
              <AlertDescription>
                Please connect your Ethereum wallet using the panel above to access the voting system.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If voting has ended
  if (!votingStatus.isActive && votingStatus.endTime > 0) {
    return (
      <div className="w-full flex flex-col space-y-4">
        <EthereumConnector />
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Voting Has Ended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="bg-neutral-50 border-neutral-200">
              <Clock className="h-4 w-4" />
              <AlertTitle>Voting Period Closed</AlertTitle>
              <AlertDescription>
                The voting period has ended. Thank you for participating in this secure blockchain election.
              </AlertDescription>
            </Alert>
            
            {voterStatus.hasVoted && (
              <div className="mt-4 p-4 border rounded-md bg-green-50 border-green-200">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Your Vote Was Recorded
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You voted for: {candidates.find(c => c.id === voterStatus.votedFor)?.name || `Candidate #${voterStatus.votedFor}`}
                </p>
                <p className="text-xs mt-2">
                  Your vote is permanently recorded on the blockchain and cannot be altered.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // If voting is not active yet
  if (!votingStatus.isActive) {
    return (
      <div className="w-full flex flex-col space-y-4">
        <EthereumConnector />
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Voting Not Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Waiting For Voting To Begin</AlertTitle>
              <AlertDescription>
                The voting period has not started yet. Please check back later.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user has already voted
  if (voterStatus.hasVoted) {
    return (
      <div className="w-full flex flex-col space-y-4">
        <EthereumConnector />
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Vote Recorded
            </CardTitle>
            <CardDescription>
              Your vote has been securely recorded on the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-md bg-green-50 border-green-200">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Your Vote Was Successful
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                You voted for: {candidates.find(c => c.id === voterStatus.votedFor)?.name || `Candidate #${voterStatus.votedFor}`}
              </p>
              <p className="text-xs mt-2">
                Your vote is permanently recorded on the blockchain and cannot be altered.
              </p>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Voting Time Remaining:</span>
                <Badge variant="outline">
                  {formatRemainingTime(votingStatus.remainingTime)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is not registered or verified
  if (!voterStatus.isRegistered || !voterStatus.hasBiometricVerification) {
    return (
      <div className="w-full flex flex-col space-y-4">
        <EthereumConnector />
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Verification Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not Eligible To Vote</AlertTitle>
              <AlertDescription>
                {!voterStatus.isRegistered 
                  ? "Your wallet is not registered in the voting system." 
                  : "You need biometric verification before voting."}
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Wallet Registration:</span>
                <Badge variant={voterStatus.isRegistered ? "secondary" : "destructive"}>
                  {voterStatus.isRegistered ? "Complete" : "Required"}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Biometric Verification:</span>
                <Badge variant={voterStatus.hasBiometricVerification ? "secondary" : "destructive"}>
                  {voterStatus.hasBiometricVerification ? "Verified" : "Required"}
                </Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Please complete the verification process to participate in blockchain voting.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main voting interface
  return (
    <div className="w-full flex flex-col space-y-4">
      <EthereumConnector />
      
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-primary" />
                Blockchain Voting
              </CardTitle>
              <CardDescription>
                Cast your vote securely on the Ethereum blockchain
              </CardDescription>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRemainingTime(votingStatus.remainingTime)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <p className="text-sm mb-4">
            Select a candidate and submit your vote. This action cannot be undone.
          </p>
          
          <div className="grid gap-3">
            {candidates.map((candidate) => (
              <div 
                key={candidate.id}
                className={`p-4 border rounded-md cursor-pointer transition-colors ${
                  selectedCandidate === candidate.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-neutral-300'
                }`}
                onClick={() => setSelectedCandidate(candidate.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{candidate.name}</h3>
                    <p className="text-sm text-muted-foreground">{candidate.party}</p>
                  </div>
                  <div className="h-5 w-5 rounded-full border flex items-center justify-center">
                    {selectedCandidate === candidate.id && (
                      <div className="h-3 w-3 rounded-full bg-primary"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full"
            disabled={!selectedCandidate || voting}
            onClick={handleVote}
          >
            {voting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Submit Vote</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}