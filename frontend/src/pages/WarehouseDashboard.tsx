import { useState, useEffect } from "react";
import { useProducts, useRestockHistory, useAllBillingHistory, usePredictiveInventory } from "@/hooks/useInventory";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Package, Warehouse, AlertTriangle, Clock, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function WarehouseDashboard() {
  const { data: rawProducts, isLoading: isProductsLoading } = useProducts();
  const { data: restockHistory, isLoading: isHistoryLoading } = useRestockHistory();
  const { data: billingHistory, isLoading: isBillingLoading } = useAllBillingHistory();
  const { data: predictiveData, isLoading: isPredictiveLoading } = usePredictiveInventory();

  const [alertSentStatus, setAlertSentStatus] = useState<Record<string, string | boolean>>(() => {
    try {
      const saved = localStorage.getItem("pm_alertSentStatus");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const isLoading = isProductsLoading || isHistoryLoading || isBillingLoading || isPredictiveLoading;

  const products = rawProducts ? rawProducts.map((p: any) => ({
    ...p,
    stockout_risk: typeof p.stockout_risk === "boolean" ? (p.stockout_risk ? "YES" : "NO") : p.stockout_risk || (p.reorder_needed ? "YES" : "NO"),
  })) : [];

  // Automatic cleanup of resolved alerts
  useEffect(() => {
    if (products.length === 0) return;
    const cleanStatus = { ...alertSentStatus };
    let changed = false;
    products.forEach((p: any) => {
      if (cleanStatus[p.item_id] && p.current_stock >= Math.round(p.safety_stock)) {
        delete cleanStatus[p.item_id];
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem("pm_alertSentStatus", JSON.stringify(cleanStatus));
      setAlertSentStatus(cleanStatus);
    }
  }, [products, alertSentStatus]);

  // Compute metrics
  const totalProducts = products.length;
  const availableStock = products.reduce((sum, p) => sum + Math.max(0, p.current_stock || 0), 0);
  
  const normalRestockCount = products.filter((p: any) => p.stockout_risk === "YES").length;
  
  const approvedIds: Set<string> = (() => {
    try {
      const saved = localStorage.getItem("pi_godown_approved") || localStorage.getItem("pi_warehouse_approved");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  })();

  const predictiveRecsCount = (predictiveData?.godown_recommendations || [])
    .filter((p: any) => p.additional_qty > 0 && approvedIds.has(p.item_id)).length;

  const lowStockCount = normalRestockCount + predictiveRecsCount;

  const todayStr = new Date().toLocaleDateString('en-CA'); // "YYYY-MM-DD" local timezone format

  const restocksToday = restockHistory?.filter((item: any) => {
    const itemDate = new Date(item.created_at).toLocaleDateString('en-CA');
    return itemDate === todayStr;
  }).length || 0;

  const billingToday = billingHistory?.filter((item: any) => {
    return item.date === todayStr;
  }).length || 0;

  const todayTransactions = restocksToday + billingToday;

  const activeAlerts = products.filter((p: any) => {
    const isAlertActive = alertSentStatus[p.item_id];
    const belowSafety = p.current_stock < Math.round(p.safety_stock);
    return isAlertActive && belowSafety;
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <div className="text-lg text-muted-foreground animate-pulse">Loading warehouse dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-6 rounded-xl border border-border shadow-sm gap-4">
        <div>
          <h1 className="text-[32px] font-bold flex items-center gap-2 text-foreground leading-[40px]">
            <Warehouse className="w-6 h-6 text-primary" />
            Warehouse Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Operational metrics and immediate restocking overview.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" className="shadow-sm">
            <Link to="/warehouse/inventory">
              Manage Inventory <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <Card className="shadow-xs border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="metric-card-label uppercase tracking-wider text-muted-foreground">Total Products</CardTitle>
            <Package className="h-4.5 w-4.5 text-primary opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="metric-card-value text-foreground">{totalProducts}</div>
            <p className="text-3xs text-muted-foreground mt-1">Items currently tracked in ERP</p>
          </CardContent>
        </Card>

        {/* Available Stock */}
        <Card className="shadow-xs border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="metric-card-label uppercase tracking-wider text-muted-foreground">Available Stock</CardTitle>
            <Warehouse className="h-4.5 w-4.5 text-blue-500 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="metric-card-value text-foreground">{availableStock}</div>
            <p className="text-3xs text-muted-foreground mt-1">Total units physically in warehouse</p>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className="shadow-xs border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="metric-card-label uppercase tracking-wider text-muted-foreground">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4.5 w-4.5 text-destructive opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="metric-card-value text-destructive">{lowStockCount}</div>
            <p className="text-3xs text-muted-foreground mt-1">Products at stockout risk</p>
          </CardContent>
        </Card>

        {/* Today's Transactions */}
        <Card className="shadow-xs border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="metric-card-label uppercase tracking-wider text-muted-foreground">Today's Transactions</CardTitle>
            <Clock className="h-4.5 w-4.5 text-green-500 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="metric-card-value text-green-600">{todayTransactions}</div>
            <p className="text-3xs text-muted-foreground mt-1">Restocks and billings today</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Stock Alerts Section */}
      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
            Active Stock Alerts
          </CardTitle>
          <CardDescription>
            Low-stock notifications triggered by Administrator. Immediate operational response and restocking required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border/60">
              <p className="font-semibold text-green-600">No active stock alerts.</p>
              <p className="text-xs text-muted-foreground mt-1">All flagged items are successfully restocked.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Safety Stock</TableHead>
                    <TableHead>Alert Date</TableHead>
                    <TableHead className="text-right">Alert Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAlerts.map((p: any) => {
                    const alertDate = typeof alertSentStatus[p.item_id] === "string" 
                      ? (alertSentStatus[p.item_id] as string) 
                      : "Recently";
                    return (
                      <TableRow key={p.item_id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium text-foreground">
                          <div className="flex flex-col">
                            <span className="font-bold">{p.item_name}</span>
                            <span className="text-xs text-muted-foreground">{p.item_id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 font-bold">
                            {p.current_stock}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {Math.round(p.safety_stock)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-medium">
                          {alertDate}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-red-600 hover:bg-red-700 text-white border-0 font-bold uppercase text-[10px] tracking-wide animate-pulse">
                            Restock Required
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
