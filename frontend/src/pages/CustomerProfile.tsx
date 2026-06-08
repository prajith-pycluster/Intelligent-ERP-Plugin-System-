import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, ClipboardList, Wallet, LogOut, Calendar, ShieldCheck, Mail, Phone, Info } from "lucide-react";

interface CustomerProfileProps {
  onLogout: () => void;
}

export default function CustomerProfile({ onLogout }: CustomerProfileProps) {
  const [customerName, setCustomerName] = useState("Customer");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const name = sessionStorage.getItem("customer_name") || "Customer";
    setCustomerName(name);

    fetch(`/api/customer/orders?customer_name=${encodeURIComponent(name)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOrders(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const totalOrders = orders.length;
  const totalPurchases = orders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const initials = customerName.split(" ").map(n => n[0]).join("").toUpperCase() || "C";

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-[32px] font-bold text-foreground leading-[40px]">Customer Profile</h1>
        <p className="text-muted-foreground text-sm">View your catalog stats and session settings</p>
      </div>

      {/* Profile Header */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col sm:flex-row items-center gap-5 justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <Avatar className="h-20 w-20 border-2 border-purple-500/20">
            <AvatarFallback className="bg-purple-600 text-white text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left space-y-1">
            <p className="text-xl font-bold text-card-foreground">{customerName}</p>
            <p className="text-xs text-muted-foreground">Active Customer Account</p>
            <div className="flex gap-2 justify-center sm:justify-start pt-1">
              <Badge className="bg-purple-500/10 text-purple-600 border-0">Customer</Badge>
              <Badge className="bg-green-500/10 text-green-600 border-0">Logged In</Badge>
            </div>
          </div>
        </div>

        <Button variant="destructive" onClick={onLogout} className="rounded-xl px-5 h-11 font-semibold gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Total Orders */}
        <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-5 shadow-sm">
          <div className="p-4 bg-purple-500/10 text-purple-600 rounded-xl">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Orders Placed</p>
            <p className="text-2xl font-extrabold text-foreground mt-1">{loading ? "..." : totalOrders}</p>
          </div>
        </div>

        {/* Total Purchases */}
        <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-5 shadow-sm">
          <div className="p-4 bg-green-500/10 text-green-600 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Purchases Spend</p>
            <p className="text-2xl font-extrabold text-foreground mt-1">₹{loading ? "..." : totalPurchases.toFixed(2)}</p>
          </div>
        </div>

      </div>

      {/* Info Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Info className="w-4 h-4 text-purple-600" /> Account Guidelines</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 text-xs divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="space-y-1 sm:pr-4">
            <p className="font-bold text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-purple-600" /> Secure Purchases</p>
            <p className="text-muted-foreground font-normal leading-relaxed">Orders are verified against available stock immediately to prevent delivery issues.</p>
          </div>
          <div className="space-y-1 sm:px-6 pt-4 sm:pt-0">
            <p className="font-bold text-muted-foreground flex items-center gap-1.5"><Calendar className="w-4 h-4 text-purple-600" /> Account Lifecycle</p>
            <p className="text-muted-foreground font-normal leading-relaxed">No registration or passwords needed. Logging out clears active cart details and terminates the browser session.</p>
          </div>
          <div className="space-y-1 sm:pl-6 pt-4 sm:pt-0">
            <p className="font-bold text-muted-foreground flex items-center gap-1.5"><Info className="w-4 h-4 text-purple-600" /> Support Desk</p>
            <p className="text-muted-foreground font-normal leading-relaxed">Reach out to the warehouse admin desk for queries regarding processing or delivered status updates.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
