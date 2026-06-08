import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts, usePredictiveInventory, usePredictiveApprove } from "@/hooks/useInventory";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackageSearch, ShoppingCart, Plus, Check, Loader2, AlertTriangle } from "lucide-react";

export default function WarehouseInventory() {
  const { data: products, isLoading } = useProducts();
  const { data: predictiveData, isLoading: predictiveLoading } = usePredictiveInventory();
  const approveMutation = usePredictiveApprove();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem("warehouse_active_tab") || "restock-required";
  });

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    sessionStorage.setItem("warehouse_active_tab", val);
  };

  // Persistent Load List State via Session Storage
  const [loadList, setLoadList] = useState<{item_id: string, product_name: string, suggested_quantity: number}[]>(() => {
    try {
      const saved = sessionStorage.getItem("warehouse_load_list") || sessionStorage.getItem("godown_load_list");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync Load List to Session Storage on Change
  useEffect(() => {
    sessionStorage.setItem("warehouse_load_list", JSON.stringify(loadList));
  }, [loadList]);

  // Sync with Backend items: Drop validly restocked or optimal items globally
  useEffect(() => {
    if (products && predictiveData) {
      setLoadList(prev => prev.filter(item => {
        const product = products.find((p: any) => p.item_id === item.item_id);
        const predRec = predictiveData?.godown_recommendations?.find((p: any) => p.item_id === item.item_id);
        return (product && (product.stockout_risk === "YES" || product.inventory_mode === "PREDICTIVE")) || predRec;
      }));
    }
  }, [products, predictiveData]);

  // Custom Inline Quantities State
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>({});

  if (isLoading || predictiveLoading) {
    return (
      <div className="p-8 text-muted-foreground animate-pulse flex items-center gap-2">
        <PackageSearch className="w-5 h-5"/> Loading Warehouse Items...
      </div>
    );
  }

  const restockItems = products?.filter((p: any) => p.stockout_risk === "YES") || [];

  // Only show predictive recs that were explicitly approved from Predictive Inventory page
  const approvedIds: Set<string> = (() => {
    try {
      const saved = localStorage.getItem("pi_godown_approved") || localStorage.getItem("pi_warehouse_approved");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  })();

  const predictiveRecs = (predictiveData?.godown_recommendations || [])
    .filter((p: any) => p.additional_qty > 0 && approvedIds.has(p.item_id));

  const handleQuantityChange = (itemId: string, val: string) => {
    const num = parseInt(val, 10);
    setCustomQuantities(prev => ({ ...prev, [itemId]: isNaN(num) ? 0 : num }));
  };

  const handleAdd = (product: any, currentQty: number) => {
    if (!loadList.find(item => item.item_id === product.item_id)) {
      setLoadList([...loadList, {
        item_id: product.item_id,
        product_name: product.item_name || product.product_name,
        suggested_quantity: currentQty
      }]);
    }
  };

  const handleApprove = async (p: any) => {
    try {
      if (p.predictive_tag === "PS") {
        await approveMutation.mutateAsync({
          item_id: p.item_id,
          item_name: p.item_name,
          category: p.category,
          unit_price: parseFloat(p.unit_price) || 0,
          suggested_qty: p.suggested_qty,
          predictive_score: p.predictive_score,
          predictive_reason: p.predictive_reason
        });
      }
      handleAdd(p, p.additional_qty);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = (itemId: string) => {
    setLoadList(loadList.filter(item => item.item_id !== itemId));
  };

  const handleProceed = () => {
    navigate("/restock-billing", { state: { restockList: loadList } });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 w-full">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm mb-6">
        <div>
          <h1 className="text-[32px] font-bold flex items-center gap-2 text-foreground leading-[40px]">
            <PackageSearch className="w-5 h-5 text-primary" />
            Warehouse Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Review items at stockout risk and track batch restocks.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="restock-required">Normal Restocking</TabsTrigger>
            <TabsTrigger value="predictive-restocking">Predictive Restocking</TabsTrigger>
          </TabsList>

          {/* Proceed Bar if Batched - visible on both Normal and Predictive tabs */}
          {loadList.length > 0 && (activeTab === "restock-required" || activeTab === "predictive-restocking") && (
            <div className="flex items-center gap-4 bg-primary/10 p-2.5 px-4 rounded-xl border border-primary/20 shadow-sm animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <span className="font-semibold text-primary">{loadList.length} item{loadList.length > 1 ? 's' : ''} batched</span>
              </div>
              <Button onClick={handleProceed} className="shadow-md">
                Proceed to Billing
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="restock-required" className="animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 clear-both">
            <Card className="lg:col-span-2 shadow-sm border-border/50">
              <CardHeader>
                <CardTitle>Items Requiring Restock</CardTitle>
                <CardDescription>Only displaying products flagged with high stockout risk.</CardDescription>
              </CardHeader>
              <CardContent>
                {restockItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <Check className="w-12 h-12 mx-auto text-green-500/50 mb-3" />
                    <p>All stock levels are optimal. No items currently require restocking.</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Product ID</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Current</TableHead>
                          <TableHead>Reorder Needed</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {restockItems.map((p: any) => {
                          const isAdded = loadList.some(i => i.item_id === p.item_id);
                          const defaultQty = Math.max(1, Math.round(p.reorder_quantity || p.final_demand || 10));
                          const currentQty = customQuantities[p.item_id] !== undefined ? customQuantities[p.item_id] : defaultQty;

                          return (
                            <TableRow key={p.item_id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="font-medium text-primary/80">{p.item_id}</TableCell>
                              <TableCell>{p.item_name}</TableCell>
                              <TableCell>
                                <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">{p.current_stock}</Badge>
                              </TableCell>
                              <TableCell>
                                <Input 
                                  type="number"
                                  min="1"
                                  className="w-24 h-8 font-medium"
                                  value={currentQty === 0 ? "" : currentQty}
                                  onChange={(e) => handleQuantityChange(p.item_id, e.target.value)}
                                  disabled={isAdded}
                                />
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                {isAdded ? (
                                  <Button variant="outline" size="sm" onClick={() => handleRemove(p.item_id)} className="border-green-500/50 text-green-600 hover:bg-green-50">
                                    <Check className="w-4 h-4 mr-1" /> Added
                                  </Button>
                                ) : (
                                  <Button size="sm" onClick={() => handleAdd(p, currentQty)} className="shadow-sm">
                                    <Plus className="w-4 h-4 mr-1" /> Add
                                  </Button>
                                )}
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

            {/* Load List Summary Sidebar */}
            <Card className="shadow-sm border-border/50 bg-muted/10 h-fit sticky top-6">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5"/> Load List
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {loadList.length === 0 ? (
                  <div className="text-muted-foreground text-sm text-center py-6">
                    No items added yet. Click 'Add' on items to batch them.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loadList.map(item => (
                      <div key={item.item_id} className="flex items-center justify-between p-2 rounded-md bg-background border shadow-xs text-sm">
                        <div className="flex flex-col truncate pr-2">
                          <span className="font-semibold truncate">{item.product_name}</span>
                          <span className="text-xs text-muted-foreground">{item.item_id}</span>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          Qty: {item.suggested_quantity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictive-restocking" className="animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 clear-both">
            <Card className="lg:col-span-2 shadow-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" /> 
                  Predictive Restocking Queue
                </CardTitle>
                <CardDescription>AI-driven seasonal and event-based recommendations awaiting approval.</CardDescription>
              </CardHeader>
              <CardContent>
                {predictiveRecs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <Check className="w-12 h-12 mx-auto text-green-500/50 mb-3" />
                    <p>No actionable predictive restocks at this time.</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Product ID</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Current</TableHead>
                          <TableHead>Reorder Qty</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {predictiveRecs.map((p: any) => {
                          const isAdded = loadList.some(i => i.item_id === p.item_id);
                          const additionalQty = p.additional_qty || 0;
                          const product = products?.find((prod: any) => prod.item_id === p.item_id);
                          const currentStock = product?.current_stock !== undefined ? product.current_stock : "N/A";

                          return (
                            <TableRow key={p.item_id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="font-medium text-primary/80">{p.item_id}</TableCell>
                              <TableCell>{p.item_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-medium">{currentStock}</Badge>
                              </TableCell>
                              <TableCell className="font-bold text-amber-600">{additionalQty}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                {isAdded ? (
                                  <Button variant="outline" size="sm" onClick={() => handleRemove(p.item_id)} className="border-green-500/50 text-green-600 hover:bg-green-50">
                                    <Check className="w-4 h-4 mr-1" /> Approved
                                  </Button>
                                ) : (
                                  <Button size="sm" onClick={() => handleApprove(p)} disabled={approveMutation.isPending} className="shadow-sm">
                                    {approveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} 
                                    Approve
                                  </Button>
                                )}
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

            {/* Reuse the Load List Sidebar */}
            <Card className="shadow-sm border-border/50 bg-muted/10 h-fit sticky top-6">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5"/> Load List
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {loadList.length === 0 ? (
                  <div className="text-muted-foreground text-sm text-center py-6">
                    No items added yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loadList.map(item => (
                      <div key={item.item_id} className="flex items-center justify-between p-2 rounded-md bg-background border shadow-xs text-sm">
                        <div className="flex flex-col truncate pr-2">
                          <span className="font-semibold truncate">{item.product_name}</span>
                          <span className="text-xs text-muted-foreground">{item.item_id}</span>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          Qty: {item.suggested_quantity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
