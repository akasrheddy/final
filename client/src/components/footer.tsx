export default function Footer() {
  return (
    <footer className="bg-neutral-dark text-white mt-10 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="ml-2 font-semibold">SecureVote</span>
            </div>
            <p className="text-neutral-light text-sm mt-1">Secure Blockchain Voting System</p>
          </div>
          
          <div className="text-center md:text-right text-sm">
            <p className="text-neutral-light">© {new Date().getFullYear()} SecureVote. All rights reserved.</p>
            <p className="text-neutral-light mt-1">Built with Express.js, Blockchain, and Arduino</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
