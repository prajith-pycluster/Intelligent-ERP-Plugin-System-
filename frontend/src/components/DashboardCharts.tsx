import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { products } from "@/data/mockData";

const DashboardCharts = () => {
  const barData = products.map((p) => ({
    name: p.item_id,
    "Current Stock": p.current_stock,
    "Reorder Point": p.reorder_point,
  }));

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-5">
      <h2 className="font-semibold text-card-foreground mb-4">Current Stock vs Reorder Point</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={barData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 25% 90%)" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: "0.5rem",
              border: "1px solid hsl(214 25% 90%)",
              fontSize: 13,
            }}
          />
          <Legend />
          <Bar dataKey="Current Stock" fill="hsl(217 91% 52%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Reorder Point" fill="hsl(32 95% 55%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardCharts;
