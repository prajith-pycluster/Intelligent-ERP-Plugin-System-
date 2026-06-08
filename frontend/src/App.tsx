import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate, Navigate } from "react-router-dom";
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
import RestockBilling from "@/pages/RestockBilling";
import PredictiveInventory from "@/pages/PredictiveInventory";
import WarehouseDashboard from "@/pages/WarehouseDashboard";
import WarehouseInventory from "@/pages/WarehouseInventory";
import WarehouseHistory from "@/pages/WarehouseHistory";
import NotFound from "@/pages/NotFound";
import MarketBasket from "@/pages/MarketBasket";
import StockAlerts from "@/pages/StockAlerts";
import { SplashScreen } from "@/components/SplashScreen";
import { useState, useEffect } from "react";

// Import new portal components
import Login from "@/pages/Login";
import CustomerHome from "@/pages/CustomerHome";
import CustomerBrowse from "@/pages/CustomerBrowse";
import CustomerCart from "@/pages/CustomerCart";
import CustomerOrders from "@/pages/CustomerOrders";
import CustomerProfile from "@/pages/CustomerProfile";
import AdminOrders from "@/pages/AdminOrders";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRole = () => {
      const savedRole = sessionStorage.getItem("user_role");
      setUserRole(savedRole);
    };

    checkRole();

    window.addEventListener("profileUpdate", checkRole);
    window.addEventListener("storage", checkRole);
    return () => {
      window.removeEventListener("profileUpdate", checkRole);
      window.removeEventListener("storage", checkRole);
    };
  }, []);

  const handleLogin = (role: string, name?: string) => {
    sessionStorage.setItem("user_role", role);
    setUserRole(role);
    window.dispatchEvent(new Event("profileUpdate"));
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setUserRole(null);
    window.dispatchEvent(new Event("profileUpdate"));
    navigate("/");
  };

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {!userRole ? (
          <Login onLogin={handleLogin} />
        ) : (
          <Routes>
              {userRole === "customer" && (
                <>
                  {/* Customer Portal Routes */}
                  <Route path="/" element={<AppLayout><CustomerHome /></AppLayout>} />
                  <Route path="/browse" element={<AppLayout><CustomerBrowse /></AppLayout>} />
                  <Route path="/cart" element={<AppLayout><CustomerCart /></AppLayout>} />
                  <Route path="/orders" element={<AppLayout><CustomerOrders /></AppLayout>} />
                  <Route path="/profile" element={<AppLayout><CustomerProfile onLogout={handleLogout} /></AppLayout>} />
                </>
              )}
              {userRole === "admin" && (
                <>
                  {/* Admin Portal Routes */}
                  <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
                  <Route path="/insights" element={<Navigate to="/product-management?tab=insights" replace />} />
                  <Route path="/query" element={<AppLayout><QueryPanel /></AppLayout>} />
                  <Route path="/guide" element={<AppLayout><QueryGuide /></AppLayout>} />
                  <Route path="/product-management" element={<AppLayout><ProductManagement /></AppLayout>} />
                  <Route path="/predictive-inventory" element={<AppLayout><PredictiveInventory /></AppLayout>} />
                  <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
                  <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
                  <Route path="/billing" element={<AppLayout><Billing /></AppLayout>} />
                  <Route path="/godown" element={<Navigate to="/warehouse/inventory" replace />} />
                  <Route path="/warehouse/inventory" element={<AppLayout><WarehouseInventory /></AppLayout>} />
                  <Route path="/restock-billing" element={<AppLayout><RestockBilling /></AppLayout>} />
                  <Route path="/admin/orders" element={<AppLayout><AdminOrders /></AppLayout>} />
                  <Route path="/market-basket" element={<AppLayout><MarketBasket /></AppLayout>} />
                  <Route path="/stock-alerts" element={<AppLayout><StockAlerts /></AppLayout>} />
                </>
              )}
              {userRole === "warehouse" && (
                <>
                  {/* Warehouse Portal Routes */}
                  <Route path="/" element={<AppLayout><WarehouseDashboard /></AppLayout>} />
                  <Route path="/warehouse/inventory" element={<AppLayout><WarehouseInventory /></AppLayout>} />
                  <Route path="/billing" element={<AppLayout><Billing /></AppLayout>} />
                  <Route path="/warehouse/history" element={<AppLayout><WarehouseHistory /></AppLayout>} />
                  <Route path="/restock-billing" element={<AppLayout><RestockBilling /></AppLayout>} />
                  <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
                  <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
                  <Route path="/godown" element={<Navigate to="/warehouse/inventory" replace />} />
                </>
              )}
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
      </TooltipProvider>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
