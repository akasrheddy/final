import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Candidate {
  id: number;
  name: string;
  party: string;
  votes: number;
  percentage: number;
}

interface VotingStatistics {
  totalVotes: number;
  turnout: number;
  blocksCreated: number;
  timeRemaining: string;
}

export default function Results() {
  const { toast } = useToast();
  
  // Fetch election results
  const { data: results, isLoading: resultsLoading, error: resultsError } = useQuery({
    queryKey: ['/api/results'],
  });
  
  // Fetch voting statistics
  const { data: statistics, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/statistics'],
  });
  
  // Determine chart heights based on percentages
  const getBarHeight = (percentage: number) => {
    return `${Math.max(percentage, 5)}%`; // Minimum 5% height for visibility
  };
  
  // Determine bar color based on candidate index
  const getBarColor = (index: number) => {
    const colors = ['bg-primary', 'bg-accent', 'bg-secondary', 'bg-destructive', 'bg-purple-500'];
    return colors[index % colors.length];
  };
  
  // Handle blockchain view button click
  const handleViewBlockchain = () => {
    toast({
      title: "Blockchain Explorer",
      description: "Opening blockchain explorer in a new tab.",
    });
    window.open('/blockchain-explorer', '_blank');
  };
  
  // Handle download results button click
  const handleDownloadResults = () => {
    if (!results) return;
    
    // Create CSV content
    const headers = "Candidate,Party,Votes,Percentage\n";
    const rows = results.map((candidate: Candidate) => 
      `${candidate.name},${candidate.party},${candidate.votes},${candidate.percentage}%`
    ).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}${rows}`;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "election_results.csv");
    document.body.appendChild(link);
    
    // Trigger download and cleanup
    link.click();
    document.body.removeChild(link);
  };
  
  const isLoading = resultsLoading || statsLoading;
  const hasError = resultsError || statsError;
  
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card className="bg-white rounded-lg shadow-md p-6">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold text-neutral-dark mb-4">Election Results</h2>
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }
  
  if (hasError) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card className="bg-white rounded-lg shadow-md p-6">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold text-neutral-dark mb-4">Election Results</h2>
            <div className="text-center text-destructive">
              An error occurred while loading results. Please refresh the page.
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }
  
  return (
    <main className="container mx-auto px-4 py-6">
      <section className="mb-10">
        <Card className="bg-white rounded-lg shadow-md p-6">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold text-neutral-dark mb-4">Election Results</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Chart */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Vote Distribution</h3>
                <div className="h-64 flex items-end">
                  {results && results.map((candidate: Candidate, index: number) => (
                    <div key={candidate.id} className="flex flex-col items-center flex-1">
                      <div 
                        className={`w-full ${getBarColor(index)} rounded-t`} 
                        style={{ height: getBarHeight(candidate.percentage) }}
                      ></div>
                      <div className="mt-2 text-sm font-semibold">{candidate.name}</div>
                      <div className="text-neutral-medium text-sm">{candidate.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Statistics */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Voting Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-lighter p-3 rounded-lg">
                    <div className="text-sm text-neutral-medium">Total Votes</div>
                    <div className="text-2xl font-semibold">
                      {statistics ? statistics.totalVotes.toLocaleString() : '-'}
                    </div>
                  </div>
                  <div className="bg-neutral-lighter p-3 rounded-lg">
                    <div className="text-sm text-neutral-medium">Turnout</div>
                    <div className="text-2xl font-semibold">
                      {statistics ? `${statistics.turnout}%` : '-'}
                    </div>
                  </div>
                  <div className="bg-neutral-lighter p-3 rounded-lg">
                    <div className="text-sm text-neutral-medium">Blocks Created</div>
                    <div className="text-2xl font-semibold">
                      {statistics ? statistics.blocksCreated.toLocaleString() : '-'}
                    </div>
                  </div>
                  <div className="bg-neutral-lighter p-3 rounded-lg">
                    <div className="text-sm text-neutral-medium">Time Remaining</div>
                    <div className="text-2xl font-semibold">
                      {statistics ? statistics.timeRemaining : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Detailed Results Table */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Detailed Results</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Candidate</th>
                      <th className="text-left py-3 px-4">Party</th>
                      <th className="text-left py-3 px-4">Votes</th>
                      <th className="text-left py-3 px-4">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results && results.map((candidate: Candidate) => (
                      <tr key={candidate.id} className="border-b">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-neutral-lighter flex items-center justify-center mr-3">
                              <span className="material-icons text-sm text-neutral-medium">person</span>
                            </div>
                            <span>{candidate.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{candidate.party}</td>
                        <td className="py-3 px-4">{candidate.votes.toLocaleString()}</td>
                        <td className="py-3 px-4">{candidate.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Blockchain Verification */}
            <div className="border rounded-lg p-4 mt-6">
              <h3 className="font-semibold mb-4">Blockchain Verification</h3>
              <p className="text-neutral-medium mb-4">
                Verify the integrity of the voting process by inspecting the blockchain.
              </p>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                <Button 
                  onClick={handleViewBlockchain}
                  className="bg-primary hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition flex items-center"
                >
                  <span className="material-icons mr-2">visibility</span>
                  View Blockchain
                </Button>
                <Button 
                  onClick={handleDownloadResults}
                  className="bg-neutral-medium hover:bg-neutral-dark text-white font-semibold py-2 px-4 rounded-md transition flex items-center"
                >
                  <span className="material-icons mr-2">download</span>
                  Download Results
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
