import { useState, useEffect, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Loader2, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { useWishlist } from "@/context/wishlist-context";
import { CartContext } from "@/context/cart-context";

// Define the product type for wishlist items
interface WishlistProduct {
  id: number;
  product: {
    id: number;
    name: string;
    description?: string;
    price: number;
    salePrice?: number;
    imageUrl: string;
    images?: string; // JSON string of images
    category?: string;
    stock?: number;
  };
  userId: number;
  dateAdded: string;
}

export default function BuyerWishlistPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Track loading states for individual products
  const [loadingProducts, setLoadingProducts] = useState<Set<number>>(
    new Set()
  );
  // Track removing state for individual wishlist items
  const [removingProducts, setRemovingProducts] = useState<Set<number>>(
    new Set()
  );

  // Track reminder creation state per product
  const [creatingReminderIds, setCreatingReminderIds] = useState<Set<number>>(
    new Set()
  );
  const [reminderSetIds, setReminderSetIds] = useState<Set<number>>(new Set());

  // Subscribe to global wishlist state for immediate updates
  const { wishlistItems, isLoading, removeFromWishlist } = useWishlist();

  // Get cart context to check if products are in cart
  const cartContext = useContext(CartContext);
  const cartItems = cartContext?.cartItems || [];

  // Helper function to check if a product is in the cart
  const isProductInCart = (productId: number): boolean => {
    return cartItems.some((item) => item.product.id === productId);
  };

  // Fetch current user for permission/email checks
  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/user"],
    retry: false,
    staleTime: 60000,
  });

  // Helper functions for localStorage persistence (similar to product details page)
  const getReminderStorage = (): Record<string, boolean> => {
    try {
      const raw = localStorage.getItem("lk_stock_reminders");
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  };

  const saveReminderStorage = (store: Record<string, boolean>) => {
    try {
      localStorage.setItem("lk_stock_reminders", JSON.stringify(store));
    } catch {
      // ignore storage errors
    }
  };

  const makeReminderKey = (productId: number): string => {
    return `${productId}:0`; // Using 0 for variant ID since wishlist doesn't handle variants
  };

  // Fetch existing stock reminders when user changes or page loads
  useEffect(() => {
    const fetchExistingReminders = async () => {
      if (!user) {
        setReminderSetIds(new Set());
        return;
      }

      try {
        // First check localStorage for immediate state restoration
        const store = getReminderStorage();
        const localReminderIds = new Set<number>();

        // Check if any wishlist items have local reminders
        wishlistItems.forEach((item) => {
          const key = makeReminderKey(item.product.id);
          if (store[key]) {
            localReminderIds.add(item.product.id);
          }
        });

        // Set local reminders immediately for better UX
        if (localReminderIds.size > 0) {
          setReminderSetIds(localReminderIds);
        }

        // Then fetch from API to sync with server state
        const response = await fetch("/api/stock-reminders");
        if (response.ok) {
          const reminders = await response.json();
          // Extract product IDs from reminders and set them in reminderSetIds
          const productIds = reminders.map(
            (reminder: any) => reminder.productId
          );

          // Merge API reminders with local reminders
          const allReminderIds = new Set([
            ...Array.from(localReminderIds),
            ...productIds,
          ]);
          setReminderSetIds(allReminderIds);

          // Update localStorage with any new reminders from API
          const updatedStore = { ...store };
          productIds.forEach((productId: number) => {
            const key = makeReminderKey(productId);
            updatedStore[key] = true;
          });
          saveReminderStorage(updatedStore);
        }
      } catch (error) {
        console.error("Error fetching existing reminders:", error);
        // If API fails, still show local reminders
        const store = getReminderStorage();
        const localReminderIds = new Set<number>();
        wishlistItems.forEach((item) => {
          const key = makeReminderKey(item.product.id);
          if (store[key]) {
            localReminderIds.add(item.product.id);
          }
        });
        setReminderSetIds(localReminderIds);
      }
    };

    fetchExistingReminders();
  }, [user, wishlistItems]);

  // Clean up localStorage reminders for products that are no longer in wishlist
  useEffect(() => {
    if (!wishlistItems.length) return;

    const store = getReminderStorage();
    const wishlistProductIds = new Set(
      wishlistItems.map((item) => item.product.id)
    );
    let hasChanges = false;

    // Remove reminders for products that are no longer in wishlist
    Object.keys(store).forEach((key) => {
      const productId = parseInt(key.split(":")[0]);
      if (!wishlistProductIds.has(productId)) {
        delete store[key];
        hasChanges = true;
      }
    });

    // Save updated store if changes were made
    if (hasChanges) {
      saveReminderStorage(store);
      // Update local state to reflect changes
      const remainingReminderIds = new Set<number>();
      Object.keys(store).forEach((key) => {
        const productId = parseInt(key.split(":")[0]);
        if (wishlistProductIds.has(productId)) {
          remainingReminderIds.add(productId);
        }
      });
      setReminderSetIds(remainingReminderIds);
    }
  }, [wishlistItems]);

  // (Removed local mutation; using shared context instead)

  // Handle add to cart with individual loading states
  const handleAddToCart = async (product: WishlistProduct["product"]) => {
    // Set loading state for this specific product
    setLoadingProducts((prev) => new Set(prev).add(product.id));

    try {
      // Use cart context if available for better state management
      if (cartContext) {
        cartContext.addToCart(product as any, 1);
      } else {
        // Fallback to direct API call
        const res = await apiRequest("POST", "/api/cart", {
          productId: product.id,
          quantity: 1,
        });

        if (!res.ok) {
          throw new Error("Failed to add item to cart");
        }

        // Refresh cart data if needed
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      }

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Clear loading state for this specific product
      setLoadingProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  };

  // Remove item from wishlist using shared context, with local UI spinner
  const handleRemoveFromWishlist = async (productId: number) => {
    setRemovingProducts((prev) => new Set(prev).add(productId));
    try {
      await removeFromWishlist(productId);
      // Clean up localStorage reminder for this product
      const key = makeReminderKey(productId);
      const store = getReminderStorage();
      if (store[key]) {
        delete store[key];
        saveReminderStorage(store);
        // Also remove from local state
        setReminderSetIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    } finally {
      setRemovingProducts((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  // Handle setting stock reminder for an out-of-stock product
  const handleSetReminder = async (product: WishlistProduct["product"]) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "Log in to set a stock reminder",
      });
      setLocation("/auth");
      return;
    }

    if (user.role === "admin" || user.role === "seller") {
      toast({
        title: "Action Not Allowed",
        description:
          "You can't perform this operation. You are a seller/admin.",
        variant: "destructive",
      });
      return;
    }

    if (!user.email) {
      toast({
        title: "Email required",
        description: "Please update your profile with an email address",
        variant: "destructive",
      });
      return;
    }

    setCreatingReminderIds((prev) => new Set(prev).add(product.id));
    try {
      const res = await fetch("/api/stock-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: null,
          email: user.email,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReminderSetIds((prev) => new Set(prev).add(product.id));
        // Save to localStorage for persistence
        const key = makeReminderKey(product.id);
        const store = getReminderStorage();
        store[key] = true;
        saveReminderStorage(store);
        toast({
          title: "Reminder set",
          description: "We'll notify you when it's back in stock.",
        });
      } else if (res.status === 409) {
        setReminderSetIds((prev) => new Set(prev).add(product.id));
        // Save to localStorage for persistence
        const key = makeReminderKey(product.id);
        const store = getReminderStorage();
        store[key] = true;
        saveReminderStorage(store);
        toast({
          title: "Already set",
          description: "Reminder already exists.",
        });
      } else if (res.status === 401) {
        setLocation("/auth");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to set reminder",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to set reminder",
        variant: "destructive",
      });
    } finally {
      setCreatingReminderIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5E4]">
      <DashboardLayout>
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Wishlist</h1>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-[#F8F5E4]">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">
                Your wishlist is empty
              </h3>
              <p className="text-muted-foreground mb-6">
                Items added to your wishlist will be saved here
              </p>
              <Button asChild>
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map((item) => {
                const isProductLoading = loadingProducts.has(item.product.id);
                const isRemoving = removingProducts.has(item.product.id);
                return (
                  <Card
                    key={item.product.id}
                    className="border shadow-sm bg-[#F8F5E4]"
                  >
                    <div className="relative h-48 bg-slate-100">
                      <Link href={`/product/${item.product.id}`}>
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="h-full w-full object-contain object-center"
                            onError={(e) => {
                              // Set a fallback image if the product image fails to load
                              (e.target as HTMLImageElement).src =
                                "https://via.placeholder.com/300x300?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-200">
                            <span className="text-sm text-slate-500">
                              No image available
                            </span>
                          </div>
                        )}
                      </Link>
                    </div>
                    <CardContent className="p-4">
                      <Link href={`/product/${item.product.id}`}>
                        <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                          {item.product.name}
                        </h3>
                      </Link>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="font-semibold">
                          ₹{item.product.salePrice || item.product.price}
                        </span>
                        {item.product.salePrice && (
                          <>
                            <span className="text-sm text-muted-foreground line-through">
                              ₹{item.product.price}
                            </span>
                            <span className="text-sm text-green-600">
                              {Math.round(
                                ((item.product.price - item.product.salePrice) /
                                  item.product.price) *
                                  100
                              )}
                              % off
                            </span>
                          </>
                        )}
                      </div>
                      <div className="mt-4 flex space-x-2">
                        {item.product.stock > 0 ? (
                          <Button
                            className="flex-1"
                            onClick={() => handleAddToCart(item.product)}
                            disabled={isProductLoading}
                          >
                            {isProductLoading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ShoppingCart className="mr-2 h-4 w-4" />
                            )}
                            {isProductInCart(item.product.id)
                              ? "Item in Cart"
                              : "Add to Cart"}
                          </Button>
                        ) : (
                          <Button
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleSetReminder(item.product)}
                            disabled={
                              creatingReminderIds.has(item.product.id) ||
                              reminderSetIds.has(item.product.id)
                            }
                          >
                            <Bell className="mr-2 h-4 w-4" />
                            {creatingReminderIds.has(item.product.id)
                              ? "Setting..."
                              : reminderSetIds.has(item.product.id)
                                ? "Reminder Set"
                                : "Remind Me"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleRemoveFromWishlist(item.product.id)
                          }
                          disabled={isRemoving}
                        >
                          {isRemoving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </div>
  );
}
