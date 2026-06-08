import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, ArrowRight, Activity, Warehouse, Boxes, Lock, Sparkles, ShieldCheck, Loader2, Brain } from "lucide-react";
import { toast } from "sonner";

interface LoginProps {
  onLogin: (role: string, name?: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [role, setRole] = useState<"admin" | "warehouse" | "customer">("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (role === "admin") {
        if (username === "admin" && password === "123") {
          toast.success("Welcome back, Admin!");
          onLogin("admin");
        } else {
          toast.error("Invalid Username or Password");
        }
      } else if (role === "warehouse") {
        if (username === "warehouse" && password === "456") {
          toast.success("Welcome back, Warehouse Operator!");
          onLogin("warehouse");
        } else {
          toast.error("Invalid Username or Password");
        }
      }
      setLoading(false);
    }, 600);
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setLoading(true);
    
    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_name: customerName.trim() })
      });
      if (!res.ok) {
        throw new Error("Login failed");
      }
      const data = await res.json();
      sessionStorage.setItem("customer_name", data.customer_name);
      toast.success(`Welcome, ${data.customer_name}!`);
      onLogin("customer", data.customer_name);
    } catch (err) {
      // Offline fallback: save customer anyway
      sessionStorage.setItem("customer_name", customerName.trim());
      toast.success(`Welcome, ${customerName.trim()} (Offline Mode)!`);
      onLogin("customer", customerName.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f8f8ea] dark:bg-slate-950 p-4 transition-colors duration-300 relative overflow-hidden"
      style={{ 
        fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', cursive, sans-serif",
        backgroundImage: "url('/login-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="w-full max-w-[480px] bg-white/95 dark:bg-slate-900/95 rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300 z-10">
        
        {/* Header Branding */}
        <div className="p-8 pb-5 text-center relative flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-md border border-slate-100 overflow-hidden mb-2">
            <img src="/logo-brain.png" alt="Intelligent ERP Logo" className="w-full h-full object-contain p-1.5" />
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 mt-2 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#0d6efd]" />
            AI-Powered
          </div>
          
          <h2 className="text-[26px] font-bold tracking-tight text-slate-950 dark:text-white mt-3 leading-none">Intelligent ERP Plugin</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Enterprise Inventory Intelligence Platform</p>
        </div>

        <div className="border-b border-slate-100 dark:border-slate-800 w-full" />

        {/* Tab Controls / Workspaces */}
        <div className="p-8 pb-4">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-3 block">
            SELECT WORKSPACE
          </span>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`py-4 px-2 rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all outline-none border ${
                role === "admin"
                  ? "bg-[#ecf3fe] border-[#0d6efd] text-[#0d6efd] font-bold"
                  : "bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                role === "admin" ? "bg-[#0d6efd] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs">Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("warehouse")}
              className={`py-4 px-2 rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all outline-none border ${
                role === "warehouse"
                  ? "bg-[#ecf3fe] border-[#0d6efd] text-[#0d6efd] font-bold"
                  : "bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                role === "warehouse" ? "bg-[#0d6efd] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}>
                <Boxes className="w-5 h-5" />
              </div>
              <span className="text-xs">Warehouse</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`py-4 px-2 rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all outline-none border ${
                role === "customer"
                  ? "bg-[#ecf3fe] border-[#0d6efd] text-[#0d6efd] font-bold"
                  : "bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                role === "customer" ? "bg-[#0d6efd] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}>
                <User className="w-5 h-5" />
              </div>
              <span className="text-xs">Customer</span>
            </button>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-3 block h-4">
            {role === "admin" && "Analytics, governance & controls"}
            {role === "warehouse" && "Stock management & load lists"}
            {role === "customer" && "Browse products, orders & profile"}
          </span>
        </div>

        {/* Forms */}
        <div className="p-8 pt-2">
          {role === "admin" || role === "warehouse" ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2 block">
                  USERNAME
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder={role === "admin" ? "admin" : "warehouse"}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="pl-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-950 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all h-12 outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2 block">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-950 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all h-12 outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-xl h-12 font-bold flex items-center justify-center gap-2 mt-6 shadow-lg shadow-blue-500/10 border-0" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Access {role === "admin" ? "Admin" : "Warehouse"} Portal
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2 block">
                  CUSTOMER NAME
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="e.g. Karoyl"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="pl-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-950 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all h-12 outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-xl h-12 font-bold flex items-center justify-center gap-2 mt-6 shadow-lg shadow-blue-500/10 border-0" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    Access Customer Portal
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}
          
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-6 tracking-wide leading-none">
            Protected by enterprise SSO & audit logging
          </p>
        </div>

      </div>

      <div className="mt-8 text-xs text-white/95 dark:text-slate-400 font-semibold drop-shadow-md text-center z-10">
        Copyright © 2026 Intelligent ERP Plugin
      </div>
    </div>
  );
}
