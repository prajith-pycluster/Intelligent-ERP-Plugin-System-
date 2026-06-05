import React, { useState } from "react";
import { PackagePlus, Save, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const BASE_URL = "/api";

export default function AddProduct() {
  const [formData, setFormData] = useState({
    item_id: "",
    item_name: "",
    category: "Gadgets",
    unit_price: "",
    current_stock: "",
    lead_time_days: "5",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_id.trim()) {
      toast.error("Item ID is required");
      return;
    }
    
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        unit_price: parseFloat(formData.unit_price) || 0,
        current_stock: parseInt(formData.current_stock, 10) || 0,
        lead_time_days: parseInt(formData.lead_time_days, 10) || 0,
      };

      const res = await fetch(`${BASE_URL}/add-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to add product");
      }

      toast.success(`Product ${formData.item_id.toUpperCase()} added successfully!`);
      // Reset form on success
      setFormData({
        item_id: "",
        item_name: "",
        category: "Gadgets",
        unit_price: "",
        current_stock: "",
        lead_time_days: "5",
      });
    } catch (error: any) {
      console.error("API Error:", error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <PackagePlus className="h-6 w-6 text-primary" />
          Add Product
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manually enter a new inventory item. It will be immediately available in the dashboard.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Item ID</label>
                <div className="relative">
                  <Input
                    name="item_id"
                    placeholder="e.g. P013"
                    value={formData.item_id}
                    onChange={handleChange}
                    className="pl-9 font-mono"
                    required
                  />
                  <PackagePlus className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Info className="h-3 w-3" /> Unique identifier for the product
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Product Name</label>
                <Input
                  name="item_name"
                  placeholder="e.g. Wireless Mouse"
                  value={formData.item_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Category</label>
                <Input
                  name="category"
                  placeholder="e.g. Electronics"
                  value={formData.category}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Unit Price (₹)</label>
                <Input
                  name="unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="100.00"
                  value={formData.unit_price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Current Stock</label>
                <Input
                  name="current_stock"
                  type="number"
                  min="0"
                  placeholder="50"
                  value={formData.current_stock}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Lead Time (Days)</label>
                <Input
                  name="lead_time_days"
                  type="number"
                  min="0"
                  placeholder="5"
                  value={formData.lead_time_days}
                  onChange={handleChange}
                  required
                />
              </div>

            </div>

            <div className="pt-4 border-t border-border mt-6 flex justify-end">
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto min-w-[140px]">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Saving..." : "Add Product"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
