import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CandidateCard from "@/components/candidate-card";
import { useToast } from "@/hooks/use-toast";

export default function Voting() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);

  // Fetch candidates
  const { data: candidates, isLoading, error } = useQuery({
    queryKey: ['/api/candidates'],
  });

  const handleCastVote = async () => {
    if (!selectedCandidateId) {
      toast({
        title: "Selection Required",
        description: "Please select a candidate before casting your vote.",
        variant: "destructive",
      });
      return;
    }

    try {
      // We'll handle the actual vote submission in the processing page
      navigate("/processing", { state: { candidateId: selectedCandidateId } });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card className="bg-white rounded-lg shadow-md p-6 mb-6">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold text-neutral-dark mb-4">Cast Your Vote</h2>
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Card className="bg-white rounded-lg shadow-md p-6 mb-6">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold text-neutral-dark mb-4">Cast Your Vote</h2>
            <div className="text-center text-destructive">
              An error occurred while loading candidates. Please refresh the page.
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <section id="voting-section" className="mb-10">
        <Card className="bg-white rounded-lg shadow-md p-6">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold text-neutral-dark mb-4">Cast Your Vote</h2>
            
            <p className="mb-6 text-neutral-medium">
              Select one candidate from the list below to cast your vote. Your vote will be securely recorded on the blockchain.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {candidates && candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={selectedCandidateId === candidate.id}
                  onSelect={() => setSelectedCandidateId(candidate.id)}
                />
              ))}
            </div>
            
            <div className="flex flex-col md:flex-row md:justify-between items-center border-t pt-4">
              <div className="mb-4 md:mb-0 text-neutral-medium">
                <span className="text-sm">You can cast your vote only once. This action cannot be undone.</span>
              </div>
              <Button 
                onClick={handleCastVote}
                disabled={!selectedCandidateId}
                className="bg-secondary hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-md transition"
              >
                Cast Vote
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
