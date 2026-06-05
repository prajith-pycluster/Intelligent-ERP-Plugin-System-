import React, { useState, useEffect, useMemo } from "react";
import { PackagePlus, Save, Loader2, Info, Edit, Trash2, Search, RotateCcw, XCircle, AlertCircle, ShoppingCart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRecycleBin, useRestoreProduct, usePermanentDeleteProduct, useProduct, useAddProduct, useEditProduct, useDeleteProduct, useProducts, useSendWhatsAppAlert, useMarketBasket, useTopMarketBasketGroups } from "@/hooks/useInventory";

const RecycleBinTab = () => {
  const { data: items = [], isLoading, error: queryError } = useRecycleBin();
  const error = (queryError as Error)?.message || null;

  const [restoreItemId, setRestoreItemId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const restoreMutation = useRestoreProduct();
  const permanentDeleteMutation = usePermanentDeleteProduct();
  const isProcessing = restoreMutation.isPending || permanentDeleteMutation.isPending;

  const handleRestore = async () => {
    if (!restoreItemId) return;
    try {
      await restoreMutation.mutateAsync(restoreItemId);
    } finally {
      setRestoreItemId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteItemId) return;
    try {
      await permanentDeleteMutation.mutateAsync(deleteItemId);
    } finally {
      setDeleteItemId(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-muted-foreground"><Loader2 className="animate-spin h-6 w-6 mr-2" /> Loading recycle bin...</div>;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="bg-risk/10 p-4 border border-risk/30 text-risk rounded-md flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" /> {error}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-card rounded border border-border">
          <Trash2 className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
          <p className="text-lg text-muted-foreground font-medium">Recycle bin is empty</p>
        </div>
      ) : (
        <div className="bg-card rounded border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.item_id}>
                  <TableCell className="font-semibold text-primary">{item.item_id}</TableCell>
                  <TableCell>{item.item_name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>₹{item.unit_price}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setRestoreItemId(item.item_id)}>
                      <RotateCcw className="h-4 w-4 mr-1" /> Restore
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteItemId(item.item_id)}>
                      <XCircle className="h-4 w-4 mr-1" /> Delete Permanently
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Restore Dialog */}
      <AlertDialog open={!!restoreItemId} onOpenChange={(o) => (!o ? setRestoreItemId(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore {restoreItemId}? It will reappear in the dashboard and computations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <Button onClick={handleRestore} disabled={isProcessing}>
              {isProcessing && <Loader2 className="animate-spin h-4 w-4 mr-2" />} Restore
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Dialog */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(o) => (!o ? setDeleteItemId(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {deleteItemId} and all associated sales history and inventory records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handlePermanentDelete} disabled={isProcessing}>
              {isProcessing && <Loader2 className="animate-spin h-4 w-4 mr-2" />} Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};



const MarketBasketTab = () => {
  const { data: topGroups = [], isLoading: isLoadingTop } = useTopMarketBasketGroups();
  const { data: products = [] } = useProducts();

  const [searchId, setSearchId] = useState(() => sessionStorage.getItem("pm_mb_searchId") || "");
  const [fetchId, setFetchId] = useState<string | null>(() => sessionStorage.getItem("pm_mb_fetchId") || null);
  const { data: manualRecommendations = [], isLoading: isLoadingManual } = useMarketBasket(fetchId || "");
  
  const [filterStrength, setFilterStrength] = useState<string>(() => sessionStorage.getItem("pm_mb_filter") || "All");

  useEffect(() => {
    sessionStorage.setItem("pm_mb_searchId", searchId);
  }, [searchId]);

  useEffect(() => {
    if (fetchId) sessionStorage.setItem("pm_mb_fetchId", fetchId);
    else sessionStorage.removeItem("pm_mb_fetchId");
  }, [fetchId]);

  useEffect(() => {
    sessionStorage.setItem("pm_mb_filter", filterStrength);
  }, [filterStrength]);

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

  const getStrengthLabel = (lift: number) => {
    if (lift >= 3.0) return "Very Strong";
    if (lift >= 2.0) return "Strong";
    if (lift >= 1.5) return "Moderate";
    return "Weak";
  };

  const uniqueTopGroups = useMemo(() => {
    const unique = [];
    const seenPairs = new Set();
    // Reverse the array if we want "latest added" to appear at top (assuming later in array = later added)
    // Or just iterate normally.
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

  const filteredTopGroups = uniqueTopGroups.filter((rec: any) => {
    if (filterStrength === "All") return true;
    return getStrengthLabel(rec.lift) === filterStrength;
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION - Title and Manual Exploration on Top Right */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Retail Intelligence Dashboard
          </h2>
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

      {/* FILTER SECTION */}
      {!fetchId && (
        <div className="flex flex-wrap gap-2">
          {["All", "Very Strong", "Strong", "Moderate"].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterStrength(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filterStrength === filter 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {filter === "All" ? "All Recommendations" : `${filter} Match`}
            </button>
          ))}
        </div>
      )}

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
          ) : filteredTopGroups.length === 0 ? (
             <div className="p-12 text-center text-muted-foreground flex flex-col items-center bg-card rounded border border-border">
               <ShoppingCart className="h-10 w-10 opacity-20 mb-3" />
               <p>No associations found for this filter.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTopGroups.map((rec: any, idx: number) => renderRecommendationCard(rec, idx, true))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StockAlertsTab = () => {
  const { data: products = [], isLoading } = useProducts();
  const alertMutation = useSendWhatsAppAlert();
  const [alertSentStatus, setAlertSentStatus] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("pm_alertSentStatus");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("pm_alertSentStatus", JSON.stringify(alertSentStatus));
  }, [alertSentStatus]);
  const [selectedAlertItem, setSelectedAlertItem] = useState<any>(null);
  const [isNotifyingAll, setIsNotifyingAll] = useState(false);

  const criticalItems = products.filter((p: any) => p.current_stock <= Math.round(p.safety_stock));

  const handleNotifyGodown = async () => {
    if (!selectedAlertItem) return;
    
    const message = `📢 Alert from Intelligent ERP Plugin\n🚨 CRITICAL STOCK ITEMS 🚨\n1. ${selectedAlertItem.item_id} - ${selectedAlertItem.item_name} → Stock: ${selectedAlertItem.current_stock}\nAction: Immediate restock required.`;
    
    try {
      await alertMutation.mutateAsync({ message });
      setAlertSentStatus((prev) => ({ ...prev, [selectedAlertItem.item_id]: true }));
    } finally {
      setSelectedAlertItem(null);
    }
  };

  const handleNotifyAll = async () => {
    const pendingItems = criticalItems.filter((p: any) => !alertSentStatus[p.item_id]);
    if (pendingItems.length === 0) {
      toast.info("All current critical items have already been notified.");
      return;
    }
    
    let message = `📢 Alert from Intelligent ERP Plugin\n🚨 BATCH CRITICAL STOCK ALERT 🚨\n`;
    pendingItems.forEach((item: any, idx: number) => {
      message += `${idx + 1}. ${item.item_id} - ${item.item_name} → Stock: ${item.current_stock}\n`;
    });
    message += `Action: Immediate restock required for all items.`;
    
    setIsNotifyingAll(true);
    try {
      await alertMutation.mutateAsync({ message });
      const newStatus = { ...alertSentStatus };
      pendingItems.forEach((item: any) => {
        newStatus[item.item_id] = true;
      });
      setAlertSentStatus(newStatus);
    } finally {
      setIsNotifyingAll(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-muted-foreground"><Loader2 className="animate-spin h-6 w-6 mr-2" /> Loading stock alerts...</div>;
  }

  return (
    <div className="space-y-6">
      {criticalItems.length === 0 ? (
        <div className="text-center py-20 bg-card rounded border border-border">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
          <p className="text-lg text-muted-foreground font-medium">No critical stock items found.</p>
        </div>
      ) : (
        <div className="bg-card rounded border border-border overflow-hidden">
          <div className="p-4 flex justify-between items-center border-b border-border bg-muted/20">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-risk" /> 
              Critical Products
            </h3>
            <Button onClick={handleNotifyAll} disabled={alertMutation.isPending || isNotifyingAll} variant="default">
              {isNotifyingAll ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
              Notify All Pending
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Safety Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {criticalItems.map((item: any) => {
                const isSent = alertSentStatus[item.item_id];
                return (
                  <TableRow key={item.item_id}>
                    <TableCell className="font-semibold text-primary">{item.item_id}</TableCell>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell className="text-risk font-bold">{item.current_stock}</TableCell>
                    <TableCell>{Math.round(item.safety_stock)}</TableCell>
                    <TableCell>
                      {isSent ? (
                        <span className="text-green-500 font-medium">Alert Sent</span>
                      ) : (
                        <span className="text-risk font-medium">Pending</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant={isSent ? "outline" : "default"} 
                        size="sm" 
                        onClick={() => setSelectedAlertItem(item)}
                        disabled={alertMutation.isPending}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" /> {isSent ? "Resend Alert" : "Notify Godown"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!selectedAlertItem} onOpenChange={(o) => (!o ? setSelectedAlertItem(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {alertSentStatus[selectedAlertItem?.item_id] ? "Resend WhatsApp Alert" : "Send WhatsApp Alert"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {alertSentStatus[selectedAlertItem?.item_id] ? "resend the" : "send a"} WhatsApp restock alert to the godown manager for <b>{selectedAlertItem?.item_name}</b>?
              This will automatically compile and open a WhatsApp message in a new tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={alertMutation.isPending}>Cancel</AlertDialogCancel>
            <Button onClick={handleNotifyGodown} disabled={alertMutation.isPending}>
              {alertMutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />} 
              {alertSentStatus[selectedAlertItem?.item_id] ? "Resend Alert" : "Send Alert"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default function ProductManagement() {
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem("pm_activeTab") || "active");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get("id");
  const isClearingRef = React.useRef(false);
  
  useEffect(() => {
    if (isClearingRef.current) {
      if (!editId) isClearingRef.current = false;
      return;
    }
    const savedId = sessionStorage.getItem("pm_editId");
    if (editId) {
      sessionStorage.setItem("pm_editId", editId);
    } else if (savedId && !searchParams.has("id")) {
      navigate(`/product-management?id=${savedId}`, { replace: true });
    }
  }, [editId, navigate, searchParams]);

  const isEditMode = !!editId;
  const isAddMode = searchParams.get("mode") === "add";

  useEffect(() => {
    if (isEditMode || isAddMode) {
      setActiveTab("active");
    }
  }, [isEditMode, isAddMode]);

  const addMutation = useAddProduct();
  const editMutation = useEditProduct();
  const deleteMutation = useDeleteProduct();

  const { data: productData, isLoading: isProductLoading, error: productError } = useProduct(editId || "", isEditMode);

  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem("pm_form");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      item_id: "",
      item_name: "",
      category: "",
      unit_price: "",
      current_stock: "",
      lead_time_days: "",
    };
  });
  const [searchId, setSearchId] = useState("");
  const [lastPopId, setLastPopId] = useState(() => sessionStorage.getItem("pm_lastPopId") || "");

  useEffect(() => {
    sessionStorage.setItem("pm_form", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    sessionStorage.setItem("pm_activeTab", activeTab);
  }, [activeTab]);

  const handleSearchEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    const lookupId = searchId.trim().toUpperCase();
    setSearchId("");
    navigate(`/product-management?id=${lookupId}`);
  };

  useEffect(() => {
    if (isEditMode && productData && productData.item_id !== lastPopId) {
      setFormData({
        item_id: productData.item_id || "",
        item_name: productData.item_name || "",
        category: productData.category || "",
        unit_price: productData.unit_price?.toString() || "",
        current_stock: productData.current_stock?.toString() || "",
        lead_time_days: productData.lead_time_days?.toString() || "",
      });
      setLastPopId(productData.item_id);
      sessionStorage.setItem("pm_lastPopId", productData.item_id!);
    }
  }, [isEditMode, productData, lastPopId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_id.trim()) {
      toast.error("Item ID is required");
      return;
    }

    try {
      const payload = {
        ...formData,
        unit_price: parseFloat(formData.unit_price) || 0,
        current_stock: parseInt(formData.current_stock, 10) || 0,
        lead_time_days: parseInt(formData.lead_time_days, 10) || 0,
      };

      if (isEditMode) {
        await editMutation.mutateAsync(payload);
      } else {
        await addMutation.mutateAsync(payload);
        // Only reset form natively if we were just adding fresh products 
        setFormData({
          item_id: "",
          item_name: "",
          category: "",
          unit_price: "",
          current_stock: "",
          lead_time_days: "",
        });
      }
      sessionStorage.removeItem("pm_form");
      sessionStorage.removeItem("pm_editId");
      sessionStorage.removeItem("pm_lastPopId");
    } catch (error: any) {
      // Error is handled by global toast inside the hook, but we catch it here to prevent form wipe
      console.error("API Error:", error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to logically delete this product?")) return;
    try {
      await deleteMutation.mutateAsync(formData.item_id);
      isClearingRef.current = true;
      sessionStorage.removeItem("pm_form");
      sessionStorage.removeItem("pm_editId");
      sessionStorage.removeItem("pm_lastPopId");
      setSearchId("");
      setFormData({ item_id: "", item_name: "", category: "", unit_price: "", current_stock: "", lead_time_days: "" });
      navigate("/product-management"); // Redirect to product-management
    } catch (err: any) {
      // Error handled by hook toast
    }
  };

  const isLoading = addMutation.isPending || editMutation.isPending || (isEditMode && isProductLoading);
  const isDeleting = deleteMutation.isPending;

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <PackagePlus className="h-5 w-5 text-primary" />
            Product Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage active inventory items or restore deleted products.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="active">Active Products</TabsTrigger>
          <TabsTrigger value="recycle-bin">Recycle Bin</TabsTrigger>
          <TabsTrigger value="market-basket">Market Basket</TabsTrigger>
          <TabsTrigger value="stock-alerts">Stock Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="animate-in fade-in duration-300">
          <div className="space-y-6 max-w-2xl">
            <div className="flex justify-between items-center bg-card rounded-lg p-2 border border-transparent">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  {isEditMode ? <Edit className="h-5 w-5 text-primary" /> : (isAddMode ? <PackagePlus className="h-5 w-5 text-primary" /> : <Search className="h-5 w-5 text-primary" />)}
                  {isEditMode ? "Edit Product" : (isAddMode ? "Add New Product" : "Lookup Product")}
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {isEditMode 
                    ? "Update your inventory item details below." 
                    : (isAddMode ? "Manually enter a new inventory item." : "Enter a Product ID to edit an existing item, or configure it if it's new.")}
                </p>
              </div>
              {isEditMode && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    isClearingRef.current = true;
                    sessionStorage.removeItem("pm_editId");
                    sessionStorage.removeItem("pm_form");
                    sessionStorage.removeItem("pm_lastPopId");
                    setSearchId("");
                    navigate("/product-management");
                    setFormData({ item_id: "", item_name: "", category: "", unit_price: "", current_stock: "", lead_time_days: "" });
                    setLastPopId("");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Cancel Edit
                </Button>
              )}
            </div>

      {!isEditMode && !isAddMode && (
        <form onSubmit={handleSearchEdit} className="bg-card rounded-xl border border-border shadow-sm p-4 flex gap-3">
          <Input 
            placeholder="Search Item ID to Manage (e.g. P001)" 
            value={searchId} 
            onChange={(e) => setSearchId(e.target.value)} 
            className="max-w-xs"
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4 mr-2" />
            Lookup Product
          </Button>
        </form>
      )}

      {(isEditMode || isAddMode) && (
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {isEditMode && productError ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <XCircle className="h-12 w-12 text-risk mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-foreground">Product Not Found</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              The product ID <span className="font-bold text-foreground">{editId}</span> doesn't exist or has been deleted.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <Button 
                variant="outline"
                onClick={() => {
                  isClearingRef.current = true;
                  sessionStorage.removeItem("pm_editId");
                  sessionStorage.removeItem("pm_lastPopId");
                  navigate("/product-management");
                  setFormData({
                    item_id: "", item_name: "", category: "",
                    unit_price: "", current_stock: "", lead_time_days: ""
                  });
                  setSearchId("");
                  setLastPopId("");
                }}
              >
                Go Back
              </Button>
              <Button 
                onClick={() => {
                  isClearingRef.current = true;
                  sessionStorage.removeItem("pm_editId");
                  sessionStorage.removeItem("pm_lastPopId");
                  navigate("/product-management?mode=add");
                  setTimeout(() => setFormData(prev => ({ ...prev, item_id: editId || "" })), 50);
                }}
              >
                <PackagePlus className="mr-2 h-4 w-4" /> Add as New Product
              </Button>
            </div>
          </div>
        ) : (
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Item ID</label>
                <div className="relative">
                  <Input
                    name="item_id"
                    placeholder="e.g. P013"
                    value={formData.item_id}
                    onChange={handleChange}
                    className="pl-9 font-mono"
                    disabled={isEditMode} // Usually shouldn't edit primary keys
                    required
                  />
                  <PackagePlus className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Info className="h-3 w-3" /> Unique identifier for the product
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Product Name</label>
                <Input
                  name="item_name"
                  placeholder="e.g. Wireless Mouse"
                  value={formData.item_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Category</label>
                <Input
                  name="category"
                  placeholder="e.g. Electronics"
                  value={formData.category}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Unit Price (₹)</label>
                <Input
                  name="unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="100.00"
                  value={formData.unit_price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Current Stock</label>
                <Input
                  name="current_stock"
                  type="number"
                  min="0"
                  placeholder="50"
                  value={formData.current_stock}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Lead Time (Days)</label>
                <Input
                  name="lead_time_days"
                  type="number"
                  min="0"
                  placeholder="5"
                  value={formData.lead_time_days}
                  onChange={handleChange}
                  required
                />
              </div>

            </div>

            <div className="pt-4 border-t border-border mt-6 flex flex-col sm:flex-row justify-between gap-4">
              <div className="w-full sm:w-auto">
                {(isEditMode || isAddMode) && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      isClearingRef.current = true;
                      sessionStorage.removeItem("pm_editId");
                      sessionStorage.removeItem("pm_form");
                      sessionStorage.removeItem("pm_lastPopId");
                      navigate("/product-management");
                      setFormData({ item_id: "", item_name: "", category: "", unit_price: "", current_stock: "", lead_time_days: "" });
                      setSearchId("");
                      setLastPopId("");
                    }}
                    disabled={isLoading || isDeleting}
                    className="w-full sm:w-auto min-w-[100px]"
                  >
                    Go Back
                  </Button>
                )}
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                {isEditMode && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDelete} 
                    disabled={isLoading || isDeleting}
                    className="w-full sm:w-auto min-w-[140px]"
                  >
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete Product
                  </Button>
                )}
                <Button type="submit" disabled={isLoading || isDeleting} className="w-full sm:w-auto min-w-[140px]">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? "Saving..." : (isEditMode ? "Update Product" : "Add Product")}
                </Button>
              </div>
            </div>
          </form>
        </div>
        )}
      </div>
      )}
    </div>
  </TabsContent>

  <TabsContent value="recycle-bin" className="animate-in fade-in duration-300">
    <RecycleBinTab />
  </TabsContent>
  <TabsContent value="market-basket" className="animate-in fade-in duration-300">
    <MarketBasketTab />
  </TabsContent>

  <TabsContent value="stock-alerts" className="animate-in fade-in duration-300">
    <StockAlertsTab />
  </TabsContent>
</Tabs>
</div>
);
}
