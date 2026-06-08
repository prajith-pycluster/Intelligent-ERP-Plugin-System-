import { 
  Layers, 
  Target, 
  ShieldCheck, 
  ShieldAlert, 
  PackageMinus, 
  TrendingUp, 
  Truck, 
  BarChart3,
  Sparkles
} from "lucide-react";

const queries = [
  {
    name: "Reorder Quantity",
    icon: Layers,
    definition: "How much stock should be ordered now.",
    practical: "If this value is high, you need to restock urgently.",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    name: "Reorder Point",
    icon: Target,
    definition: "The stock level at which you should reorder.",
    practical: "If your stock falls below this, you should place an order.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  {
    name: "Safety Stock",
    icon: ShieldCheck,
    definition: "Extra stock kept to handle uncertainty.",
    practical: "Protects against sudden increase in demand or delays.",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10"
  },
  {
    name: "Stockout Risk",
    icon: ShieldAlert,
    definition: "Indicates whether stock may run out soon.",
    practical: "YES → risk of shortage\nNO → safe stock level",
    color: "text-red-500",
    bg: "bg-red-500/10"
  },
  {
    name: "Overstock Risk",
    icon: PackageMinus,
    definition: "Indicates excess inventory.",
    practical: "YES → too much stock, may cause waste\nNO → normal level",
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    name: "Demand Trend",
    icon: TrendingUp,
    definition: "Shows whether demand is increasing or decreasing.",
    practical: "Increasing → product selling more\nDecreasing → product slowing down",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10"
  },
  {
    name: "ABC Classification",
    icon: BarChart3,
    definition: "Categorizes products into A, B, and C based on their value and importance.",
    practical: "A → High value items (top contributors, need strict monitoring)\nB → Medium value items (moderate importance, normal control)\nC → Low value items (least important, minimal attention needed)",
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  {
    name: "Inventory Turnover",
    icon: Layers,
    definition: "Measures how frequently inventory is sold.",
    practical: "High → fast-moving product\nLow → slow-moving product",
    color: "text-teal-500",
    bg: "bg-teal-500/10"
  },
  {
    name: "Exploratory Query",
    icon: Sparkles,
    definition: "Generates insights using AI based on your data and question.",
    practical: "Provides AI-generated insights based on user queries.\nDecisions are still grounded on calculated data, ensuring reliability and accuracy.",
    color: "text-rose-500",
    bg: "bg-rose-500/10"
  }
];

const QueryGuide = () => {
  return (
    <div className="space-y-6 pb-12 w-full max-w-6xl mx-auto">
      <div>
        <h1 className="text-[32px] font-bold text-foreground flex items-center gap-2 leading-[40px]">
          Understanding Queries
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          A definitive handbook for understanding inventory metrics and system parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {queries.map((q) => (
          <div key={q.name} className="flex flex-col bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className={`shrink-0 p-2.5 rounded-lg ${q.bg}`}>
                <q.icon className={`h-5 w-5 ${q.color}`} />
              </div>
              <h3 className="font-semibold text-lg text-card-foreground">{q.name}</h3>
            </div>
            
            <div className="space-y-4 flex-1">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-1">
                  Definition
                </span>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {q.definition}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-1">
                  Practical Meaning
                </span>
                <p className="text-sm font-medium text-foreground whitespace-pre-line leading-relaxed">
                  {q.practical}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueryGuide;
