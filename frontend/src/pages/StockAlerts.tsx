import { useState, useEffect } from "react";
import { useProducts, useSendWhatsAppAlert } from "@/hooks/useInventory";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertCircle, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function StockAlerts() {
  const { data: products = [], isLoading } = useProducts();
  const alertMutation = useSendWhatsAppAlert();
  const [alertSentStatus, setAlertSentStatus] = useState<Record<string, string | boolean>>(() => {
    const saved = localStorage.getItem("pm_alertSentStatus");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("pm_alertSentStatus", JSON.stringify(alertSentStatus));
  }, [alertSentStatus]);

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
      setAlertSentStatus(cleanStatus);
    }
  }, [products]);

  const [selectedAlertItem, setSelectedAlertItem] = useState<any>(null);
  const [isNotifyingAll, setIsNotifyingAll] = useState(false);

  const criticalItems = products
    .filter((p: any) => p.current_stock <= Math.round(p.safety_stock))
    .sort((a: any, b: any) => {
      const aSent = !!alertSentStatus[a.item_id];
      const bSent = !!alertSentStatus[b.item_id];
      if (aSent !== bSent) {
        return aSent ? 1 : -1;
      }
      return a.current_stock - b.current_stock;
    });

  const handleNotifyGodown = async () => {
    if (!selectedAlertItem) return;
    
    const message = `📢 Alert from Intelligent ERP Plugin\n🚨 CRITICAL STOCK ITEMS 🚨\n1. ${selectedAlertItem.item_id} - ${selectedAlertItem.item_name} → Stock: ${selectedAlertItem.current_stock}\nAction: Immediate restock required.`;
    const alertDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    
    try {
      await alertMutation.mutateAsync({ message });
      setAlertSentStatus((prev) => ({ ...prev, [selectedAlertItem.item_id]: alertDate }));
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
    const alertDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    
    setIsNotifyingAll(true);
    try {
      await alertMutation.mutateAsync({ message });
      const newStatus = { ...alertSentStatus };
      pendingItems.forEach((item: any) => {
        newStatus[item.item_id] = alertDate;
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
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-[32px] font-bold flex items-center gap-2 text-foreground leading-[40px]">
            <AlertCircle className="h-5 w-5 text-risk" />
            Stock Alerts & Critical Products
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Products with current stock below safety levels. Send WhatsApp restocking notifications.</p>
        </div>
      </div>

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
}
