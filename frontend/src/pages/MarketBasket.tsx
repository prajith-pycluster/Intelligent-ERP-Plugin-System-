import { useState, useEffect, useMemo } from "react";
import { useTopMarketBasketGroups, useProducts, useMarketBasket } from "@/hooks/useInventory";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Search, XCircle, Loader2 } from "lucide-react";

export default function MarketBasket() {
  const { data: topGroups = [], isLoading: isLoadingTop } = useTopMarketBasketGroups();
  const { data: products = [] } = useProducts();

  const [searchId, setSearchId] = useState(() => sessionStorage.getItem("pm_mb_searchId") || "");
  const [fetchId, setFetchId] = useState<string | null>(() => sessionStorage.getItem("pm_mb_fetchId") || null);
  const { data: manualRecommendations = [], isLoading: isLoadingManual } = useMarketBasket(fetchId || "");

  useEffect(() => {
    sessionStorage.setItem("pm_mb_searchId", searchId);
  }, [searchId]);

  useEffect(() => {
    if (fetchId) sessionStorage.setItem("pm_mb_fetchId", fetchId);
    else sessionStorage.removeItem("pm_mb_fetchId");
  }, [fetchId]);

  const renderRecommendationCard = (rec: any, idx: number, isGlobal: boolean = false) => {
    let strengthBadge = { label: "Weak", color: "bg-slate-100 text-slate-700 border-slate-200" };
    if (rec.lift >= 3.0) strengthBadge = { label: "Very Strong", color: "bg-purple-100 text-purple-700 border-purple-200" };
    else if (rec.lift >= 2.0) strengthBadge = { label: "Strong", color: "bg-green-100 text-green-700 border-green-200" };
    else if (rec.lift >= 1.5) strengthBadge = { label: "Moderate", color: "bg-blue-100 text-blue-700 border-blue-200" };

    return (
      <div key={idx} className="bg-card p-4 lg:p-5 rounded-xl border border-border shadow-sm flex flex-col h-full">
        <div className="flex flex-col gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${strengthBadge.color} whitespace-nowrap`}>
              {strengthBadge.label} Match
            </div>
            {rec.source === "manual_seed" ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                Retail Bundle
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
                AI Learned
              </span>
            )}
          </div>
          
          <div>
            <div className="font-bold text-foreground text-[15px] leading-tight mb-1.5">
              {isGlobal && <span>{rec.item_name || rec.item_id} <span className="text-muted-foreground font-normal mx-1">+</span></span>}
              <span>{rec.recommended_item_name || rec.recommended_item_id || rec.item_id}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              {isGlobal && <span className="font-medium text-[11px]">({rec.item_id} → {rec.recommended_item_id})</span>}
              {!isGlobal && <span className="font-medium text-[11px]">({rec.recommended_item_id || rec.item_id})</span>}
              {rec.category && <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-medium">{rec.category}</span>}
              {rec.unit_price > 0 && <span>₹{rec.unit_price}</span>}
            </div>
          </div>
        </div>
        
        <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm flex flex-col gap-2 mt-auto">
          {rec.description && <p className="text-foreground/80 italic">"{rec.description}"</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
            <span className="font-medium text-primary">Confidence: {rec.confidence}%</span>
            <span className="font-medium text-amber-600">Lift: {rec.lift}x</span>
          </div>
        </div>
      </div>
    );
  };

  const uniqueTopGroups = useMemo(() => {
    const unique = [];
    const seenPairs = new Set();
    for (const rec of topGroups) {
      const p1 = rec.item_id;
      const p2 = rec.recommended_item_id;
      const pairKey = [p1, p2].sort().join('-');
      if (!seenPairs.has(pairKey)) {
        seenPairs.add(pairKey);
        unique.push(rec);
      }
    }
    return unique;
  }, [topGroups]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* HEADER SECTION - Title and Manual Exploration on Top Right */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-[32px] font-bold flex items-center gap-2 text-foreground leading-[40px]">
            <ShoppingCart className="h-8 w-8 text-primary shrink-0" />
            Retail Intelligence Dashboard (Market Basket)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Automatically detected strongest product associations and bundle opportunities.</p>
        </div>
        
        <div className="flex gap-2 items-center bg-card p-3 rounded-xl border border-border shadow-sm w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Input 
              list="pm-products-list"
              placeholder="Manual lookup by name/ID..." 
              value={searchId} 
              onChange={(e) => setSearchId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && setFetchId(searchId)}
              className="h-9 text-sm"
            />
            <datalist id="pm-products-list">
              {products.map((p: any) => (
                <option key={p.item_id} value={p.item_id}>
                  {p.item_name}
                </option>
              ))}
            </datalist>
          </div>
          <Button onClick={() => setFetchId(searchId)} size="sm" className="h-9 whitespace-nowrap">
            <Search className="h-4 w-4 mr-2" />
            Lookup
          </Button>
        </div>
      </div>

      {/* CONDITIONAL RENDER: Dashboard vs Manual Search Results */}
      {fetchId ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <h3 className="text-lg font-semibold text-foreground">Manual Search Results for: {fetchId}</h3>
             <Button variant="outline" size="sm" onClick={() => setFetchId(null)}>
               <XCircle className="h-4 w-4 mr-2" />
               Clear Search
             </Button>
          </div>
          
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {isLoadingManual ? (
               <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : manualRecommendations.length === 0 ? (
               <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                 <ShoppingCart className="h-10 w-10 opacity-20 mb-3" />
                 <p>No associated products found for {fetchId}</p>
               </div>
            ) : (
               <div className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {manualRecommendations.map((rec: any, idx: number) => renderRecommendationCard(rec, idx, false))}
                 </div>
               </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {isLoadingTop ? (
             <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : uniqueTopGroups.length === 0 ? (
             <div className="p-12 text-center text-muted-foreground flex flex-col items-center bg-card rounded border border-border">
               <ShoppingCart className="h-10 w-10 opacity-20 mb-3" />
               <p>No market basket recommendations available.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueTopGroups.map((rec: any, idx: number) => renderRecommendationCard(rec, idx, true))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
