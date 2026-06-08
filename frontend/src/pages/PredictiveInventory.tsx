import React, { useState } from "react";
import { 
  Sparkles, 
  Play, 
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRightCircle,
  Loader2,
  CalendarX,
  Send,
  RotateCcw,
  PackageX
} from "lucide-react";
import { 
  usePredictiveInventory, 
  useRunPredictiveEngine,
  usePredictiveReview,
  usePredictiveRevert,
  usePredictiveApprove
} from "@/hooks/useInventory";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function PredictiveInventory() {
  const { data, isLoading } = usePredictiveInventory();
  const runEngineMutation = useRunPredictiveEngine();
  const reviewMutation = usePredictiveReview();
  const revertMutation = usePredictiveRevert();
  const approveMutation = usePredictiveApprove();

  const [mainTab, setMainTab] = useState("all_stocks");
  const [activeTab, setActiveTab] = useState("exps");
  const [selectedReviewItem, setSelectedReviewItem] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<string>("");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Godown-approved IDs persisted in localStorage
  const [godownApproved, setGodownApproved] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("pi_godown_approved");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const persistApproved = (updated: Set<string>) => {
    setGodownApproved(updated);
    localStorage.setItem("pi_godown_approved", JSON.stringify([...updated]));
  };

  const handleApproveToGodown = async (item: any, isPending = false) => {
    setApprovingId(item.item_id);
    try {
      if (isPending) {
        // Pending PS: create product in DB first, then flag for Godown
        await approveMutation.mutateAsync({
          item_id: item.item_id,
          item_name: item.item_name,
          category: item.category || "General",
          unit_price: parseFloat(item.unit_price) || 0,
          suggested_qty: item.suggested_qty || item.additional_qty || 0,
          predictive_score: item.predictive_score || 0,
          predictive_reason: item.predictive_reason || ""
        });
      }
      const updated = new Set(godownApproved);
      updated.add(item.item_id);
      persistApproved(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading Predictive Intelligence...</span>
      </div>
    );
  }

  const activeStocks = data?.active_stocks || [];
  const godownRecs = data?.godown_recommendations || [];
  const reviewDeadline = data?.review_deadline || [];
  const reviewManual = data?.review_manual || [];
  const allReviewItems = [...reviewDeadline, ...reviewManual];

  // Derive correct tag from item_id prefix: SI/NI/FI = PS, P = EXPS
  const getDisplayTag = (item: any): string => {
    const id = String(item.item_id || "").toUpperCase();
    if (id.startsWith("SI") || id.startsWith("NI") || id.startsWith("FI")) return "PS";
    return item.predictive_tag || "EXPS";
  };

  const handleRunEngine = () => {
    runEngineMutation.mutate();
  };

  const handleRevert = (item: any) => {
    revertMutation.mutate({ 
      item_id: item.item_id || item.dataset_item_id,
      item_name: item.item_name || item.product_name || "Unknown",
      category: item.category || "Unknown",
      unit_price: item.unit_price || 0
    }, {
      onSuccess: () => {
        setMainTab("predictive_engine");
        setActiveTab("review");
      }
    });
  };

  const handleReview = () => {
    if (selectedReviewItem && reviewAction) {
      reviewMutation.mutate({ item_id: selectedReviewItem.item_id, action: reviewAction });
      setSelectedReviewItem(null);
      setReviewAction("");
    }
  };

  const openReviewDialog = (item: any, action: string) => {
    setSelectedReviewItem(item);
    setReviewAction(action);
  };

  const totalReviewItems = allReviewItems.length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card p-5 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-[32px] font-bold flex items-center gap-2 text-foreground leading-[40px]">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Predictive Inventory Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-assisted forecasting for seasonal products, temporary stock, and lifecycle management.
          </p>
        </div>
        
        <Button 
          onClick={handleRunEngine} 
          disabled={runEngineMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {runEngineMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Run Predictive Engine
        </Button>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className="mb-6 grid w-full md:w-auto grid-cols-1 md:grid-cols-2 h-auto gap-2 p-1 bg-muted/50 rounded-lg">
          <TabsTrigger value="all_stocks" className="py-2.5 font-bold text-base">All Stocks</TabsTrigger>
          <TabsTrigger value="predictive_engine" className="py-2.5 font-bold text-base">Predictive Engine</TabsTrigger>
        </TabsList>

        <TabsContent value="predictive_engine" className="animate-in fade-in duration-300">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 grid w-full md:w-auto grid-cols-1 md:grid-cols-3 h-auto gap-2 p-1 bg-muted/50 rounded-lg">
              <TabsTrigger value="exps" className="py-2.5">Existing Predictive Stocks</TabsTrigger>
              <TabsTrigger value="ps" className="py-2.5">Predictive Stocks (PS)</TabsTrigger>
              <TabsTrigger value="review" className="py-2.5">
                Review Window 
                {totalReviewItems > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {totalReviewItems}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
        
            <TabsContent value="exps" className="animate-in fade-in duration-300">
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/20">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Existing Predictive Stocks (EXPS)
                  </h3>
                </div>
                {activeStocks.filter((i:any) => i.predictive_tag === "EXPS" && i.item_id.toUpperCase().startsWith("P")).length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <p>No EXPS stocks active.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item ID</TableHead>
                        <TableHead className="w-1/3">Name</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead className="text-right">Current Stock</TableHead>
                        <TableHead className="text-right">Predicted Demand</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeStocks.filter((i:any) => i.predictive_tag === "EXPS" && i.item_id.toUpperCase().startsWith("P")).map((item: any) => {
                        const isApproved = godownApproved.has(item.item_id);
                        return (
                        <TableRow key={item.item_id}>
                          <TableCell className="font-medium text-primary">{item.item_id}</TableCell>
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell className="font-medium text-green-700">{item.unit_price != null && item.unit_price > 0 ? `₹${item.unit_price}` : "N/A"}</TableCell>
                          <TableCell className="text-right">{item.current_stock}</TableCell>
                          <TableCell className="text-right font-semibold">{item.predicted_demand}</TableCell>
                          <TableCell className="text-right">
                            {isApproved ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200 font-semibold text-xs px-3 py-1">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Approved to Godown
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={approvingId === item.item_id}
                                onClick={() => handleApproveToGodown(item, false)}
                              >
                                {approvingId === item.item_id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                                Approve to Godown
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ps" className="animate-in fade-in duration-300">
              {(() => {
                // Approved PS items (already in product_table with tag PS)
                const approvedPS = activeStocks.filter((i: any) => i.predictive_tag === "PS");
                const approvedIds = new Set(approvedPS.map((i: any) => i.item_id));

                // Pending PS items (from predictive datasets, not yet approved in Godown)
                const pendingPS = godownRecs
                  .filter((r: any) => r.predictive_tag === "PS" && !approvedIds.has(r.item_id))
                  .map((r: any) => ({
                    ...r,
                    current_stock: r.current_stock ?? 0,
                    _status: "pending"
                  }));

                const psStocks = [
                  ...approvedPS.map((i: any) => ({ ...i, _status: "active" })),
                  ...pendingPS
                ];

                return (
                  <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          Predictive Stocks (PS)
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                          <span className="text-muted-foreground">Active: {approvedPS.length}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                          <span className="text-muted-foreground">Pending: {pendingPS.length}</span>
                        </span>
                      </div>
                    </div>
                    {psStocks.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground">
                        <p>No PS stocks currently active or pending.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                      <TableRow>
                        <TableHead>Item ID</TableHead>
                        <TableHead className="w-1/3">Name</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead className="text-right">Current Stock</TableHead>
                        <TableHead className="text-right">Predicted Demand</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {psStocks.map((item: any) => {
                        const isApproved = godownApproved.has(item.item_id);
                        const isPending = item._status === "pending";
                        return (
                        <TableRow key={item.item_id}>
                          <TableCell className="font-medium text-primary">{item.item_id}</TableCell>
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell className="font-medium text-green-700">{item.unit_price != null && item.unit_price > 0 ? `₹${item.unit_price}` : "N/A"}</TableCell>
                          <TableCell className="text-right">{item.current_stock ?? 0}</TableCell>
                          <TableCell className="text-right font-semibold">{item.predicted_demand}</TableCell>
                              <TableCell className="text-right">
                                {isApproved ? (
                                  <Badge className="bg-green-100 text-green-700 border-green-200 font-semibold text-xs px-3 py-1">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Approved to Godown
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={approvingId === item.item_id || approveMutation.isPending}
                                    onClick={() => handleApproveToGodown(item, isPending)}
                                  >
                                    {approvingId === item.item_id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                                    Approve to Godown
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                );
              })()}
            </TabsContent>

            {/* REVIEW WINDOW TAB */}
            <TabsContent value="review" className="animate-in fade-in duration-300 space-y-6">
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/20">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CalendarX className="h-5 w-5 text-red-500" />
                    Expired Lifecycle Products (Review Window)
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Products awaiting review due to expired lifecycle or manual reversion.</p>
                </div>
                {allReviewItems.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <p>No products in the review window.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item ID</TableHead>
                        <TableHead className="w-1/4">Product Name</TableHead>
                        <TableHead className="text-right">Current Stock</TableHead>
                        <TableHead>Lifecycle Status</TableHead>
                        <TableHead>Expiry / Deadline Date</TableHead>
                        <TableHead>Recommended Action</TableHead>
                        <TableHead className="text-right">Decision</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allReviewItems.map((item: any) => {
                        const status = item.inventory_mode === "REVIEW_DEADLINE" ? "Expired" : "Reverted";
                        const isTemp = String(item.item_id).toUpperCase().startsWith("SI") || 
                                       String(item.item_id).toUpperCase().startsWith("NI") || 
                                       String(item.item_id).toUpperCase().startsWith("FI");
                        const recommendedAction = isTemp ? "Remove from Predictive" : "Move to Normal";
                        
                        return (
                          <TableRow key={item.item_id}>
                            <TableCell className="font-medium text-primary">{item.item_id}</TableCell>
                            <TableCell className="font-medium">{item.item_name}</TableCell>
                            <TableCell className="text-right">{item.current_stock}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`font-semibold text-[11px] px-2 py-0.5 ${status === "Expired" ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                                {status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{item.predictive_end || "N/A"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground italic">{recommendedAction}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => openReviewDialog(item, "EXCLUDE")}
                              >
                                Remove From Predictive
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => openReviewDialog(item, "NORMAL")}
                              >
                                Move To Normal
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ALL STOCKS TAB */}
        <TabsContent value="all_stocks" className="animate-in fade-in duration-300">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                All Approved Predictive Stocks
              </h3>
              <p className="text-sm text-muted-foreground mt-1">These products are active and available in the Billing Window.</p>
            </div>
            {(() => {
              const inStockItems = activeStocks.filter((item: any) => Number(item.current_stock) > 0);
              return inStockItems.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <PackageX className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No predictive stocks have been physically restocked from the godown yet.</p>
                  <p className="text-xs mt-1">Approve items in Godown → Predictive Restocking to stock them.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item ID</TableHead>
                      <TableHead className="w-1/3">Name</TableHead>
                      <TableHead>Tag</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead className="text-right">Predicted Demand</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inStockItems.map((item: any) => (
                      <TableRow key={item.item_id}>
                        <TableCell className="font-medium text-primary">{item.item_id}</TableCell>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`uppercase font-bold text-[10px] ${getDisplayTag(item) === 'PS' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                            {getDisplayTag(item)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-green-700">{item.unit_price != null && item.unit_price > 0 ? `₹${item.unit_price}` : "N/A"}</TableCell>
                        <TableCell className="text-right">{item.current_stock}</TableCell>
                        <TableCell className="text-right font-semibold">{item.predicted_demand}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            })()}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!selectedReviewItem} onOpenChange={(o) => (!o ? setSelectedReviewItem(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewAction === "EXCLUDE" ? "Remove from Predictive Inventory" : "Move to Normal Inventory"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reviewAction === "EXCLUDE" ? (
                <>
                  Are you sure you want to exclude <b>{selectedReviewItem?.item_name}</b> from future predictive calculations? The product will remain in the normal inventory database and can be sold if stock exists.
                </>
              ) : (
                <>
                  Are you sure you want to convert <b>{selectedReviewItem?.item_name}</b> back to a standard inventory item? It will continue to exist in Product Management and Billing, but will no longer have predictive status.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reviewMutation.isPending}>Cancel</AlertDialogCancel>
            <Button 
              onClick={handleReview} 
              disabled={reviewMutation.isPending} 
              variant={reviewAction === "EXCLUDE" ? "destructive" : "default"}
            >
              {reviewMutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />} 
              Confirm
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
