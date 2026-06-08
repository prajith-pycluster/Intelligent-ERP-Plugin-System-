import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Calendar, DollarSign, ChevronDown, ChevronUp, Package, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = () => {
    const customerName = sessionStorage.getItem("customer_name") || "";
    if (!customerName) return;

    fetch(`/api/customer/orders?customer_name=${encodeURIComponent(customerName)}`)
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
  };

  useEffect(() => {
    fetchOrders();

    // Setup periodic polling for live status updates every 7 seconds
    const interval = setInterval(fetchOrders, 7000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmed":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200/50 font-bold py-1 px-2.5">Confirmed</Badge>;
      case "Pending":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200/50 font-bold py-1 px-2.5">Pending</Badge>;
      case "Processing":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200/50 font-bold py-1 px-2.5">Processing</Badge>;
      case "Delivered":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200/50 font-bold py-1 px-2.5">Delivered</Badge>;
      case "Cancelled":
        return <Badge className="bg-red-500/10 text-red-600 border-red-200/50 font-bold py-1 px-2.5">Cancelled</Badge>;
      default:
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-200/50 font-bold py-1 px-2.5">{status}</Badge>;
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-[32px] font-bold text-foreground leading-[40px]">My Orders</h1>
        <p className="text-muted-foreground text-sm">Track your placed orders and statuses</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground animate-pulse text-lg">
          Loading order history...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed rounded-xl bg-card">
          <ClipboardList className="w-12 h-12 mx-auto opacity-20 mb-3" />
          <p className="font-semibold text-lg">No Orders Placed Yet</p>
          <p className="text-sm opacity-70 mt-1">Once you check out items from your cart, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const isExpanded = expandedOrder === o.order_id;
            const orderDate = new Date(o.created_at).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });
            
            const totalQty = o.items.reduce((sum: number, i: any) => sum + i.quantity, 0);

            return (
              <div
                key={o.order_id}
                className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
              >
                {/* Header view */}
                <div
                  onClick={() => toggleExpand(o.order_id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-extrabold text-sm text-foreground flex items-center gap-1.5 font-mono">
                      <ClipboardList className="w-4 h-4 text-purple-600" />
                      {o.order_id}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {orderDate}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 sm:gap-10">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Amount</p>
                      <p className="font-black text-sm text-purple-600">₹{Number(o.total_amount).toFixed(2)}</p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Quantity</p>
                      <p className="font-bold text-sm text-foreground">{totalQty} item{totalQty !== 1 ? "s" : ""}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(o.status)}
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Items details */}
                {isExpanded && (
                  <div className="border-t border-border bg-slate-50/30 dark:bg-slate-900/10 p-5 animate-in slide-in-from-top duration-200">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" /> Items Ordered
                    </h4>
                    
                    <div className="divide-y divide-border border rounded-xl bg-card overflow-hidden">
                      {o.items.map((it: any) => (
                        <div key={it.order_item_id || it.product_id} className="p-3.5 flex justify-between items-center text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate">{it.product_name || it.product_id}</p>
                            <p className="text-muted-foreground font-mono mt-0.5">ID: {it.product_id}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-foreground">
                              ₹{Number(it.price).toFixed(2)} <span className="font-mono text-muted-foreground">x {it.quantity}</span>
                            </p>
                            <p className="font-bold text-purple-600 mt-0.5">₹{Number(it.subtotal).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
