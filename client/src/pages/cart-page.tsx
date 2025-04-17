import { Link, useLocation } from "wouter";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useContext } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { User } from "@shared/schema";

interface CartItem {
  id: number;
  quantity: number;
  userId: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    image?: string;
    image_url?: string;
    imageUrl?: string;
    category: string;
    sellerId: number;
    approved: boolean;
    createdAt: string;
    images?: string;
  };
}

export default function CartPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Try to use context first if available
  const authContext = useContext(AuthContext);
  
  // Get user data from direct API if context is not available
  const { data: apiUser, isLoading: apiLoading } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const res = await fetch('/api/user', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error('Failed to fetch user');
      }
      
      return res.json();
    },
    staleTime: 60000, // 1 minute
  });
  
  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;
  const isAuthLoading = authContext ? authContext.isLoading : apiLoading;

  // Fetch cart data using React Query for real-time updates
  const { data: cartItems = [], isLoading: cartLoading } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    // Removed frequent polling to avoid performance issues
  });
  
  // Combine loading states
  const isLoading = cartLoading || isAuthLoading;

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      if (quantity < 1) return null;
      const res = await apiRequest('PUT', `/api/cart/${id}`, { quantity });
      return res.json();
    },
    onSuccess: () => {
      // Immediately refetch cart data
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/cart/${id}`);
      return res;
    },
    onSuccess: () => {
      // Immediately refetch cart data
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  // Update quantity handler
  const handleUpdateQuantity = (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ id: cartItemId, quantity: newQuantity });
  };

  // Remove item handler
  const handleRemoveItem = (cartItemId: number) => {
    removeItemMutation.mutate(cartItemId);
  };

  const proceedToCheckout = () => {
    // Use wouter for navigation
    setLocation('/checkout', { replace: false });
  };

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => 
    total + (item.product.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 40 : 0; // Free shipping over a certain amount
  const total = subtotal + shipping;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
          <Button 
            onClick={() => setLocation('/', { replace: false })} 
            className="bg-primary text-white"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Cart Items */}
        <div className="w-full md:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flow-root">
              <ul className="-my-6 divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <li key={item.id} className="py-6 flex">
                    <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                      <img
                        src={
                          // Get the image URL, checking all possible sources
                          (item.product.image_url || item.product.image || item.product.imageUrl) && 
                          ((item.product.image_url || item.product.image || item.product.imageUrl)?.includes('flixcart.com') || 
                           (item.product.image_url || item.product.image || item.product.imageUrl)?.includes('lelekart.com'))
                            ? `/api/image-proxy?url=${encodeURIComponent(item.product.image_url || item.product.image || item.product.imageUrl || '')}&category=${encodeURIComponent(item.product.category || '')}`
                            : (item.product.image_url || item.product.image || item.product.imageUrl)
                        }
                        alt={item.product.name}
                        className="w-full h-full object-center object-cover"
                        onError={(e) => {
                          // Use a fallback image on error
                          const target = e.target as HTMLImageElement;
                          target.onerror = null; // Prevent infinite loop
                          
                          console.log('Image load error for product:', item.product.name, 'URLs:', {
                            image_url: item.product.image_url,
                            image: item.product.image,
                            imageUrl: item.product.imageUrl
                          });
                          
                          // Use category-specific placeholder or default placeholder
                          if (item.product.category) {
                            // Convert to lowercase and use direct category images from client/public/images
                            const categoryLower = item.product.category.toLowerCase();
                            target.src = `/images/${categoryLower}.svg`;
                          } else {
                            target.src = "/images/placeholder.svg";
                          }
                        }}
                      />
                    </div>

                    <div className="ml-4 flex-1 flex flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>
                            <Link href={`/product/${item.product.id}`} className="hover:text-primary">
                              {item.product.name}
                            </Link>
                          </h3>
                          <p className="ml-4">₹{item.product.price}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{item.product.category}</p>
                      </div>
                      <div className="flex-1 flex items-end justify-between text-sm">
                        <div className="flex items-center border rounded-md">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-1 text-gray-600 hover:text-primary"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="px-3 py-1">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-1 text-gray-600 hover:text-primary"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="flex">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="font-medium text-red-600 hover:text-red-500 flex items-center"
                          >
                            <Trash2 size={16} className="mr-1" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full md:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-lg font-semibold mb-6">Order Summary</h2>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">₹{shipping.toFixed(2)}</span>
            </div>
            <hr className="my-4" />
            <div className="flex justify-between mb-6">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-lg font-semibold">₹{total.toFixed(2)}</span>
            </div>
            <Button 
              onClick={proceedToCheckout}
              className="w-full bg-primary text-white flex items-center justify-center"
            >
              Checkout <ArrowRight size={16} className="ml-2" />
            </Button>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Taxes and shipping calculated at checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}