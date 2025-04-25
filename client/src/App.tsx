import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Home from "@/pages/home";
import Voting from "@/pages/voting";
import Processing from "@/pages/processing";
import Success from "@/pages/success";
import Results from "@/pages/results";
import Blockchain from "@/pages/blockchain";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/voting" component={Voting} />
          <Route path="/processing" component={Processing} />
          <Route path="/success" component={Success} />
          <Route path="/results" component={Results} />
          <Route path="/blockchain" component={Blockchain} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
