import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Tag, AlertCircle, CheckCircle, XCircle, Info, Sparkles, X, ChevronRight, Package } from "lucide-react";
import { toast } from "sonner";

export default function CustomerBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("cat") || "All");

  // Selected product detail modal
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    // Read search params
    const q = searchParams.get("q");
    const cat = searchParams.get("cat");
    const viewId = searchParams.get("id");

    setSearchQuery(q || "");
    setSelectedCategory(cat || "All");

    // Fetch products
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
          
          // If product ID requested in URL parameters, open detailed view
          if (viewId) {
            const found = data.find(p => p.item_id === viewId);
            if (found) {
              handleViewProduct(found);
            }
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [searchParams]);

  // Load recommendations when product selected
  const handleViewProduct = async (product: any) => {
    setSelectedProduct(product);
    setLoadingRecs(true);
    setRecommendations([]);
    
    // Set query parameter without full reload
    setSearchParams({ ...Object.fromEntries(searchParams), id: product.item_id });

    try {
      const res = await fetch(`/api/customer/recommendations/${product.item_id}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setRecommendations([]);
    const params = Object.fromEntries(searchParams);
    delete params.id;
    setSearchParams(params);
  };

  const handleAddToCart = (product: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const stock = Number(product.current_stock || 0);
    if (stock <= 0) {
      toast.error("Item is currently out of stock!");
      return;
    }

    const savedCart = sessionStorage.getItem("cart");
    let cart = [];
    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
      } catch (err) {
        cart = [];
      }
    }

    const existingIndex = cart.findIndex((item: any) => item.product_id === product.item_id);
    if (existingIndex > -1) {
      if (cart[existingIndex].quantity >= stock) {
        toast.error(`Cannot add more. Only ${stock} units available in stock.`);
        return;
      }
      cart[existingIndex].quantity += 1;
      cart[existingIndex].subtotal = cart[existingIndex].quantity * cart[existingIndex].price;
    } else {
      cart.push({
        product_id: product.item_id,
        name: product.item_name || product.item_id,
        category: product.category,
        price: Number(product.unit_price || 0),
        quantity: 1,
        subtotal: Number(product.unit_price || 0),
        maxStock: stock
      });
    }

    sessionStorage.setItem("cart", JSON.stringify(cart));
    toast.success(`${product.item_name || product.item_id} added to cart!`);
    window.dispatchEvent(new Event("cartUpdate"));
  };

  // Categories list
  const categories = ["All", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const viewFilter = searchParams.get("view") || "all";

  const isPredictiveId = (id: string) => {
    const upper = String(id || "").trim().toUpperCase();
    return upper.startsWith("SI") || upper.startsWith("NI") || upper.startsWith("FI");
  };

  const FEATURED_THRESHOLD = 70;

  // Filtering logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.item_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.item_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    
    let matchesView = true;
    if (viewFilter === "featured") {
      const isIncreasing = String(p.demand_trend || "").toLowerCase() === "increasing";
      let demandScore = 0;
      if (isPredictiveId(p.item_id)) {
        demandScore = Number(p.predictive_score) || 0;
      } else {
        const base = p.abc_class === "A" ? 80 : (p.abc_class === "B" ? 50 : 20);
        const turnover = (Number(p.inventory_turnover) || 0) * 10;
        demandScore = base + turnover;
      }
      matchesView = isIncreasing && demandScore > FEATURED_THRESHOLD;
    } else if (viewFilter === "new-arrivals") {
      matchesView = isPredictiveId(p.item_id) && Number(p.current_stock || 0) > 0;
    }
    
    return matchesSearch && matchesCategory && matchesView;
  });

  const handleClearViewFilter = () => {
    const params = Object.fromEntries(searchParams);
    delete params.view;
    setSearchParams(params);
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0) {
      return { label: "Out Of Stock", color: "bg-red-500/15 text-red-600 border-red-200/50", icon: XCircle, disabled: true };
    } else if (stock <= 20) {
      return { label: "Low Stock", color: "bg-amber-500/15 text-amber-600 border-amber-200/50", icon: AlertCircle, disabled: false };
    } else {
      return { label: "In Stock", color: "bg-green-500/15 text-green-600 border-green-200/50", icon: CheckCircle, disabled: false };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-[32px] font-bold text-foreground leading-[40px]">Browse Products</h1>
        <p className="text-muted-foreground text-sm">Discover and order catalog items</p>
      </div>

      {viewFilter !== "all" && (
        <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 p-4 rounded-xl flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {viewFilter === "featured" ? "Featured Items Catalog" : "New Arrivals Catalog"}
              </p>
              <p className="text-xs text-muted-foreground">
                {viewFilter === "featured" 
                  ? "Showing products with an Increasing demand trend and demand score above 70." 
                  : "Showing active seasonal, festival, or predictive products available for ordering."}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearViewFilter}
            className="text-xs font-semibold rounded-lg hover:bg-purple-50/50 flex items-center gap-1.5 shadow-sm border-purple-200/50 hover:border-purple-300"
          >
            <X className="w-3.5 h-3.5" /> Clear Filter
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or product ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchParams({ ...Object.fromEntries(searchParams), q: e.target.value });
            }}
            className="pl-9 rounded-xl w-full"
          />
        </div>
        
        {/* Category Pill Buttons */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full md:max-w-md shrink-0 scrollbar-none select-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                if (cat === "All") {
                  const params = Object.fromEntries(searchParams);
                  delete params.cat;
                  setSearchParams(params);
                } else {
                  setSearchParams({ ...Object.fromEntries(searchParams), cat });
                }
              }}
              className={`py-1.5 px-4 rounded-full text-xs font-semibold whitespace-nowrap transition-all border outline-none ${
                selectedCategory === cat
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black font-bold"
                  : "border-border bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Grid */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground animate-pulse text-lg">
          Loading catalog products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed rounded-xl bg-card">
          <Package className="w-12 h-12 mx-auto opacity-20 mb-3" />
          <p className="font-semibold text-lg">No Products Found</p>
          <p className="text-sm opacity-70 mt-1">Try resetting your search query or selected category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          {filteredProducts.map((p) => {
            const stockVal = Math.round(Number(p.current_stock || 0));
            const status = getStockStatus(stockVal);
            
            return (
              <div
                key={p.item_id}
                onClick={() => handleViewProduct(p)}
                className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col group relative"
              >
                {/* Product Image Holder */}
                <div className="h-40 bg-slate-100 dark:bg-slate-900 border-b border-border flex items-center justify-center p-6 text-muted-foreground/40 relative">
                  <Package className="w-16 h-16 stroke-[1.2] group-hover:scale-105 transition-transform" />
                  
                  {/* Stock Status Badge */}
                  <Badge variant="outline" className={`absolute top-3 right-3 text-[10px] font-bold ${status.color} border py-0.5 leading-none flex items-center gap-1`}>
                    <status.icon className="w-3.5 h-3.5" />
                    {status.label}
                  </Badge>
                </div>
                
                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {p.category}
                    </span>
                    <h4 className="font-bold text-foreground mt-1 group-hover:text-purple-600 transition-colors text-sm line-clamp-2">
                      {p.item_name || p.item_id}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{p.item_id}</p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-extrabold text-base text-foreground">₹{Number(p.unit_price || 0).toFixed(2)}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => handleAddToCart(p, e)}
                      disabled={status.disabled}
                      className="bg-black hover:bg-slate-800 text-white rounded-lg h-9"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detailed Modal Overlay */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-[560px] max-h-[85vh] flex flex-col rounded-xl border border-border shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-slate-50/50 dark:bg-slate-900/30">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-600" /> Product Intelligence View
              </h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed">
              <div className="flex gap-4 items-start">
                <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-900 border flex items-center justify-center text-muted-foreground/30 shrink-0">
                  <Package className="w-10 h-10" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{selectedProduct.category}</span>
                  <h4 className="font-extrabold text-lg text-foreground mt-0.5">{selectedProduct.item_name || selectedProduct.item_id}</h4>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{selectedProduct.item_id}</p>
                </div>
              </div>

              {/* Description Block */}
              <div className="bg-muted/30 border p-4 rounded-xl space-y-1">
                <p className="text-xs text-muted-foreground font-semibold">Description</p>
                <p className="text-muted-foreground text-xs font-normal">
                  Premium product categorised under {selectedProduct.category} list. Sourced, verified, and loaded from the core ERP database. Includes support for real-time inventory checks.
                </p>
              </div>

              {/* Price & Stock info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border p-4 rounded-xl bg-card">
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="text-xl font-black text-foreground mt-1">₹{Number(selectedProduct.unit_price || 0).toFixed(2)}</p>
                </div>
                <div className="border p-4 rounded-xl bg-card">
                  <p className="text-xs text-muted-foreground">Available Stock</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xl font-bold text-foreground">{Math.round(Number(selectedProduct.current_stock || 0))}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStockStatus(selectedProduct.current_stock).color}`}>
                      {getStockStatus(selectedProduct.current_stock).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Apriori Recommendations */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" /> Customers also buy:
                </h4>
                
                {loadingRecs ? (
                  <div className="text-center py-4 text-xs text-muted-foreground animate-pulse">Running Apriori recommendation lookups...</div>
                ) : recommendations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No specific bundle recommendations.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.item_id}
                        onClick={() => handleViewProduct(rec)}
                        className="flex items-center justify-between border hover:border-purple-600/50 hover:bg-purple-50/10 rounded-xl p-3 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="font-semibold text-xs text-foreground truncate">{rec.item_name || rec.item_id}</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-xs text-foreground shrink-0">
                          ₹{Number(rec.unit_price || 0).toFixed(2)}
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-purple-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-border bg-slate-50/50 dark:bg-slate-900/30 flex justify-end gap-2">
              <Button variant="outline" className="rounded-lg" onClick={handleCloseModal}>
                Close
              </Button>
              <Button
                onClick={() => {
                  handleAddToCart(selectedProduct);
                  handleCloseModal();
                }}
                disabled={getStockStatus(selectedProduct.current_stock).disabled}
                className="bg-black hover:bg-slate-800 text-white rounded-lg"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
