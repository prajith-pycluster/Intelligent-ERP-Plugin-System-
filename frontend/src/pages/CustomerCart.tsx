import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Trash2, Tag, ClipboardCheck, ArrowLeft, ArrowRight, ShoppingBag, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function CustomerCart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");

  // Confirmation view state
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  const [cartRecs, setCartRecs] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (cartItems.length === 0) {
      setCartRecs({});
      return;
    }

    const fetchAllRecommendations = async () => {
      const fetched: Record<string, any[]> = {};
      await Promise.all(
        cartItems.map(async (item) => {
          const pId = item.product_id;
          try {
            const res = await fetch(`/api/customer/recommendations/${pId}?strict=true`);
            if (res.ok) {
              const data = await res.json();
              fetched[pId] = data;
            }
          } catch (err) {
            console.error(err);
          }
        })
      );
      setCartRecs(fetched);
    };

    fetchAllRecommendations();
  }, [cartItems.map(item => item.product_id).join(",")]);

  useEffect(() => {
    setCustomerName(sessionStorage.getItem("customer_name") || "");
    const loadCart = () => {
      const saved = sessionStorage.getItem("cart");
      if (saved) {
        try {
          setCartItems(JSON.parse(saved));
        } catch (e) {
          setCartItems([]);
        }
      }
    };
    loadCart();

    window.addEventListener("cartUpdate", loadCart);
    return () => {
      window.removeEventListener("cartUpdate", loadCart);
    };
  }, []);

  const saveCart = (items: any[]) => {
    setCartItems(items);
    sessionStorage.setItem("cart", JSON.stringify(items));
    window.dispatchEvent(new Event("cartUpdate"));
  };

  const handleAddRecommended = (product: any) => {
    const stock = Number(product.current_stock || 0);
    if (stock <= 0) {
      toast.error("Item is currently out of stock!");
      return;
    }

    const savedCart = sessionStorage.getItem("cart");
    let cart = [];
    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
      } catch (err) {
        cart = [];
      }
    }

    const existingIndex = cart.findIndex((item: any) => item.product_id === product.item_id);
    if (existingIndex > -1) {
      if (cart[existingIndex].quantity >= stock) {
        toast.error(`Cannot add more. Only ${stock} units available in stock.`);
        return;
      }
      cart[existingIndex].quantity += 1;
      cart[existingIndex].subtotal = cart[existingIndex].quantity * cart[existingIndex].price;
    } else {
      cart.push({
        product_id: product.item_id,
        name: product.item_name || product.item_id,
        category: product.category,
        price: Number(product.unit_price || 0),
        quantity: 1,
        subtotal: Number(product.unit_price || 0),
        maxStock: stock
      });
    }

    saveCart(cart);
    toast.success(`${product.item_name || product.item_id} added to cart!`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    const updated = cartItems.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.maxStock) {
          toast.error(`Only ${item.maxStock} units of this item are currently available in stock.`);
          return item;
        }
        return {
          ...item,
          quantity: newQty,
          subtotal: newQty * item.price
        };
      }
      return item;
    }).filter(Boolean);
    saveCart(updated);
  };

  const removeItem = (productId: string) => {
    const updated = cartItems.filter(item => item.product_id !== productId);
    saveCart(updated);
    toast.success("Item removed from cart");
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    if (!customerName) {
      toast.error("User session missing. Please log in again.");
      return;
    }
    setLoading(true);

    const payload = {
      customer_name: customerName,
      total_amount: totalAmount,
      items: cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      }))
    };

    try {
      const res = await fetch("/api/customer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Checkout failed");
      }
      
      // Order placed successfully
      sessionStorage.removeItem("cart");
      setCartItems([]);
      setPlacedOrder(data);
      toast.success("Order Placed Successfully!");
      window.dispatchEvent(new Event("cartUpdate"));
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during checkout");
    } finally {
      setLoading(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="max-w-xl mx-auto bg-card border border-border rounded-xl p-8 shadow-lg text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200">
          <ClipboardCheck className="w-8 h-8" />
        </div>
        
        <div>
          <h2 className="text-2xl font-black text-foreground">Order Placed Successfully!</h2>
          <p className="text-muted-foreground text-xs font-mono mt-1">Order ID: {placedOrder.order_id}</p>
        </div>

        {/* Order Details box */}
        <div className="border border-border rounded-xl divide-y divide-border text-left bg-muted/20 overflow-hidden text-xs">
          <div className="p-4 bg-muted/40 font-semibold flex justify-between">
            <span>Summary</span>
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 font-bold py-0.5 leading-none">
              {placedOrder.status}
            </Badge>
          </div>
          
          <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
            {placedOrder.items.map((it: any) => {
              const localMatch = cartItems.find(c => c.product_id === it.product_id) || {};
              return (
                <div key={it.product_id} className="flex justify-between items-center text-muted-foreground">
                  <span>
                    {localMatch.name || it.product_id} <span className="font-semibold text-foreground font-mono">x {it.quantity}</span>
                  </span>
                  <span className="font-bold text-foreground">₹{Number(it.subtotal).toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-muted/40 flex justify-between items-center font-bold text-sm">
            <span>Total Amount</span>
            <span className="text-purple-600">₹{Number(placedOrder.total_amount).toFixed(2)}</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => navigate("/orders")}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            View My Orders
          </Button>
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white rounded-xl"
            onClick={() => navigate("/browse")}
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-[32px] font-bold text-foreground leading-[40px]">Shopping Cart</h1>
        <p className="text-muted-foreground text-sm">Review your selected items and checkout</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed rounded-xl bg-card">
          <ShoppingCart className="w-12 h-12 mx-auto opacity-20 mb-3" />
          <p className="font-semibold text-lg">Your Cart is Empty</p>
          <p className="text-sm opacity-70 mt-1 mb-6">Explore the products catalog to add items here.</p>
          <Button
            className="bg-black hover:bg-slate-800 text-white rounded-xl"
            onClick={() => navigate("/browse")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-300">
          
          {/* Items List */}
          <div className="lg:col-span-2 space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.product_id}
                className="bg-card border border-border rounded-xl p-4 flex flex-col items-stretch shadow-sm gap-2"
              >
                {/* Main Item Row */}
                <div className="flex justify-between items-center w-full gap-4">
                  <div className="flex gap-4 items-center min-w-0">
                    <div className="w-12 h-12 bg-muted rounded-lg border flex items-center justify-center text-muted-foreground/30 shrink-0">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {item.category}
                      </span>
                      <h4 className="font-bold text-foreground truncate text-sm mt-0.5">{item.name}</h4>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">₹{Number(item.price).toFixed(2)} / unit</p>
                    </div>
                  </div>

                  {/* Actions & Quantity Controls */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="flex items-center border border-border rounded-lg bg-background p-1 gap-1">
                      <button
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-foreground tabular-nums select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right w-20">
                      <p className="font-black text-sm text-foreground">₹{Number(item.subtotal).toFixed(2)}</p>
                    </div>

                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="p-2 text-muted-foreground/60 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Associated Recommendations */}
                {cartRecs[item.product_id] && cartRecs[item.product_id].length > 0 && (
                  <div className="mt-3 pt-3 border-t border-dashed border-border w-full space-y-2">
                    <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Frequently Bought Together
                    </p>
                    <div className="space-y-1.5">
                      {cartRecs[item.product_id].map((rec: any) => (
                        <div key={rec.item_id} className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/40 hover:bg-muted/60 transition-colors">
                          <div className="min-w-0 pr-2">
                            <span>
                              {item.name} <span className="font-medium text-foreground">+ {rec.item_name || rec.item_id}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-bold text-foreground">₹{Number(rec.unit_price || 0).toFixed(2)}</span>
                            <Button
                              size="sm"
                              onClick={() => handleAddRecommended(rec)}
                              disabled={Number(rec.current_stock || 0) <= 0}
                              className="bg-black dark:bg-white dark:text-black hover:bg-slate-800 text-white rounded-lg px-3 py-1 h-7 text-[10px] font-bold"
                            >
                              Add Pair
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-foreground text-sm border-b pb-3">Order Summary</h3>
            
            <div className="space-y-2.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Items Count</span>
                <span className="font-semibold text-foreground">{cartItems.reduce((acc, i) => acc + i.quantity, 0)} units</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">₹{Number(totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="font-semibold text-foreground text-green-600">FREE</span>
              </div>
            </div>

            <div className="border-t pt-3 flex justify-between items-center font-bold text-foreground">
              <span className="text-sm">Total Amount</span>
              <span className="text-lg text-purple-600">₹{Number(totalAmount).toFixed(2)}</span>
            </div>

            <Button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl py-6 font-semibold flex items-center justify-center mt-2"
            >
              {loading ? "Placing Order..." : "Place Order"}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>

        </div>
      )}

    </div>
  );
}
