import { Link, useLocation } from "wouter";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useContext } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { useCart } from "@/context/cart-context";

interface CartItem {
  id: number;
  quantity: number;
  userId?: number;  // Make userId optional since guest cart items won't have it
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
    deliveryCharges?: number;
    isDealOfTheDay?: boolean;
    mrp?: number;
  };
  variant?: {
    id: number;
    productId: number;
    sku: string;
    price: number;
    mrp?: number;
    stock: number;
    color: string;
    size: string;
    images?: string;
  };
}

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { data: user } = useQuery<User | null>({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 60000,
  });
  const isLoading = false;

  const proceedToCheckout = () => {
    // If user is not logged in, redirect to auth with return URL
    if (!user) {
      setLocation('/auth?returnUrl=/checkout', { replace: false });
      return;
    }
    // Otherwise proceed to checkout
    setLocation('/checkout', { replace: false });
  };

  // Calculate totals - use deal price if isDealOfTheDay, else variant price if available
  const subtotal = cartItems.reduce((total, item) => {
    let price;
    if (item.product.isDealOfTheDay) {
      price = item.product.price;
    } else {
      price = item.variant ? item.variant.price : item.product.price;
    }
    return total + (price * item.quantity);
  }, 0);
  // Calculate delivery charges for all items
  const deliveryCharges = cartItems.reduce((total, item) => {
    const charge = item.product.deliveryCharges ?? 0;
    return total + (charge * item.quantity);
  }, 0);
  const total = subtotal + deliveryCharges;

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
                {cartItems.map((item, idx) => (
                  <li key={item.id} className="py-6 flex">
                    <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                      <img
                        src={item.product.imageUrl || "/images/categories/fashion.svg"}
                        alt={item.product.name}
                        className="w-full h-full object-center object-cover"
                        onError={(e) => {
                          // Use a fallback image on error
                          const target = e.target as HTMLImageElement;
                          target.onerror = null; // Prevent infinite loop
                          
                          // Use category-specific placeholder or default placeholder
                          if (item.product.category) {
                            // Convert to lowercase and use direct category images from client/public/images
                            const categoryLower = item.product.category.toLowerCase();
                            target.src = `../images/${categoryLower}.svg`;
                          } else {
                            target.src = "../images/placeholder.svg";
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
                          <div className="ml-4 flex items-center gap-2">
                            {item.product.isDealOfTheDay ? (
                              <>
                                <span>₹{item.product.price}</span>
                                {item.product.mrp && (
                                  <span className="text-gray-400 text-xs line-through ml-1">₹{item.product.mrp}</span>
                                )}
                              </>
                            ) : (
                              <span>₹{item.variant ? item.variant.price : item.product.price}</span>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{item.product.category}</p>
                        
                        {/* Display variant details if available */}
                        {item.variant && (
                          <div className="mt-1 flex gap-1">
                            {item.variant.color && (
                              <span className="inline-block px-2 py-0.5 bg-gray-100 rounded-sm text-xs">
                                Color: {item.variant.color}
                              </span>
                            )}
                            {item.variant.size && (
                              <span className="inline-block px-2 py-0.5 bg-gray-100 rounded-sm text-xs">
                                Size: {item.variant.size}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex items-end justify-between text-sm">
                        <div className="flex items-center border rounded-md">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6 rounded-l" 
                            onClick={() => updateQuantity(user && item.id !== undefined ? item.id : idx, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                            title="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 h-6 bg-white flex items-center justify-center text-sm border-t border-b">
                            {item.quantity}
                          </span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6 rounded-r" 
                            onClick={() => {
                              const availableStock = item.variant?.stock || item.product.stock || 999;
                              updateQuantity(user && item.id !== undefined ? item.id : idx, Math.min(availableStock, item.quantity + 1));
                            }}
                            disabled={item.variant?.stock ? item.quantity >= item.variant.stock : 
                                     item.product.stock ? item.quantity >= item.product.stock : false}
                            title="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="ml-2"
                            onClick={() => removeFromCart(user && item.id !== undefined ? item.id : idx)}
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="flow-root">
              <dl className="-my-4 text-sm divide-y divide-gray-200">
                <div className="py-4 flex items-center justify-between">
                  <dt className="text-gray-600">Subtotal</dt>
                  <dd className="font-medium text-gray-900">₹{subtotal.toLocaleString('en-IN')}</dd>
                </div>
                <div className="py-4 flex items-center justify-between">
                  <dt className="text-gray-600">Delivery Charges</dt>
                  <dd className="font-medium text-gray-900">₹{deliveryCharges.toLocaleString('en-IN')}</dd>
                </div>
                <div className="py-4 flex items-center justify-between">
                  <dt className="text-base font-medium text-gray-900">Order Total</dt>
                  <dd className="text-base font-medium text-gray-900">₹{total.toLocaleString('en-IN')}</dd>
                </div>
              </dl>
            </div>
            <div className="mt-6">
              <Button 
                className="w-full flex items-center justify-center"
                onClick={proceedToCheckout}
              >
                {user ? 'Proceed to Checkout' : 'Login to Checkout'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}