import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const BASE_URL = "/api";

// --- QUERIES ---

export const useDashboard = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/dashboard`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });
};

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/products`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });
};

export const useProduct = (itemId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["product", itemId],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/product/${itemId}`);
      if (!res.ok) throw new Error(res.status === 404 ? `Product ${itemId} not found` : "Failed to fetch product");
      return res.json();
    },
    enabled: enabled && !!itemId,
    retry: false
  });
};

export const useRecycleBin = () => {
  return useQuery({
    queryKey: ["recycle-bin"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/recycle-bin`);
      if (!res.ok) throw new Error("Failed to fetch recycle bin");
      return res.json();
    },
  });
};

// --- MUTATIONS ---

export const useAddProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${BASE_URL}/add-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to add product");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Product ${data.item_id} added successfully!`);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", data.item_id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "An unexpected error occurred");
    }
  });
};

export const useEditProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${BASE_URL}/edit-product`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to update product");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Product ${data.item_id} updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", data.item_id] });
      queryClient.invalidateQueries({ queryKey: ["recycle-bin"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "An unexpected error occurred");
    }
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`${BASE_URL}/delete-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId }),
      });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Product moved to recycle bin");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["recycle-bin"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

export const useRestoreProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`${BASE_URL}/restore-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId }),
      });
      if (!res.ok) throw new Error("Failed to restore product");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Product ${data.item_id} restored successfully`);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["recycle-bin"] });
      queryClient.invalidateQueries({ queryKey: ["product", data.item_id] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

export const usePermanentDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`${BASE_URL}/permanent-delete-product`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId }),
      });
      if (!res.ok) throw new Error("Failed to permanently delete product");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Product ${data.item_id} permanently deleted`);
      queryClient.invalidateQueries({ queryKey: ["recycle-bin"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

export const useDraftBill = (billId: string | null) => {
  return useQuery({
    queryKey: ["draft-bill", billId],
    queryFn: async () => {
      if (!billId) return null;
      const res = await fetch(`${BASE_URL}/billing/${billId}`);
      if (!res.ok) throw new Error("Failed to fetch draft bill");
      return res.json();
    },
    enabled: !!billId,
  });
};

export const useBillingHistory = (customerName?: string) => {
  return useQuery({
    queryKey: ["billing-history", customerName],
    queryFn: async () => {
      const url = customerName ? `${BASE_URL}/billing/history?customer_name=${encodeURIComponent(customerName)}` : `${BASE_URL}/billing/history`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch billing history");
      return res.json();
    },
  });
};

export const useBillingProductHistory = (itemId: string | null) => {
  return useQuery({
    queryKey: ["billing-product-history", itemId],
    queryFn: async () => {
      if (!itemId) return [];
      const res = await fetch(`${BASE_URL}/billing/product-history/${encodeURIComponent(itemId)}`);
      if (!res.ok) throw new Error("Failed to fetch product history");
      return res.json();
    },
    enabled: !!itemId,
  });
};

export const useAllBillingHistory = () => {
  return useQuery({
    queryKey: ["all-billing-history"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/billing/all-history`);
      if (!res.ok) throw new Error("Failed to fetch all billing history");
      return res.json();
    },
  });
};

export const useBillDetails = (billId: string | null) => {
  return useQuery({
    queryKey: ["bill-details", billId],
    queryFn: async () => {
      if (!billId) return null;
      const res = await fetch(`${BASE_URL}/billing/${encodeURIComponent(billId)}`);
      if (!res.ok) throw new Error("Failed to fetch bill details");
      return res.json();
    },
    enabled: !!billId,
  });
};

export const useCreateBill = () => {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE_URL}/billing/create`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to create bill");
      return res.json();
    },
    onError: (error: any) => toast.error(error.message),
  });
};

export const useAddBillItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { bill_id: string; item_id: string; quantity: number }) => {
      const res = await fetch(`${BASE_URL}/billing/add-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to add item");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["draft-bill", variables.bill_id] });
      toast.success("Item added");
    },
    onError: (error: any) => toast.error(error.message),
  });
};

export const useRemoveBillItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; bill_id: string }) => {
      const res = await fetch(`${BASE_URL}/billing/remove-item`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: payload.id }),
      });
      if (!res.ok) throw new Error("Failed to remove item");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["draft-bill", variables.bill_id] });
    },
    onError: (error: any) => toast.error(error.message),
  });
};

export const useCheckoutBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { bill_id: string; customer_name: string }) => {
      const res = await fetch(`${BASE_URL}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to checkout bill");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Bill generated successfully!");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["billing-history"] });
      queryClient.invalidateQueries({ queryKey: ["all-billing-history"] });
      queryClient.invalidateQueries({ queryKey: ["billing-product-history"] });
    },
    onError: (error: any) => toast.error(error.message || "An unexpected error occurred"),
  });
};

export const useMarketBasket = (itemId: string) => {
  return useQuery({
    queryKey: ["market-basket", itemId],
    queryFn: async () => {
      if (!itemId) return [];
      const res = await fetch(`${BASE_URL}/market-basket/${encodeURIComponent(itemId)}`);
      if (!res.ok) throw new Error("Failed to fetch market basket recommendations");
      return res.json();
    },
    enabled: !!itemId,
    retry: false
  });
};

export const useTopMarketBasketGroups = () => {
  return useQuery({
    queryKey: ["market-basket-top-groups"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/market-basket/top-groups`);
      if (!res.ok) throw new Error("Failed to fetch top market basket groups");
      return res.json();
    },
  });
};

export const useBatchRestock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { items: { item_id: string; quantity_added: number; product_name: string }[] }) => {
      const res = await fetch(`${BASE_URL}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to batch restock");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Batch restock completed successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      // Refresh Restock History tab automatically
      queryClient.invalidateQueries({ queryKey: ["restock-history"] });
      // Refresh predictive inventory so reverted items stay correct
      queryClient.invalidateQueries({ queryKey: ["predictive-inventory"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "An unexpected error occurred during restock");
    }
  });
};

export const useRestockHistory = () => {
  return useQuery({
    queryKey: ["restock-history"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/restock-history`);
      if (!res.ok) throw new Error("Failed to fetch restock history");
      return res.json();
    },
  });
};

export const useSendWhatsAppAlert = () => {
  return useMutation({
    mutationFn: async (payload: { message: string }) => {
      const res = await fetch(`${BASE_URL}/alert/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to send WhatsApp alert");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("WhatsApp alert sent successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "An unexpected error occurred while sending alert");
    }
  });
};

export const usePredictiveInventory = () => {
  return useQuery({
    queryKey: ["predictive-inventory"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/predictive-inventory`);
      if (!res.ok) throw new Error("Failed to fetch predictive inventory");
      return res.json();
    },
  });
};

export const useRunPredictiveEngine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE_URL}/predictive/run`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to run predictive engine");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Predictive Engine run successfully!");
      queryClient.invalidateQueries({ queryKey: ["predictive-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => toast.error(error.message),
  });
};

export const usePredictiveReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { item_id: string; action: string }) => {
      const res = await fetch(`${BASE_URL}/predictive/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to review product");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Review action applied successfully.");
      queryClient.invalidateQueries({ queryKey: ["predictive-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => toast.error(error.message),
  });
};

export const usePredictiveRevert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { item_id: string; item_name?: string; category?: string; unit_price?: number }) => {
      const res = await fetch(`${BASE_URL}/predictive/revert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to revert product");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Product moved to Review Window (Manual).");
      queryClient.invalidateQueries({ queryKey: ["predictive-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => toast.error(error.message),
  });
};

export const usePredictiveApprove = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { item_id: string; item_name: string; category: string; unit_price?: number; suggested_qty: number; predictive_score: number; predictive_reason: string }) => {
      const res = await fetch(`${BASE_URL}/predictive/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to approve predictive stock");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Predictive stock approved and initialized in ERP.");
      queryClient.invalidateQueries({ queryKey: ["predictive-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => toast.error(error.message),
  });
};
