import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/layout";
import { queryClient } from "@/lib/queryClient";

interface CartItem {
  id: number;
  quantity: number;
  userId: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    sellerId: number;
    approved: boolean;
    createdAt: string;
  };
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Fetch user and cart data
  useEffect(() => {
    // Check if user is already cached
    const cachedUser = queryClient.getQueryData<any>(['/api/user']);
    if (cachedUser) {
      setUser(cachedUser);
    }
    
    // Fetch fresh user data
    fetch('/api/user', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    .then(res => {
      if (res.ok) return res.json();
      return null;
    })
    .then(userData => {
      if (userData) {
        setUser(userData);
        queryClient.setQueryData(['/api/user'], userData);
        // Fetch cart data
        fetchCartItems();
      } else {
        setLoading(false);
        setLocation('/auth');
      }
    })
    .catch(err => {
      console.error("Error fetching user:", err);
      setLoading(false);
    });
  }, []);

  const fetchCartItems = () => {
    fetch('/api/cart', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    .then(res => res.json())
    .then(data => {
      setCartItems(data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Error fetching cart:", err);
      setLoading(false);
    });
  }

  const updateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      const res = await fetch(`/api/cart/${cartItemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify({ quantity: newQuantity })
      });
      
      if (res.ok) {
        // Update local state
        setCartItems(prev => 
          prev.map(item => 
            item.id === cartItemId ? { ...item, quantity: newQuantity } : item
          )
        );
      }
    } catch (error) {
      console.error("Error updating cart item:", error);
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      const res = await fetch(`/api/cart/${cartItemId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (res.ok) {
        // Remove item from local state
        setCartItems(prev => prev.filter(item => item.id !== cartItemId));
      }
    } catch (error) {
      console.error("Error removing cart item:", error);
    }
  };

  const proceedToCheckout = () => {
    setLocation('/checkout');
  };

  const buyNow = async () => {
    // Redirect to checkout page
    setLocation('/checkout');
  };

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => 
    total + (item.product.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 40 : 0; // Free shipping over a certain amount
  const total = subtotal + shipping;

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Button 
              onClick={() => setLocation('/')} 
              className="bg-primary text-white"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-center object-cover"
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
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-3 py-1 text-gray-600 hover:text-primary"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={16} />
                            </button>
                            <span className="px-3 py-1">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-1 text-gray-600 hover:text-primary"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <div className="flex">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
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
    </Layout>
  );
}