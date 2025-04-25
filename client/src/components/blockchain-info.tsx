import { Card, CardContent } from "@/components/ui/card";

export default function BlockchainInfo() {
  return (
    <section id="blockchain-info">
      <Card className="bg-white rounded-lg shadow-md p-6">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold text-neutral-dark mb-4">About Blockchain Voting</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-4">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-3">
                <span className="material-icons text-primary">verified</span>
              </div>
              <h3 className="font-semibold mb-2">Secure & Tamper-Proof</h3>
              <p className="text-sm text-neutral-medium">
                The blockchain ensures that once a vote is recorded, it cannot be altered. 
                Each vote becomes a permanent part of a public ledger that anyone can verify.
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="rounded-full bg-green-600/10 w-12 h-12 flex items-center justify-center mb-3">
                <span className="material-icons text-green-600">fingerprint</span>
              </div>
              <h3 className="font-semibold mb-2">Biometric Authentication</h3>
              <p className="text-sm text-neutral-medium">
                Your fingerprint ensures that only you can cast your vote. 
                The R307 fingerprint sensor provides accurate identification and prevents unauthorized access.
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="rounded-full bg-accent/10 w-12 h-12 flex items-center justify-center mb-3">
                <span className="material-icons text-accent">visibility</span>
              </div>
              <h3 className="font-semibold mb-2">Transparent & Verifiable</h3>
              <p className="text-sm text-neutral-medium">
                Anyone can verify the election results by examining the blockchain. 
                This transparency ensures trust while maintaining the anonymity of individual voters.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
