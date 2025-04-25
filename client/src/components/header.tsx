import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface BlockchainStatus {
  active: boolean;
  blockCount: number;
  latestHash: string;
}

export default function Header() {
  // Fetch blockchain status
  const { data: status } = useQuery<BlockchainStatus>({
    queryKey: ['/api/blockchain/status'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <header className="bg-primary shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h1 className="text-white text-xl font-semibold ml-2">SecureVote</h1>
          </Link>
        </div>
        
        <nav className="hidden md:flex space-x-6 text-white">
          <Link href="/" className="hover:text-accent transition">
            Home
          </Link>
          <Link href="/voting" className="hover:text-accent transition">
            Vote
          </Link>
          <Link href="/results" className="hover:text-accent transition">
            Results
          </Link>
          <Link href="/blockchain" className="hover:text-accent transition">
            Blockchain
          </Link>
        </nav>
        
        <div className="text-white text-sm">
          <span className="inline-flex items-center">
            <span className="mr-1">Blockchain Status:</span>
            <span className={`inline-block h-2 w-2 rounded-full ${status?.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="ml-1">{status?.active ? 'Active' : 'Inactive'}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
