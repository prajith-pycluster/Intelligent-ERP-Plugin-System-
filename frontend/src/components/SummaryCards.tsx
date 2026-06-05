import { Package, AlertTriangle, TrendingDown, ShieldCheck, TrendingUp, ArrowDownCircle } from "lucide-react";
import type { DashboardFilter } from "@/pages/Dashboard";

interface SummaryCardsProps {
  activeFilter: DashboardFilter;
  onFilterChange: (filter: DashboardFilter) => void;
  metrics: {
    total_products: number;
    stockout_risk_count: number;
    overstock_count: number;
    healthy_count: number;
    high_demand_count?: number;
    low_demand_count?: number;
  };
}

const SummaryCards = ({ activeFilter, onFilterChange, metrics }: SummaryCardsProps) => {
  const cards: { label: string; value: number; icon: any; color: string; bg: string; filterKey: DashboardFilter }[] = [
    { label: "Total Products", value: metrics?.total_products || 0, icon: Package, color: "text-primary", bg: "bg-primary/10", filterKey: "all" },
    { label: "Stockout Risk", value: metrics?.stockout_risk_count || 0, icon: AlertTriangle, color: "text-risk", bg: "bg-risk/10", filterKey: "stockout" },
    { label: "Overstock Items", value: metrics?.overstock_count || 0, icon: TrendingDown, color: "text-warning", bg: "bg-warning/10", filterKey: "overstock" },
    { label: "Healthy Inventory", value: metrics?.healthy_count || 0, icon: ShieldCheck, color: "text-success", bg: "bg-success/10", filterKey: "healthy" },
    { label: "High Demand", value: metrics?.high_demand_count || 0, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10", filterKey: "high_demand" },
    { label: "Low Demand", value: metrics?.low_demand_count || 0, icon: ArrowDownCircle, color: "text-sky-500", bg: "bg-sky-500/10", filterKey: "low_demand" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map((c) => (
        <button
          key={c.label}
          onClick={() => onFilterChange(activeFilter === c.filterKey ? "all" : c.filterKey)}
          className={`bg-card rounded-xl border-2 p-5 flex items-center gap-4 shadow-sm text-left transition-all duration-200 hover:shadow-md active:scale-[0.97] ${activeFilter === c.filterKey && activeFilter !== "all"
              ? "border-primary ring-1 ring-primary/20"
              : "border-border hover:border-muted-foreground/30"
            }`}
        >
          <div className={`${c.bg} ${c.color} p-3 rounded-lg`}>
            <c.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold text-card-foreground tabular-nums">{c.value}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default SummaryCards;
