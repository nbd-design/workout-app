import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";

// Get the base path from the environment or default to '/workout-app'
const base = import.meta.env.BASE_URL || '/workout-app/';

// Create a base-aware routing hook
const useBasePath = () => {
  const hasBase = window.location.pathname.startsWith(base);
  return hasBase ? window.location.pathname.slice(base.length) || '/' : window.location.pathname;
};

function Router() {
  return (
    <WouterRouter hook={useBasePath}>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
