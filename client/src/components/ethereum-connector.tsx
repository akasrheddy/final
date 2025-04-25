import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertCircle } from "lucide-react";
import { connectWallet, getConnectedAccount, isMetaMaskInstalled, CONTRACT_ADDRESS } from '@/lib/ethereum-web3';

export default function EthereumConnector() {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if MetaMask is installed on component mount
  useEffect(() => {
    setHasMetaMask(isMetaMaskInstalled());
    
    // Try to get the connected account
    const checkConnection = async () => {
      try {
        const connectedAccount = await getConnectedAccount();
        setAccount(connectedAccount);
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    };
    
    if (isMetaMaskInstalled()) {
      checkConnection();
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
    
    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  // Handle wallet connection
  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    
    try {
      const connectedAccount = await connectWallet();
      setAccount(connectedAccount);
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      setErrorMessage(error.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (!hasMetaMask) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            MetaMask Not Detected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            To use blockchain voting features, you need to install the MetaMask browser extension.
          </p>
          <Button 
            onClick={() => window.open('https://metamask.io/download/', '_blank')}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Install MetaMask
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="h-6 w-6" />
          Blockchain Wallet
        </CardTitle>
        <CardDescription>
          Connect your Ethereum wallet to enable secure blockchain voting
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Wallet Status:</span>
            <Badge variant={account ? "secondary" : "outline"}>
              {account ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          
          {account && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Your Address:</span>
              <Badge variant="outline" className="font-mono">
                {formatAddress(account)}
              </Badge>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Network:</span>
            <Badge>Sepolia Testnet</Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Contract:</span>
            <Badge variant="outline" className="font-mono text-xs">
              {CONTRACT_ADDRESS ? formatAddress(CONTRACT_ADDRESS) : "Not Set"}
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {!account ? (
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        ) : (
          <div className="w-full flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={handleConnect}>
              Switch Account
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-green-600 font-medium">Ready for Voting</span>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}