import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBatchRestock } from "@/hooks/useInventory";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, ArrowLeft, Loader2, Save } from "lucide-react";

export default function RestockBilling() {
  const location = useLocation();
  const navigate = useNavigate();
  const restockMutation = useBatchRestock();

  const initialList = location.state?.restockList || [];
  
  // State to hold the quantities configured by the user
  const [items, setItems] = useState<{item_id: string, product_name: string, quantity_added: number}[]>([]);

  useEffect(() => {
    if (initialList.length === 0) {
      navigate('/warehouse/inventory');
    } else {
      setItems(initialList.map((i: any) => ({
        item_id: i.item_id,
        product_name: i.product_name,
        quantity_added: i.suggested_quantity
      })));
    }
  }, [initialList, navigate]);

  const handleQuantityChange = (itemId: string, newQ: string) => {
    const val = parseInt(newQ);
    setItems(items.map(item => 
      item.item_id === itemId ? { ...item, quantity_added: isNaN(val) ? 0 : val } : item
    ));
  };

  const handleConfirm = () => {
    // Validate quantities
    const validItems = items.filter(item => item.quantity_added > 0);
    if (validItems.length === 0) return;

    restockMutation.mutate({ items: validItems }, {
      onSuccess: () => {
        sessionStorage.removeItem("warehouse_load_list");
        sessionStorage.removeItem("godown_load_list");
        navigate('/warehouse/inventory'); // Navigate back after success
      }
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Button variant="ghost" onClick={() => navigate('/warehouse/inventory')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <ShieldCheck className="w-8 h-8 text-blue-500" />
        </div>
        <div>
          <h1 className="text-[32px] font-bold tracking-tight leading-[40px]">Warehouse Execution</h1>
          <p className="text-muted-foreground mt-1">Review and confirm the batch restock entries.</p>
        </div>
      </div>

      <Card className="shadow-sm border-border/60">
        <CardHeader className="bg-muted/10 border-b border-border/50">
          <CardTitle>Restock Manifest</CardTitle>
          <CardDescription>Adjust quantities for {items.length} product(s) prior to updating the central inventory.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[150px]">Product ID</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="w-[200px]">Stock Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.item_id}>
                    <TableCell className="font-semibold">{item.item_id}</TableCell>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        min="0"
                        value={item.quantity_added === 0 ? '' : item.quantity_added} 
                        onChange={(e) => handleQuantityChange(item.item_id, e.target.value)}
                        className="w-full max-w-[150px] focus-visible:ring-blue-500 font-medium"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-8 flex justify-end">
            <Button 
              size="lg" 
              onClick={handleConfirm} 
              disabled={restockMutation.isPending || !items.some(i => i.quantity_added > 0)}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]"
            >
              {restockMutation.isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Committing...</>
              ) : (
                <><Save className="w-5 h-5 mr-2" /> Confirm Restock</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
