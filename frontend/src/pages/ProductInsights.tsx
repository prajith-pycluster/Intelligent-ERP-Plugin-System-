import React, { useState } from "react";
import { demandHistory, Product } from "@/data/mockData";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp, Package, Target, BarChart3, Search, Layers, ArrowDownUp, Truck, Loader2, Edit, Trash2, Tags, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useProduct } from "@/hooks/useInventory";

const ProductInsights = () => {
  const [query, setQuery] = useState(() => sessionStorage.getItem("insights_query") || "");
  const [searchId, setSearchId] = useState(() => sessionStorage.getItem("insights_searchId") || "");
  const navigate = useNavigate();

  React.useEffect(() => {
    sessionStorage.setItem("insights_query", query);
    sessionStorage.setItem("insights_searchId", searchId);
  }, [query, searchId]);

  const { data: rawData, isLoading, error: queryError } = useProduct(searchId, !!searchId);

  const isPredictiveId = (id: string) => {
    const upper = id.trim().toUpperCase();
    return upper.startsWith("SI") || upper.startsWith("NI") || upper.startsWith("FI");
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    const id = query.trim().toUpperCase();
    setSearchId(id);
  };

  const product = React.useMemo(() => {
    if (!rawData) return null;
    return {
      ...rawData,
      stockout_risk: typeof rawData.stockout_risk === "boolean" 
        ? (rawData.stockout_risk ? "YES" : "NO") 
        : rawData.stockout_risk || (rawData.reorder_needed ? "YES" : "NO"),
      overstock_risk: typeof rawData.overstock_risk === "boolean" 
        ? (rawData.overstock_risk ? "YES" : "NO") 
        : rawData.overstock_risk || "NO",
    };
  }, [rawData]);

  // Block display if a cached search is a predictive product that is not in the active ERP catalog
  const isBlockedPredictive = searchId && isPredictiveId(searchId) && !product && !isLoading;



  const error = (queryError as Error)?.message || "";

  const history = product?.history || [];

  const barData = product
    ? [
      { name: "Current Stock", value: Math.round(Number(product.current_stock)), color: "hsl(217 91% 52%)" },
      { name: "Reorder Point", value: Math.round(Number(product.reorder_point)), color: "hsl(38 92% 50%)" },
    ]
    : [];

  const statusIcon = product?.stockout_risk === "YES"
    ? <ShieldAlert className="h-5 w-5 text-risk" />
    : product?.overstock_risk === "YES"
      ? <AlertTriangle className="h-5 w-5 text-purple-600" />
      : <ShieldCheck className="h-5 w-5 text-success" />;

  const statusLabel = product?.stockout_risk === "YES" ? "Stockout Risk" : product?.overstock_risk === "YES" ? "Overstock" : "Safe";
  const statusColor = product?.stockout_risk === "YES" ? "bg-risk/15 text-risk" : product?.overstock_risk === "YES" ? "bg-purple-500/15 text-purple-600" : "bg-success/15 text-success";

  const metrics = product
    ? [
      { label: "Category", value: (product as any).category || "Uncategorized", icon: Tags, isText: true },
      { label: "Unit Price", value: `₹${Number((product as any).unit_price || 0).toFixed(2)}`, icon: IndianRupee, isText: true },
      { label: "Current Stock", value: Math.round(Number(product.current_stock)), icon: Package, isText: true },
      { label: "Inventory Turnover", value: (product as any).inventory_turnover || 0, icon: ArrowDownUp, isText: true },
      { label: "Safety Stock", value: Math.round(Number(product.safety_stock)), icon: BarChart3, isText: true },
      { label: "Reorder Point", value: Math.round(Number(product.reorder_point)), icon: Target, isText: true },
      { label: "Reorder Qty", value: Math.round(Number(product.reorder_quantity)), icon: Layers, isText: true },
      { label: "Stockout Risk", value: product.stockout_risk, icon: ShieldAlert, isText: true },
      { label: "Overstock Risk", value: product.overstock_risk, icon: AlertTriangle, isText: true },
      { label: "Demand Trend", value: product.demand_trend, icon: TrendingUp, isText: true },
    ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Product Insights</h2>
        <p className="text-muted-foreground text-sm">Enter an Item ID for detailed product intelligence</p>
      </div>

      {/* Search */}
      <div className="flex gap-3 max-w-md">
        <Input
          placeholder="Enter Item ID (e.g. P001)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          disabled={isLoading}
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>

      {isBlockedPredictive && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Predictive Stock Product</p>
            <p>
              <span className="font-mono font-bold">{searchId}</span> is a temporary predictive stock item (SI / NI / FI series).
              It is not part of the regular inventory and won't appear here.
            </p>
            <p className="mt-2 text-amber-700">
              → Go to <strong>Predictive Inventory</strong> to view its forecasted demand and lifecycle details.
            </p>
          </div>
        </div>
      )}

      {error && !isBlockedPredictive && (
        <div className="bg-risk/10 border border-risk/20 rounded-xl p-4 text-sm text-risk">{error}</div>
      )}

      {!error && !isBlockedPredictive && product && (
        <div className="animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 bg-muted/30 p-5 rounded-xl border border-border">
            <div>
              <h3 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <span className="text-primary">{product.item_id}</span>
                <span className="text-muted-foreground font-normal mx-1">/</span>
                {((product as any).item_name) || "Unknown Product"}
              </h3>
              <div className="flex items-center gap-3 mt-3">
                <Badge variant="secondary" className="font-medium bg-background border border-border">
                  {((product as any).category) || "Uncategorized"}
                </Badge>
                <div className="text-sm border-l border-border pl-3 text-muted-foreground font-semibold">
                  {((product as any).unit_price) ? `₹${Number((product as any).unit_price).toFixed(2)}` : "Price N/A"}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:items-end gap-2 bg-card p-3 rounded-lg border border-border shadow-sm">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider pl-1">Inventory Status</span>
              <div className="flex items-center gap-2">
                <Badge className={`${statusColor} border-0 text-sm px-3 py-1 flex items-center gap-1.5`}>
                   <span className="[&>svg]:w-4 [&>svg]:h-4">{statusIcon}</span>
                   {statusLabel}
                </Badge>
                <Badge className="bg-background text-foreground border border-border text-sm px-3 py-1 shadow-sm">{product.demand_trend}</Badge>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.map((m) => (
              <div key={m.label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <m.icon className="h-3.5 w-3.5" /> {m.label}
                </div>
                <p className="text-lg font-bold text-card-foreground tabular-nums">
                  {(m as any).isText ? String(m.value) : Math.round(Number(m.value))}
                </p>
              </div>
            ))}
          </div>



          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col">
              <h3 className="font-semibold text-card-foreground mb-4">Demand Trend</h3>
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 25% 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(214 25% 90%)", fontSize: 13 }} />
                    <Line type="monotone" dataKey="demand" stroke="hsl(217 91% 52%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(217 91% 52%)" }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/30 rounded-lg p-6 min-h-[250px]">
                  <BarChart3 className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">No demand data available for this product</p>
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-card-foreground mb-4">Current Stock vs Reorder Point</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 25% 90%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(214 25% 90%)", fontSize: 13 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductInsights;
