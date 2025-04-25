import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getVoteTransaction } from "@/lib/blockchain";
import { useToast } from "@/hooks/use-toast";

interface TransactionDetails {
  id: string;
  blockNumber: number;
  timestamp: string;
}

export default function Success() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  
  useEffect(() => {
    const transactionId = sessionStorage.getItem('transactionId');
    if (!transactionId) {
      // If no transaction ID is found, we can't show details
      setTransaction({
        id: "Unknown",
        blockNumber: 0,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Fetch transaction details
    getVoteTransaction(transactionId)
      .then(data => {
        setTransaction({
          id: data.id,
          blockNumber: data.blockNumber,
          timestamp: data.timestamp
        });
      })
      .catch(err => {
        toast({
          title: "Error",
          description: "Failed to fetch transaction details.",
          variant: "destructive",
        });
        setTransaction({
          id: transactionId,
          blockNumber: 0,
          timestamp: new Date().toISOString()
        });
      });
  }, []);
  
  const handleViewResults = () => {
    navigate("/results");
  };
  
  // Format transaction ID for display (truncate if too long)
  const formatTransactionId = (id: string) => {
    if (id.length > 20) {
      return `${id.substring(0, 10)}...${id.substring(id.length - 5)}`;
    }
    return id;
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()} UTC`;
    } catch (e) {
      return timestamp;
    }
  };
  
  return (
    <main className="container mx-auto px-4 py-6">
      <section className="mb-10">
        <Card className="bg-white rounded-lg shadow-md p-6">
          <CardContent className="p-4 text-center">
            <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-white text-4xl">check</span>
            </div>
            
            <h2 className="text-xl font-semibold text-neutral-dark mb-2">Vote Successfully Cast!</h2>
            <p className="text-neutral-medium mb-6">Your vote has been securely recorded on the blockchain.</p>
            
            <div className="bg-neutral-lighter rounded-lg p-4 max-w-md mx-auto mb-6">
              <h3 className="font-semibold mb-2">Transaction Details</h3>
              {transaction ? (
                <>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-neutral-medium">Transaction ID:</span>
                    <span className="text-sm font-mono">{formatTransactionId(transaction.id)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-neutral-medium">Block Number:</span>
                    <span className="text-sm">{transaction.blockNumber.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-medium">Timestamp:</span>
                    <span className="text-sm">{formatTimestamp(transaction.timestamp)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleViewResults}
              className="bg-primary hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition"
            >
              View Election Results
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
