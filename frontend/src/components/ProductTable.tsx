import { useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown } from "lucide-react";
import { Product } from "@/data/mockData";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Loader2, MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { DashboardFilter } from "@/pages/Dashboard";

type SortKey = keyof Product;

const filterLabels: Record<DashboardFilter, string> = {
  all: "All Products",
  stockout: "Stockout Risk Items",
  overstock: "Overstock Items",
  healthy: "Healthy Inventory",
  high_demand: "High Demand Items",
  low_demand: "Low Demand Items",
};

const ProductTable = ({ products, filterLabel, onRefresh }: { products: Product[]; filterLabel: DashboardFilter, onRefresh?: () => void }) => {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("item_id");
  const [sortAsc, setSortAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const openEdit = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    navigate(`/product-management?id=${p.item_id}`);
  };

  const openDelete = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    navigate(`/product-management?id=${p.item_id}`);
  };

  const filteredBySearch = products.filter((p: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.item_id.toLowerCase().includes(q) 
      || (p.item_name && p.item_name.toLowerCase().includes(q))
      || (p.category && p.category.toLowerCase().includes(q));
  });

  const sorted = [...filteredBySearch].sort((a: any, b: any) => {
    const av = a[sortKey], bv = b[sortKey];
    if (typeof av === "number" && typeof bv === "number") return sortAsc ? av - bv : bv - av;
    return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const riskBadge = (val: string, type: "stockout" | "overstock") => {
    if (val === "YES") {
      return type === "stockout"
        ? <Badge className="bg-risk/15 text-risk border-0 font-medium">YES</Badge>
        : <Badge className="bg-warning/15 text-warning border-0 font-medium">YES</Badge>;
    }
    return <Badge className="bg-success/15 text-success border-0 font-medium">NO</Badge>;
  };

  const trendBadge = (trend: string) => {
    const cls = trend === "Increasing" ? "bg-success/15 text-success" : trend === "Decreasing" ? "bg-risk/15 text-risk" : "bg-muted text-muted-foreground";
    return <Badge className={`${cls} border-0 font-medium`}>{trend}</Badge>;
  };

  const headers: { key: SortKey; label: string }[] = [
    { key: "item_id", label: "Product" },
    { key: "category" as SortKey, label: "Category" },
    { key: "unit_price" as SortKey, label: "Unit Price (₹)" },
    { key: "inventory_turnover" as SortKey, label: "Inventory Turnover" },
    { key: "current_stock", label: "Current Stock" },
    { key: "safety_stock", label: "Safety Stock" },
    { key: "reorder_point", label: "Reorder Point" },
    { key: "reorder_quantity", label: "Reorder Qty" },
    { key: "stockout_risk", label: "Stockout Risk" },
    { key: "overstock_risk", label: "Overstock Risk" },
    { key: "demand_trend", label: "Demand Trend" },
    { key: "item_id", label: "Actions" } // fake key for actions, not sortable realistically
  ];

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-semibold text-card-foreground">{filterLabels[filterLabel]}</h2>
          <p className="text-sm text-muted-foreground">{filteredBySearch.length} item{filteredBySearch.length !== 1 ? "s" : ""} · Click a row for insights</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search Products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full sm:w-64"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h) => (
                <TableHead key={h.key} className="cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap" onClick={() => toggleSort(h.key)}>
                  <span className="flex items-center gap-1">{h.label}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {["A", "B", "C"].map((abc) => {
               const groupItems = sorted.filter((p: any) => (p.abc_class || "C") === abc);
               if (groupItems.length === 0) return null;
               
               return (
                 <Fragment key={abc}>
                   <TableRow className="bg-muted/30 hover:bg-muted/30">
                     <TableCell colSpan={12} className="font-bold text-foreground py-2 border-y">
                       Class {abc} Items {abc === "A" ? "(High Value)" : abc === "B" ? "(Moderate Value)" : "(Low Value)"}
                     </TableCell>
                   </TableRow>
                   {groupItems.map((p) => {
                     const rowColor = p.stockout_risk === "YES" ? "bg-risk/5 hover:bg-risk/10" : p.overstock_risk === "YES" ? "bg-warning/5 hover:bg-warning/10" : "hover:bg-muted/50";
                     return (
                       <TableRow key={p.item_id} className={`${rowColor} cursor-pointer transition-colors`} onClick={() => navigate(`/insights?id=${p.item_id}`)}>
                         <TableCell className="font-medium">
                           <div className="flex items-center gap-2">
                             <div>
                               <span className="text-primary font-semibold tracking-tight">{p.item_id}</span>
                               <span className="text-muted-foreground tracking-tight"> - {(p as any).item_name || "Unknown Product"}</span>
                             </div>
                             {(p as any).predictive_tag === "EXPI" && (
                               <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 uppercase font-bold text-[10px] h-5 px-1.5 py-0 leading-none items-center">EXPI</Badge>
                             )}
                             {(p as any).predictive_tag === "PI" && (
                               <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 uppercase font-bold text-[10px] h-5 px-1.5 py-0 leading-none items-center">PI</Badge>
                             )}
                           </div>
                         </TableCell>
                         <TableCell>
                           <Badge variant="outline" className="font-normal text-xs whitespace-nowrap">{(p as any).category || "Uncategorized"}</Badge>
                         </TableCell>
                         <TableCell>₹{((p as any).unit_price || 0).toFixed(2)}</TableCell>
                         <TableCell>{(p as any).inventory_turnover || 0}</TableCell>
                         <TableCell>{Math.round(Number(p.current_stock))}</TableCell>
                         <TableCell>{Math.round(Number(p.safety_stock))}</TableCell>
                         <TableCell>{Math.round(Number(p.reorder_point))}</TableCell>
                         <TableCell>{Math.round(Number(p.reorder_quantity))}</TableCell>
                         <TableCell>{riskBadge(p.stockout_risk, "stockout")}</TableCell>
                         <TableCell>{riskBadge(p.overstock_risk, "overstock")}</TableCell>
                         <TableCell>{trendBadge(p.demand_trend)}</TableCell>
                         <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => openEdit(e as any, p)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => openDelete(e as any, p)} className="text-risk focus:text-risk">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                         </TableCell>
                       </TableRow>
                     );
                   })}
                 </Fragment>
               );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductTable;
