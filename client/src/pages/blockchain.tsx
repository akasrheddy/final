import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Block } from "@/lib/blockchain";

interface BlockchainResponse {
  blocks: Block[];
}

interface BlockchainStatus {
  active: boolean;
  blockCount: number;
  latestHash: string;
}

export default function Blockchain() {
  const { data: blocksData, isLoading, error } = useQuery<BlockchainResponse>({
    queryKey: ['/api/blockchain'],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: status } = useQuery<BlockchainStatus>({
    queryKey: ['/api/blockchain/status'],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Convert timestamp to readable format
  const formatDate = (timestamp: string | number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Format data for better display
  const formatData = (data: any) => {
    if (typeof data === 'object') {
      return <pre className="text-xs overflow-auto max-h-20">{JSON.stringify(data, null, 2)}</pre>;
    }
    return data;
  };

  // Truncate hash for display
  const truncateHash = (hash: string) => {
    if (!hash) return '';
    return hash.length > 15 ? `${hash.substring(0, 7)}...${hash.substring(hash.length - 7)}` : hash;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Blockchain Explorer</h1>
      
      {/* Blockchain Status Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Blockchain Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-sm text-neutral-medium">Status</span>
              <span className="text-lg font-semibold">
                {status?.active ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-500">Inactive</span>
                )}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-neutral-medium">Total Blocks</span>
              <span className="text-lg font-semibold">{status?.blockCount || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-neutral-medium">Latest Hash</span>
              <span className="text-lg font-mono">
                {status?.latestHash ? truncateHash(status.latestHash) : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Blockchain Blocks */}
      <h2 className="text-2xl font-semibold mb-4">Blocks</h2>
      
      {isLoading ? (
        <div className="text-center py-10">Loading blockchain data...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">
          Error loading blockchain data. Please try again later.
        </div>
      ) : blocksData?.blocks && blocksData.blocks.length > 0 ? (
        <div className="space-y-6">
          {blocksData.blocks.map((block: Block) => (
            <Card key={block.hash} className="overflow-hidden">
              <CardHeader className="bg-neutral-lighter">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    Block #{block.index}
                  </CardTitle>
                  <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {formatDate(block.timestamp)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium w-1/4">Hash</TableCell>
                      <TableCell className="font-mono break-all">{block.hash}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Previous Hash</TableCell>
                      <TableCell className="font-mono break-all">{block.previousHash}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Nonce</TableCell>
                      <TableCell>{block.nonce}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Data</TableCell>
                      <TableCell>{formatData(block.data)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          No blocks found in the blockchain.
        </div>
      )}
    </div>
  );
}