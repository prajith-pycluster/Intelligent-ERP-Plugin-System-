import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package, Tags, ArrowRight, Star, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CustomerHome() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("Customer");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setCustomerName(sessionStorage.getItem("customer_name") || "Customer");
    
    // Fetch products from database
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/browse?q=${encodeURIComponent(search.trim())}`);
    } else {
      navigate("/browse");
    }
  };

  // Group by categories
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  
  const isPredictiveId = (id: string) => {
    const upper = String(id || "").trim().toUpperCase();
    return upper.startsWith("SI") || upper.startsWith("NI") || upper.startsWith("FI");
  };

  // Configurable Featured Threshold
  const FEATURED_THRESHOLD = 70;

  // Demand intelligence logic for Featured Items: Increasing trend and high demand score
  const featuredProducts = products.filter((p: any) => {
    const isIncreasing = String(p.demand_trend || "").toLowerCase() === "increasing";
    if (!isIncreasing) return false;

    let demandScore = 0;
    if (isPredictiveId(p.item_id)) {
      demandScore = Number(p.predictive_score) || 0;
    } else {
      const base = p.abc_class === "A" ? 80 : (p.abc_class === "B" ? 50 : 20);
      const turnover = (Number(p.inventory_turnover) || 0) * 10;
      demandScore = base + turnover;
    }

    return demandScore >= FEATURED_THRESHOLD;
  }).slice(0, 3);

  // Fallback Featured if none match increasing trend + threshold (prioritize Class A/Increasing items)
  const fallbackFeatured = featuredProducts.length > 0 
    ? featuredProducts 
    : products.filter((p: any) => p.abc_class === "A" || String(p.demand_trend || "").toLowerCase() === "increasing").slice(0, 3);

  // New Arrivals: Only active predictive stock items (SI/NI/FI series) with stock available
  const recentProducts = products.filter((p: any) => isPredictiveId(p.item_id) && Number(p.current_stock || 0) > 0).slice(0, 3);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Hero Welcome Block */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-8 md:p-12 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center pointer-events-none pr-8">
          <Package className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 space-y-4 max-w-xl">
          <p className="text-sm font-semibold tracking-wider text-purple-400 uppercase">Intelligent Retail Portal</p>
          <h1 className="text-[32px] font-bold tracking-tight leading-[40px]">Welcome, {customerName}!</h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Browse our fresh stock of high-quality products. Instantly place orders, check stock status, and view smart recommendations.
          </p>
          
          <form onSubmit={handleSearchSubmit} className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search products by name or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-800/80 border-slate-700 text-white placeholder-slate-400 focus:ring-purple-400 h-10 w-full rounded-xl"
              />
            </div>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-6">
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-500/10 text-purple-600 rounded-lg">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Available Products</p>
            <p className="text-2xl font-bold text-foreground">{loading ? "..." : products.length}</p>
          </div>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-500/10 text-green-600 rounded-lg">
            <Tags className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Categories</p>
            <p className="text-2xl font-bold text-foreground">{loading ? "..." : categories.length}</p>
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 bg-card border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-lg">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Personalized Feed</p>
              <p className="text-sm font-semibold text-foreground">Recommendations Active</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/cart")} className="text-purple-600 hover:text-purple-500 hover:bg-purple-50/50 p-2">
            View <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Main Grid: Featured & Recent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Featured Products */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Featured Items
            </h3>
            <Button variant="link" size="sm" onClick={() => navigate("/browse?view=featured")} className="text-purple-600 hover:text-purple-500 p-0">
              Browse All
            </Button>
          </div>
          
          <div className="divide-y divide-border">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading featured products...</div>
            ) : fallbackFeatured.map((p) => (
              <div key={p.item_id} onClick={() => navigate(`/browse?id=${p.item_id}`)} className="flex justify-between items-center py-3.5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/50 rounded-lg px-2 transition-all">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{p.item_name || p.item_id}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-foreground">₹{Number(p.unit_price || 0).toFixed(2)}</p>
                  <p className={`text-[10px] font-bold ${p.current_stock > 20 ? "text-green-600" : p.current_stock > 0 ? "text-amber-600" : "text-red-600"}`}>
                    {p.current_stock > 0 ? "In Stock" : "Out of Stock"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Added Products */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" /> New Arrivals
            </h3>
            <Button variant="link" size="sm" onClick={() => navigate("/browse?view=new-arrivals")} className="text-purple-600 hover:text-purple-500 p-0">
              Browse All
            </Button>
          </div>
          
          <div className="divide-y divide-border">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading arrivals...</div>
            ) : recentProducts.map((p) => (
              <div key={p.item_id} onClick={() => navigate(`/browse?id=${p.item_id}`)} className="flex justify-between items-center py-3.5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/50 rounded-lg px-2 transition-all">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{p.item_name || p.item_id}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-foreground">₹{Number(p.unit_price || 0).toFixed(2)}</p>
                  <p className={`text-[10px] font-bold ${p.current_stock > 20 ? "text-green-600" : p.current_stock > 0 ? "text-amber-600" : "text-red-600"}`}>
                    {p.current_stock > 0 ? "In Stock" : "Out of Stock"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Categories block */}
      <div className="space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Tags className="w-4 h-4 text-purple-600" /> Browse Categories</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {loading ? (
            <div className="col-span-full py-4 text-center text-sm text-muted-foreground">Loading categories...</div>
          ) : categories.map((cat) => (
            <button
              key={cat}
              onClick={() => navigate(`/browse?cat=${encodeURIComponent(cat)}`)}
              className="bg-card hover:bg-muted/50 border border-border p-4 rounded-xl text-center shadow-sm hover:shadow-md transition-all active:scale-[0.97] outline-none group"
            >
              <p className="font-bold text-sm text-foreground group-hover:text-purple-600 transition-colors">{cat}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {products.filter(p => p.category === cat).length} items
              </p>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
