import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ClipboardList, AlertCircle, RefreshCw, CheckCircle, XCircle, DollarSign, Eye, PlayCircle, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemsOrder, setSelectedItemsOrder] = useState<any | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    fetch("/api/admin/orders")
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
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to update order");
      }
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

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

  // Metrics calculation
  const totalOrders = orders.length;
  const confirmedOrders = orders.filter(o => o.status === "Confirmed" || o.status === "Pending").length;
  const processingOrders = orders.filter(o => o.status === "Processing").length;
  const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
  const revenue = orders.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[32px] font-bold text-foreground leading-[40px]">Order Management</h1>
          <p className="text-muted-foreground text-sm">Monitor and process incoming customer orders</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Admin Dashboard Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Orders</p>
          <p className="text-xl font-black text-foreground">{totalOrders}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Confirmed</p>
          <p className="text-xl font-black text-amber-600">{confirmedOrders}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Processing</p>
          <p className="text-xl font-black text-blue-600">{processingOrders}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Delivered</p>
          <p className="text-xl font-black text-green-600">{deliveredOrders}</p>
        </div>
        <div className="col-span-2 md:col-span-1 bg-card border border-border p-4 rounded-xl shadow-sm space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Revenue Generated</p>
          <p className="text-xl font-black text-purple-600">₹{revenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/10">
          <h3 className="font-bold text-sm text-foreground">Order Catalog</h3>
        </div>
        
        {loading ? (
          <div className="text-center py-20 text-muted-foreground animate-pulse text-sm">
            Loading customer orders data...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto opacity-20 mb-2" />
            <p className="font-semibold text-sm">No Orders Registered</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-xs">Order ID</TableHead>
                  <TableHead className="font-bold text-xs">Customer</TableHead>
                  <TableHead className="font-bold text-xs">Date</TableHead>
                  <TableHead className="font-bold text-xs">Products</TableHead>
                  <TableHead className="font-bold text-xs">Quantity</TableHead>
                  <TableHead className="font-bold text-xs">Amount</TableHead>
                  <TableHead className="font-bold text-xs text-center">Status</TableHead>
                  <TableHead className="font-bold text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {orders.map((o) => {
                  const dateStr = new Date(o.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  });

                  const totalQty = o.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

                  return (
                    <TableRow key={o.order_id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-bold font-mono text-purple-600">{o.order_id}</TableCell>
                      <TableCell className="font-medium text-foreground">{o.customer_name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono">{dateStr}</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        <span className="text-foreground">
                          {o.items.map((i: any) => `${i.product_name || i.product_id} (x${i.quantity})`).join(", ")}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">{totalQty}</TableCell>
                      <TableCell className="font-extrabold text-foreground">₹{Number(o.total_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(o.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5 flex-wrap">
                          
                          {/* Details Toggle Button */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            title="View order items"
                            onClick={() => setSelectedItemsOrder(selectedItemsOrder?.order_id === o.order_id ? null : o)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {/* Action controls based on status */}
                          {(o.status === "Confirmed" || o.status === "Pending") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-0 text-[10px] font-bold"
                              onClick={() => handleUpdateStatus(o.order_id, "Processing")}
                            >
                              Process
                            </Button>
                          )}

                          {o.status === "Processing" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0 text-[10px] font-bold"
                              onClick={() => handleUpdateStatus(o.order_id, "Delivered")}
                            >
                              Deliver
                            </Button>
                          )}

                          {(o.status === "Delivered" || o.status === "Cancelled") && (
                            <span className="text-[10px] text-muted-foreground italic pr-2 flex items-center justify-center h-8">Completed</span>
                          )}

                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Nested detailed view overlay/drawer */}
      {selectedItemsOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-[480px] rounded-xl border border-border shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
            <div className="p-5 border-b border-border bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-purple-600" /> Items in {selectedItemsOrder.order_id}
              </h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setSelectedItemsOrder(null)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-5 max-h-[50vh] overflow-y-auto divide-y divide-border text-xs">
              {selectedItemsOrder.items.map((it: any) => (
                <div key={it.order_item_id} className="py-3 flex justify-between items-center">
                  <div className="min-w-0 pr-3">
                    <p className="font-bold text-foreground truncate">{it.product_name || it.product_id}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Product ID: {it.product_id}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-foreground">₹{Number(it.price).toFixed(2)} x {it.quantity}</p>
                    <p className="font-bold text-purple-600 mt-0.5">₹{Number(it.subtotal).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 border-t bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center font-bold text-sm">
              <span>Total Amount</span>
              <span className="text-purple-600">₹{Number(selectedItemsOrder.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
