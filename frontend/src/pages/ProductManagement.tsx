import React, { useState, useEffect, useMemo } from "react";
import { PackagePlus, Save, Loader2, Info, Edit, Trash2, Search, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRecycleBin, useRestoreProduct, usePermanentDeleteProduct, useProduct, useAddProduct, useEditProduct, useDeleteProduct, useProducts } from "@/hooks/useInventory";
import ProductInsights from "./ProductInsights";

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

export default function ProductManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam && ["active", "recycle-bin", "insights"].includes(tabParam)) {
      return tabParam;
    }
    return sessionStorage.getItem("pm_activeTab") || "active";
  });
  const navigate = useNavigate();
  const editId = searchParams.get("id");
  const isClearingRef = React.useRef(false);
  
  const tabParam = searchParams.get("tab");
  useEffect(() => {
    if (tabParam && ["active", "recycle-bin", "insights"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    sessionStorage.setItem("pm_activeTab", tab);
    const newParams = new URLSearchParams();
    newParams.set("tab", tab);
    setSearchParams(newParams);
  };
  
  useEffect(() => {
    if (isClearingRef.current) {
      if (!editId) isClearingRef.current = false;
      return;
    }
    const savedId = sessionStorage.getItem("pm_editId");
    if (editId) {
      sessionStorage.setItem("pm_editId", editId);
    } else if (savedId && !searchParams.has("id")) {
      navigate(`/product-management?id=${savedId}&tab=${activeTab}`, { replace: true });
    }
  }, [editId, navigate, searchParams, activeTab]);

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
          <h1 className="text-[32px] font-bold flex items-center gap-2 text-foreground leading-[40px]">
            <PackagePlus className="h-5 w-5 text-primary" />
            Product Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage active inventory items or restore deleted products.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6 grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="active">Active Products</TabsTrigger>
          <TabsTrigger value="recycle-bin">Recycle Bin</TabsTrigger>
          <TabsTrigger value="insights">Product Insights</TabsTrigger>
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
  <TabsContent value="insights" className="animate-in fade-in duration-300">
    <ProductInsights />
  </TabsContent>
</Tabs>
</div>
);
}
