import { useState, useMemo } from "react";
import { useRestockHistory } from "@/hooks/useInventory";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ClipboardList, Search, Loader2 } from "lucide-react";

// --- Inventory Activity (Restock History) ---
const InventoryActivity = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: history = [], isLoading } = useRestockHistory();

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    if (!searchQuery.trim()) return history;
    const lowerQuery = searchQuery.toLowerCase();
    return history.filter((r: any) => 
      (r.item_id && r.item_id.toLowerCase().includes(lowerQuery)) ||
      (r.product_name && r.product_name.toLowerCase().includes(lowerQuery))
    );
  }, [history, searchQuery]);

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex gap-3">
        <Input 
          placeholder="Search by Product ID or Name..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="max-w-md"
        />
        <Button variant="secondary" className="pointer-events-none">
          <Search className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Clock className="h-12 w-12 opacity-20" />
            <p>No restock activity found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item ID</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((item: any) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                  <TableCell className="font-semibold text-primary/80">{item.item_id}</TableCell>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-blue-500 border-blue-500/20">{item.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">+{item.quantity_added}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default function WarehouseHistory() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 w-full">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-[32px] font-bold flex items-center gap-2 text-foreground leading-[40px]">
            <ClipboardList className="h-5 w-5 text-primary" />
            Warehouse History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Review operational restocks and inventory movement history.</p>
        </div>
      </div>
      <InventoryActivity />
    </div>
  );
}
