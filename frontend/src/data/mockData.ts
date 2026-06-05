export interface Product {
  item_id: string;
  final_demand: number;
  current_stock: number;
  safety_stock: number;
  reorder_point: number;
  reorder_quantity: number;
  stockout_risk: "YES" | "NO";
  overstock_risk: "YES" | "NO";
  demand_trend: "Increasing" | "Decreasing" | "Stable";
  history?: { month: string; demand: number }[];
}

export const products: Product[] = [
  { item_id: "P001", final_demand: 12.5, current_stock: 20, safety_stock: 9.02, reorder_point: 39.44, reorder_quantity: 21, stockout_risk: "YES", overstock_risk: "NO", demand_trend: "Increasing" },
  { item_id: "P002", final_demand: 8.3, current_stock: 55, safety_stock: 6.1, reorder_point: 22.8, reorder_quantity: 15, stockout_risk: "NO", overstock_risk: "YES", demand_trend: "Decreasing" },
  { item_id: "P003", final_demand: 15.7, current_stock: 40, safety_stock: 11.5, reorder_point: 45.2, reorder_quantity: 28, stockout_risk: "NO", overstock_risk: "NO", demand_trend: "Stable" },
  { item_id: "P004", final_demand: 5.2, current_stock: 8, safety_stock: 4.8, reorder_point: 18.6, reorder_quantity: 12, stockout_risk: "YES", overstock_risk: "NO", demand_trend: "Increasing" },
  { item_id: "P005", final_demand: 22.1, current_stock: 70, safety_stock: 15.3, reorder_point: 55.9, reorder_quantity: 35, stockout_risk: "NO", overstock_risk: "YES", demand_trend: "Decreasing" },
  { item_id: "P006", final_demand: 10.0, current_stock: 32, safety_stock: 7.5, reorder_point: 30.0, reorder_quantity: 18, stockout_risk: "NO", overstock_risk: "NO", demand_trend: "Stable" },
  { item_id: "P007", final_demand: 18.4, current_stock: 12, safety_stock: 13.2, reorder_point: 48.7, reorder_quantity: 30, stockout_risk: "YES", overstock_risk: "NO", demand_trend: "Increasing" },
  { item_id: "P008", final_demand: 6.8, current_stock: 45, safety_stock: 5.0, reorder_point: 19.4, reorder_quantity: 10, stockout_risk: "NO", overstock_risk: "YES", demand_trend: "Stable" },
];

export const demandHistory: Record<string, { month: string; demand: number }[]> = {
  P001: [{ month: "Jan", demand: 8 }, { month: "Feb", demand: 9 }, { month: "Mar", demand: 10 }, { month: "Apr", demand: 10.5 }, { month: "May", demand: 11 }, { month: "Jun", demand: 12.5 }],
  P002: [{ month: "Jan", demand: 12 }, { month: "Feb", demand: 11 }, { month: "Mar", demand: 10 }, { month: "Apr", demand: 9.5 }, { month: "May", demand: 9 }, { month: "Jun", demand: 8.3 }],
  P003: [{ month: "Jan", demand: 15 }, { month: "Feb", demand: 15.2 }, { month: "Mar", demand: 15.5 }, { month: "Apr", demand: 15.3 }, { month: "May", demand: 15.6 }, { month: "Jun", demand: 15.7 }],
  P004: [{ month: "Jan", demand: 3 }, { month: "Feb", demand: 3.5 }, { month: "Mar", demand: 4 }, { month: "Apr", demand: 4.2 }, { month: "May", demand: 4.8 }, { month: "Jun", demand: 5.2 }],
  P005: [{ month: "Jan", demand: 28 }, { month: "Feb", demand: 26 }, { month: "Mar", demand: 25 }, { month: "Apr", demand: 24 }, { month: "May", demand: 23 }, { month: "Jun", demand: 22.1 }],
  P006: [{ month: "Jan", demand: 10 }, { month: "Feb", demand: 10.1 }, { month: "Mar", demand: 9.9 }, { month: "Apr", demand: 10 }, { month: "May", demand: 10.2 }, { month: "Jun", demand: 10.0 }],
  P007: [{ month: "Jan", demand: 12 }, { month: "Feb", demand: 13 }, { month: "Mar", demand: 14.5 }, { month: "Apr", demand: 15.8 }, { month: "May", demand: 17 }, { month: "Jun", demand: 18.4 }],
  P008: [{ month: "Jan", demand: 7.2 }, { month: "Feb", demand: 7 }, { month: "Mar", demand: 6.9 }, { month: "Apr", demand: 6.8 }, { month: "May", demand: 6.9 }, { month: "Jun", demand: 6.8 }],
};

export function getInsightText(product: Product): string {
  if (product.stockout_risk === "YES") {
    return `Demand is ${product.demand_trend.toLowerCase()} and current stock (${product.current_stock}) is below the reorder point (${Math.round(product.reorder_point)}), suggesting immediate replenishment of ${product.reorder_quantity} units.`;
  }
  if (product.overstock_risk === "YES") {
    return `Current stock (${product.current_stock}) significantly exceeds the reorder point (${Math.round(product.reorder_point)}). Demand is ${product.demand_trend.toLowerCase()}. Consider reducing order quantities to avoid excess holding costs.`;
  }
  return `Inventory levels are healthy. Current stock (${product.current_stock}) is near optimal levels relative to the reorder point (${Math.round(product.reorder_point)}). Demand trend is ${product.demand_trend.toLowerCase()}.`;
}
