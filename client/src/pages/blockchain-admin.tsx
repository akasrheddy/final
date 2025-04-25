import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, Clock, Award, Users, Vote } from "lucide-react";
import { 
  getConnectedAccount, 
  getCandidateCount, 
  getElectionResults, 
  getTotalVotes, 
  getVotingStatus, 
  startVoting, 
  endVoting, 
  registerCandidate, 
  registerVoter, 
  setBiometricVerification 
} from '@/lib/ethereum';
import EthereumConnector from '@/components/ethereum-connector';

export default function BlockchainAdmin() {
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [candidateName, setCandidateName] = useState('');
  const [candidateParty, setCandidateParty] = useState('');
  const [voterAddress, setVoterAddress] = useState('');
  const [voterId, setVoterId] = useState('');
  const [verifyAddress, setVerifyAddress] = useState('');
  const [votingDuration, setVotingDuration] = useState(60); // Default 60 minutes
  
  // Fetch connected account
  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const acc = await getConnectedAccount();
        setAccount(acc);
      } catch (err: any) {
        console.error("Error fetching account:", err);
      }
    };
    
    fetchAccount();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);
  
  // Fetch voting data
  const { data: candidateCount, refetch: refetchCandidateCount } = useQuery({
    queryKey: ['candidateCount'],
    queryFn: getCandidateCount,
    enabled: !!account,
    refetchOnWindowFocus: false
  });
  
  const { data: totalVotes, refetch: refetchTotalVotes } = useQuery({
    queryKey: ['totalVotes'],
    queryFn: getTotalVotes,
    enabled: !!account,
    refetchOnWindowFocus: false
  });
  
  const { data: votingStatus, refetch: refetchVotingStatus } = useQuery({
    queryKey: ['votingStatus'],
    queryFn: getVotingStatus,
    enabled: !!account,
    refetchOnWindowFocus: false,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  
  const { data: electionResults, refetch: refetchResults } = useQuery({
    queryKey: ['electionResults'],
    queryFn: getElectionResults,
    enabled: !!account,
    refetchOnWindowFocus: false
  });
  
  // Handle candidate registration
  const handleRegisterCandidate = async () => {
    if (!candidateName || !candidateParty) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await registerCandidate(candidateName, candidateParty);
      setSuccess(`Successfully registered candidate: ${candidateName}`);
      setCandidateName('');
      setCandidateParty('');
      refetchCandidateCount();
      refetchResults();
    } catch (err: any) {
      console.error("Error registering candidate:", err);
      setError(err.message || "Failed to register candidate");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle voter registration
  const handleRegisterVoter = async () => {
    if (!voterAddress || !voterId) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await registerVoter(voterAddress, voterId);
      setSuccess(`Successfully registered voter: ${voterId}`);
      setVoterAddress('');
      setVoterId('');
    } catch (err: any) {
      console.error("Error registering voter:", err);
      setError(err.message || "Failed to register voter");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle biometric verification
  const handleVerifyBiometric = async () => {
    if (!verifyAddress) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await setBiometricVerification(verifyAddress);
      setSuccess(`Successfully verified biometrics for: ${verifyAddress}`);
      setVerifyAddress('');
    } catch (err: any) {
      console.error("Error verifying biometrics:", err);
      setError(err.message || "Failed to verify biometrics");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle start voting
  const handleStartVoting = async () => {
    if (!votingDuration) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await startVoting(votingDuration);
      setSuccess(`Successfully started voting for ${votingDuration} minutes`);
      refetchVotingStatus();
    } catch (err: any) {
      console.error("Error starting voting:", err);
      setError(err.message || "Failed to start voting");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle end voting
  const handleEndVoting = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await endVoting();
      setSuccess('Successfully ended voting period');
      refetchVotingStatus();
      refetchResults();
      refetchTotalVotes();
    } catch (err: any) {
      console.error("Error ending voting:", err);
      setError(err.message || "Failed to end voting");
    } finally {
      setLoading(false);
    }
  };
  
  // Format remaining time
  const formatRemainingTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return "No time remaining";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // If no wallet connected
  if (!account) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Blockchain Administration</h1>
        <p className="mb-6 text-muted-foreground">
          Connect your Ethereum wallet to manage the blockchain voting system
        </p>
        
        <EthereumConnector />
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Blockchain Administration</h1>
      <p className="mb-6 text-muted-foreground">
        Manage the blockchain-based voting system with secure smart contracts
      </p>
      
      <div className="grid gap-6">
        <EthereumConnector />
        
        {/* Status Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current status of the blockchain voting system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <h3 className="font-medium">Candidates</h3>
                </div>
                <p className="text-2xl font-bold">
                  {candidateCount !== undefined ? candidateCount.toString() : '-'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Registered candidates
                </p>
              </div>
              
              <div className="p-4 border rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Vote className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium">Votes</h3>
                </div>
                <p className="text-2xl font-bold">
                  {totalVotes !== undefined ? totalVotes.toString() : '-'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total votes cast
                </p>
              </div>
              
              <div className="p-4 border rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  <h3 className="font-medium">Voting Status</h3>
                </div>
                <p className="text-sm font-medium">
                  {votingStatus ? (
                    votingStatus.isActive ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )
                  ) : '-'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {votingStatus && votingStatus.isActive && (
                    <>Remaining: {formatRemainingTime(votingStatus.remainingTime)}</>
                  )}
                </p>
              </div>
            </div>
            
            {/* Results Preview */}
            {electionResults && electionResults.candidateIds.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Current Results</h3>
                <div className="space-y-2">
                  {electionResults.candidateIds.map((id, index) => {
                    const totalVotesCast = electionResults.voteCounts.reduce((sum, count) => 
                      sum + Number(count.toString()), 0);
                    const voteCount = Number(electionResults.voteCounts[index].toString());
                    const percentage = totalVotesCast > 0 
                      ? ((voteCount / totalVotesCast) * 100).toFixed(1) 
                      : '0';
                    
                    return (
                      <div key={id.toString()} className="p-3 border rounded-md">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{electionResults.names[index]}</span>
                          <span className="text-sm">{electionResults.parties[index]}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="w-full bg-neutral-100 rounded-full h-2.5 mr-4">
                            <div 
                              className="bg-primary h-2.5 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium whitespace-nowrap">
                            {voteCount} ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                refetchCandidateCount();
                refetchTotalVotes();
                refetchVotingStatus();
                refetchResults();
              }}
            >
              Refresh Data
            </Button>
            
            {votingStatus && (
              votingStatus.isActive ? (
                <Button 
                  variant="destructive" 
                  onClick={handleEndVoting}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  End Voting
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  onClick={handleStartVoting}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Start Voting
                </Button>
              )
            )}
          </CardFooter>
        </Card>
        
        {/* Tabs for different admin functions */}
        <Tabs defaultValue="candidates">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="candidates">Add Candidates</TabsTrigger>
            <TabsTrigger value="voters">Register Voters</TabsTrigger>
            <TabsTrigger value="voting">Voting Controls</TabsTrigger>
          </TabsList>
          
          {/* Add Candidates */}
          <TabsContent value="candidates">
            <Card>
              <CardHeader>
                <CardTitle>Add Candidates</CardTitle>
                <CardDescription>
                  Register new candidates for the election
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <AlertCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Candidate Name</Label>
                    <Input 
                      id="name" 
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="Enter candidate name"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="party">Political Party</Label>
                    <Input 
                      id="party" 
                      value={candidateParty}
                      onChange={(e) => setCandidateParty(e.target.value)}
                      placeholder="Enter political party"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleRegisterCandidate}
                  disabled={!candidateName || !candidateParty || loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Register Candidate
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Register Voters */}
          <TabsContent value="voters">
            <Card>
              <CardHeader>
                <CardTitle>Register Voters</CardTitle>
                <CardDescription>
                  Register voters and verify biometric data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <AlertCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Register New Voter</h3>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="voterAddress">Ethereum Address</Label>
                      <Input 
                        id="voterAddress" 
                        value={voterAddress}
                        onChange={(e) => setVoterAddress(e.target.value)}
                        placeholder="0x..."
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="voterId">Voter ID</Label>
                      <Input 
                        id="voterId" 
                        value={voterId}
                        onChange={(e) => setVoterId(e.target.value)}
                        placeholder="Enter voter ID"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleRegisterVoter}
                    disabled={!voterAddress || !voterId || loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Register Voter
                  </Button>
                </div>
                
                <div className="pt-4 border-t space-y-4">
                  <h3 className="text-sm font-medium">Verify Biometric Data</h3>
                  <div className="grid gap-2">
                    <Label htmlFor="biometricAddress">Ethereum Address</Label>
                    <Input 
                      id="biometricAddress" 
                      value={verifyAddress}
                      onChange={(e) => setVerifyAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  
                  <Button 
                    variant="secondary"
                    className="w-full" 
                    onClick={handleVerifyBiometric}
                    disabled={!verifyAddress || loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Verify Biometric Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Voting Controls */}
          <TabsContent value="voting">
            <Card>
              <CardHeader>
                <CardTitle>Voting Controls</CardTitle>
                <CardDescription>
                  Manage the voting process
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <AlertCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <div className="p-4 border rounded-md bg-neutral-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                      <h3 className="font-medium">Voting Status</h3>
                    </div>
                    <p className="mb-1">
                      Current Status: 
                      <span className={`ml-2 font-medium ${
                        votingStatus?.isActive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {votingStatus?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                    {votingStatus?.isActive && (
                      <p className="text-sm">
                        Time Remaining: {formatRemainingTime(votingStatus.remainingTime)}
                      </p>
                    )}
                  </div>
                  
                  {!votingStatus?.isActive && (
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="duration">Voting Duration (minutes)</Label>
                        <Input 
                          id="duration" 
                          type="number"
                          min="1"
                          value={votingDuration}
                          onChange={(e) => setVotingDuration(parseInt(e.target.value))}
                        />
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={handleStartVoting}
                        disabled={!votingDuration || loading}
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Start Voting
                      </Button>
                    </div>
                  )}
                  
                  {votingStatus?.isActive && (
                    <Button 
                      variant="destructive" 
                      className="w-full" 
                      onClick={handleEndVoting}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      End Voting
                    </Button>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  Note: Once voting is ended, it cannot be restarted for the same election. 
                  You would need to deploy a new contract.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}