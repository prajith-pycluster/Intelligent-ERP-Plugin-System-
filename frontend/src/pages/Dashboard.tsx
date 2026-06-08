import { useState } from "react";
import SummaryCards from "@/components/SummaryCards";
import ProductTable from "@/components/ProductTable";
import { Product } from "@/data/mockData"; // Preserved for type definitions
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitCompare, X, Loader2 } from "lucide-react";
import { useDashboard, useProducts } from "@/hooks/useInventory";
import { useQueryClient } from "@tanstack/react-query";

const BASE_URL = "/api";

export type DashboardFilter = "all" | "stockout" | "overstock" | "healthy" | "high_demand" | "low_demand";

const Dashboard = () => {
  const [filter, setFilter] = useState<DashboardFilter>("all");
  const queryClient = useQueryClient();

  const { data: dashboardMetrics, isLoading: isDashLoading, error: dashError } = useDashboard();
  const { data: rawProducts, isLoading: isProdLoading, error: prodError } = useProducts();
  
  const isLoading = isDashLoading || isProdLoading;
  const error = (dashError as Error)?.message || (prodError as Error)?.message || null;

  // Compare feature state
  const [showCompare, setShowCompare] = useState(false);
  const [compareInput, setCompareInput] = useState("");
  const [compareResults, setCompareResults] = useState<any[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState("");

  const handleCompare = async () => {
    if (!compareInput.trim()) return;
    setIsComparing(true);
    setCompareError("");
    setCompareResults([]);
    
    try {
      const ids = compareInput.split(",").map(i => i.trim()).filter(Boolean);
      const res = await fetch(`${BASE_URL}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_ids: ids })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to compare products");
      }
      const data = await res.json();
      setCompareResults(data);
    } catch (err: any) {
      console.error("API Error:", err);
      setCompareError(err.message || "An error occurred");
    } finally {
      setIsComparing(false);
    }
  };

  const handleManualRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const products = rawProducts ? rawProducts.map((p: any) => ({
    ...p,
    stockout_risk: typeof p.stockout_risk === "boolean" ? (p.stockout_risk ? "YES" : "NO") : p.stockout_risk || (p.reorder_needed ? "YES" : "NO"),
    overstock_risk: typeof p.overstock_risk === "boolean" ? (p.overstock_risk ? "YES" : "NO") : p.overstock_risk || "NO",
  })) : [];

  const filteredProducts = products.filter((p) => {
    if (filter === "stockout") return p.stockout_risk === "YES";
    if (filter === "overstock") return p.overstock_risk === "YES";
    if (filter === "healthy") return p.stockout_risk === "NO" && p.overstock_risk === "NO";
    if (filter === "high_demand") {
      const overallAvg = products.reduce((acc, curr) => acc + (Number(curr.final_demand) || 0), 0) / (products.length || 1);
      return Number(p.final_demand || 0) > overallAvg;
    }
    if (filter === "low_demand") {
      const overallAvg = products.reduce((acc, curr) => acc + (Number(curr.final_demand) || 0), 0) / (products.length || 1);
      return Number(p.final_demand || 0) < (overallAvg * 0.7);
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-lg text-muted-foreground animate-pulse">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-lg text-risk font-semibold">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-background z-10">
        <div>
          <h1 className="text-[32px] font-bold text-foreground leading-[40px]">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Inventory overview and risk monitoring</p>
        </div>
        <Button variant="outline" onClick={() => setShowCompare(true)} className="gap-2">
          <GitCompare className="h-4 w-4" /> Compare Products
        </Button>
      </div>
      <SummaryCards activeFilter={filter} onFilterChange={setFilter} metrics={dashboardMetrics} />
      <ProductTable products={filteredProducts} filterLabel={filter} onRefresh={handleManualRefresh} />

      {/* Product Comparison Modal overlay */}
      {showCompare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-card w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl border border-border shadow-xl overflow-hidden relative">
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-primary" /> Product Comparison
              </h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowCompare(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-5 border-b border-border bg-background">
              <div className="flex gap-3">
                <Input 
                  placeholder="Enter Product IDs separated by commas (e.g. P001, P002)"
                  value={compareInput}
                  onChange={(e) => setCompareInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCompare()}
                />
                <Button onClick={handleCompare} disabled={isComparing || !compareInput.trim()}>
                  {isComparing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GitCompare className="h-4 w-4 mr-2" />}
                  Compare
                </Button>
              </div>
              {compareError && <p className="text-sm font-medium text-risk mt-3 bg-risk/10 p-2 rounded-lg inline-block border border-risk/20">{compareError}</p>}
            </div>

            <div className="p-5 overflow-auto flex-1 bg-muted/10 relative">
              {compareResults.length > 0 ? (
                <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-4 font-semibold w-48 sticky left-0 z-10 bg-muted/50 border-r border-border backdrop-blur-md">Metric</th>
                          {compareResults.map(p => (
                            <th key={p.item_id} className="px-5 py-4 font-bold text-center border-l bg-muted/30 border-border text-foreground">{p.item_id}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(() => {
                          const maxTurnover = Math.max(...compareResults.map(p => p.inventory_turnover || 0));
                          const minStock = Math.min(...compareResults.map(p => p.current_stock || 0));
                          
                          const parseBoolOrString = (v: any) => v === true || v === "YES" ? "YES" : "NO";
                          
                          const metrics: { label: string; key: string; format: (v: any) => React.ReactNode; highlight?: (v: any) => string }[] = [
                            { label: "Category", key: "category", format: (v: string) => String(v || "Uncategorized") },
                            { label: "Unit Price (₹)", key: "unit_price", format: (v: number) => `₹${Number(v || 0).toFixed(2)}` },
                            { label: "Inventory Turnover", key: "inventory_turnover", format: (v: any) => v || 0, highlight: (v: any) => Number(v) === maxTurnover && maxTurnover > 0 ? "text-success font-bold" : "" },
                            { label: "Current Stock", key: "current_stock", format: (v: number) => Math.round(v), highlight: (v: number) => typeof v === 'number' && v === minStock ? "text-risk font-bold" : "" },
                            { label: "Reorder Point", key: "reorder_point", format: (v: number) => Math.round(Number(v)) },
                            { label: "Reorder Qty", key: "reorder_quantity", format: (v: number) => Math.round(v) },
                            { label: "Safety Stock", key: "safety_stock", format: (v: number) => Math.round(Number(v)) },
                            { label: "Stockout Risk", key: "stockout_risk", format: parseBoolOrString, highlight: (v: any) => parseBoolOrString(v) === "YES" ? "text-risk font-bold" : "" },
                            { label: "Overstock Risk", key: "overstock_risk", format: parseBoolOrString, highlight: (v: any) => parseBoolOrString(v) === "YES" ? "text-purple-600 font-bold" : "" },
                            { label: "Demand Trend", key: "demand_trend", format: (v: string) => String(v) }
                          ];

                          return metrics.map((m, i) => (
                            <tr key={m.label} className="hover:bg-muted/30 transition-colors bg-card">
                              <td className="px-5 py-4 font-medium text-muted-foreground bg-muted/5 sticky left-0 z-10 border-r border-border">{m.label}</td>
                              {compareResults.map(p => {
                                const val = p[m.key];
                                const colorClass = m.highlight ? m.highlight(val) : "";
                                return (
                                  <td key={`${p.item_id}-${m.key}`} className={`px-5 py-4 text-center border-l border-border tabular-nums ${colorClass}`}>
                                    {val !== undefined && val !== null ? m.format(val) : "-"}
                                  </td>
                                );
                              })}
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                  <GitCompare className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium opacity-80">Compare Products</p>
                  <p className="text-sm opacity-60 mt-1 max-w-sm text-center">
                    Enter multiple Item IDs above (e.g. P001, P002) to view a detailed side-by-side metric comparison.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
