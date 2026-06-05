import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import ProductInsights from "@/pages/ProductInsights";
import QueryPanel from "@/pages/QueryPanel";
import QueryGuide from "@/pages/QueryGuide";
import ProductManagement from "@/pages/ProductManagement";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Billing from "@/pages/Billing";
import Godown from "@/pages/Godown";
import RestockBilling from "@/pages/RestockBilling";
import PredictiveInventory from "@/pages/PredictiveInventory";
import NotFound from "@/pages/NotFound";
import { SplashScreen } from "@/components/SplashScreen";
import { useState } from "react";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/insights" element={<AppLayout><ProductInsights /></AppLayout>} />
            <Route path="/query" element={<AppLayout><QueryPanel /></AppLayout>} />
            <Route path="/guide" element={<AppLayout><QueryGuide /></AppLayout>} />
            <Route path="/product-management" element={<AppLayout><ProductManagement /></AppLayout>} />
            <Route path="/predictive-inventory" element={<AppLayout><PredictiveInventory /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
            <Route path="/billing" element={<AppLayout><Billing /></AppLayout>} />
            <Route path="/godown" element={<AppLayout><Godown /></AppLayout>} />
            <Route path="/restock-billing" element={<AppLayout><RestockBilling /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
