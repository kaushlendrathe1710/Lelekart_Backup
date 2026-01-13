import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Trash2, Search, ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";

interface Buyer {
    id: number;
    username: string;
    email: string;
    name: string;
    phone: string;
    address: string;
}

interface Address {
    id: number;
    userId: number;
    addressName: string;
    fullName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    isDefault: boolean;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
    mrp: number;
    stock: number;
    imageUrl: string;
    category: string;
    gstRate: string;
    deliveryCharges: number;
}

interface OrderItem {
    productId: number;
    quantity: number;
    product?: Product;
}

export default function PlaceOrderForBuyer() {
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    // State
    const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [buyerSearch, setBuyerSearch] = useState("");
    const [productSearch, setProductSearch] = useState("");
    const [showAddressDialog, setShowAddressDialog] = useState(false);
    const [showProductSearch, setShowProductSearch] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // New address form state
    const [newAddress, setNewAddress] = useState({
        addressName: "",
        fullName: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        phone: "",
        isDefault: false,
    });

    // Fetch buyers
    const {
        data: buyersData,
        isLoading: loadingBuyers,
        refetch: refetchBuyers,
    } = useQuery({
        queryKey: ["/api/admin/buyers", buyerSearch],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (buyerSearch) params.append("search", buyerSearch);
            const response = await apiRequest("GET", `/api/admin/buyers?${params.toString()}`);
            return response.json();
        },
    });

    // Fetch addresses for selected buyer
    const {
        data: addresses,
        isLoading: loadingAddresses,
        refetch: refetchAddresses,
    } = useQuery({
        queryKey: ["/api/admin/buyers/:id/addresses", selectedBuyer?.id],
        queryFn: async () => {
            if (!selectedBuyer) return [];
            const response = await apiRequest("GET", `/api/admin/buyers/${selectedBuyer.id}/addresses`);
            return response.json();
        },
        enabled: !!selectedBuyer,
    });

    // Fetch products for search
    const {
        data: productsData,
        isLoading: loadingProducts,
    } = useQuery({
        queryKey: ["/api/admin/products-for-order", productSearch],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (productSearch) params.append("search", productSearch);
            const response = await apiRequest("GET", `/api/admin/products-for-order?${params.toString()}`);
            return response.json();
        },
        enabled: showProductSearch,
    });

    // Create address mutation
    const createAddressMutation = useMutation({
        mutationFn: async (addressData: any) => {
            const response = await apiRequest(
                "POST",
                `/api/admin/buyers/${selectedBuyer!.id}/addresses`,
                addressData
            );
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Address created successfully",
            });
            setShowAddressDialog(false);
            refetchAddresses();
            setNewAddress({
                addressName: "",
                fullName: "",
                address: "",
                city: "",
                state: "",
                pincode: "",
                phone: "",
                isDefault: false,
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to create address",
                variant: "destructive",
            });
        },
    });

    // Create order mutation
    const createOrderMutation = useMutation({
        mutationFn: async (orderData: any) => {
            const response = await apiRequest(
                "POST",
                "/api/admin/orders-for-buyer",
                orderData
            );
            return response.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Success",
                description: "Order created successfully",
            });
            // Reset form
            setSelectedBuyer(null);
            setSelectedAddress(null);
            setOrderItems([]);
            setShowPreview(false);
            // Navigate to orders list page
            setLocation("/admin/orders");
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to create order",
                variant: "destructive",
            });
        },
    });

    // Handle buyer selection
    const handleSelectBuyer = (buyer: Buyer) => {
        setSelectedBuyer(buyer);
        setBuyerSearch("");
        setSelectedAddress(null);
        setOrderItems([]);
    };

    // Handle add product
    const handleAddProduct = (product: Product) => {
        const existingItem = orderItems.find(
            (item) => item.productId === product.id
        );
        if (existingItem) {
            toast({
                title: "Info",
                description: "Product already added. Update quantity instead.",
                variant: "default",
            });
            return;
        }

        setOrderItems([
            ...orderItems,
            { productId: product.id, quantity: 1, product },
        ]);
        setShowProductSearch(false);
        setProductSearch("");
    };

    // Handle remove product
    const handleRemoveProduct = (productId: number) => {
        setOrderItems(orderItems.filter((item) => item.productId !== productId));
    };

    // Handle quantity change
    const handleQuantityChange = (productId: number, quantity: number) => {
        setOrderItems(
            orderItems.map((item) =>
                item.productId === productId ? { ...item, quantity } : item
            )
        );
    };

    // Calculate total
    const calculateTotal = () => {
        return orderItems.reduce((total, item) => {
            const price = item.product?.price || 0;
            const deliveryCharges = item.product?.deliveryCharges || 0;
            return total + price * item.quantity + deliveryCharges;
        }, 0);
    };

    // Handle create order
    const handleCreateOrder = () => {
        if (!selectedBuyer || !selectedAddress || orderItems.length === 0) {
            toast({
                title: "Error",
                description: "Please select buyer, address, and add at least one product",
                variant: "destructive",
            });
            return;
        }

        const orderData = {
            buyerId: selectedBuyer.id,
            addressId: selectedAddress,
            items: orderItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
            paymentMethod: "cod",
        };

        createOrderMutation.mutate(orderData);
    };

    // Handle create address
    const handleCreateAddress = () => {
        if (
            !newAddress.addressName ||
            !newAddress.fullName ||
            !newAddress.address ||
            !newAddress.city ||
            !newAddress.state ||
            !newAddress.pincode ||
            !newAddress.phone
        ) {
            toast({
                title: "Error",
                description: "Please fill all required fields",
                variant: "destructive",
            });
            return;
        }

        createAddressMutation.mutate(newAddress);
    };

    return (
        <AdminLayout>
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Place Order for Buyer</h1>
                        <p className="text-muted-foreground mt-1">
                            Create a custom order on behalf of a buyer
                        </p>
                    </div>
                </div>

                {/* Step 1: Select Buyer */}
                <Card>
                    <CardHeader>
                        <CardTitle>1. Select Buyer</CardTitle>
                        <CardDescription>
                            Search and select the buyer for whom you want to place an order
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!selectedBuyer ? (
                            <>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search buyers by name, email, phone..."
                                            value={buyerSearch}
                                            onChange={(e) => setBuyerSearch(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                    <Button onClick={() => refetchBuyers()} variant="outline">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>

                                {loadingBuyers ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : buyersData?.buyers?.length > 0 ? (
                                    <div className="grid gap-2 max-h-96 overflow-y-auto">
                                        {buyersData.buyers.map((buyer: Buyer) => (
                                            <Card
                                                key={buyer.id}
                                                className="cursor-pointer hover:bg-accent transition-colors"
                                                onClick={() => handleSelectBuyer(buyer)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold">{buyer.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {buyer.email}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {buyer.phone}
                                                            </p>
                                                        </div>
                                                        <Button size="sm" variant="outline">
                                                            Select
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">
                                        {buyerSearch
                                            ? "No buyers found. Try a different search."
                                            : "Enter a search term to find buyers."}
                                    </p>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-semibold">{selectedBuyer.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedBuyer.email}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedBuyer.phone}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedBuyer(null);
                                        setSelectedAddress(null);
                                        setOrderItems([]);
                                    }}
                                >
                                    Change Buyer
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 2: Select/Add Address */}
                {selectedBuyer && (
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Select Delivery Address</CardTitle>
                            <CardDescription>
                                Choose an existing address or add a new one
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loadingAddresses ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : (
                                <>
                                    {addresses && addresses.length > 0 && (
                                        <div className="grid gap-2">
                                            {addresses.map((address: Address) => (
                                                <Card
                                                    key={address.id}
                                                    className={`cursor-pointer transition-colors ${selectedAddress === address.id
                                                            ? "bg-primary/10 border-primary"
                                                            : "hover:bg-accent"
                                                        }`}
                                                    onClick={() => setSelectedAddress(address.id)}
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-semibold">
                                                                    {address.addressName}
                                                                    {address.isDefault && (
                                                                        <span className="ml-2 text-xs text-primary">
                                                                            (Default)
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-sm">{address.fullName}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {address.address}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {address.city}, {address.state} - {address.pincode}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Phone: {address.phone}
                                                                </p>
                                                            </div>
                                                            {selectedAddress === address.id && (
                                                                <div className="text-primary font-semibold">
                                                                    Selected
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}

                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setShowAddressDialog(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add New Address
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Add Products */}
                {selectedBuyer && selectedAddress && (
                    <Card>
                        <CardHeader>
                            <CardTitle>3. Add Products</CardTitle>
                            <CardDescription>
                                Search and add products to the order
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {orderItems.length > 0 && (
                                <div className="space-y-2">
                                    {orderItems.map((item) => (
                                        <Card key={item.productId}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-4">
                                                    {item.product?.imageUrl && (
                                                        <img
                                                            src={item.product.imageUrl}
                                                            alt={item.product.name}
                                                            className="w-16 h-16 object-cover rounded"
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="font-semibold">{item.product?.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Price: ₹{item.product?.price} | Stock:{" "}
                                                            {item.product?.stock}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Label htmlFor={`qty-${item.productId}`}>
                                                                Quantity:
                                                            </Label>
                                                            <Input
                                                                id={`qty-${item.productId}`}
                                                                type="number"
                                                                min="1"
                                                                max={item.product?.stock || 1}
                                                                value={item.quantity}
                                                                onChange={(e) =>
                                                                    handleQuantityChange(
                                                                        item.productId,
                                                                        parseInt(e.target.value) || 1
                                                                    )
                                                                }
                                                                className="w-20"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold">
                                                            ₹{(item.product?.price || 0) * item.quantity}
                                                        </p>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleRemoveProduct(item.productId)}
                                                            className="mt-2"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setShowProductSearch(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Product
                            </Button>

                            {orderItems.length > 0 && (
                                <div className="border-t pt-4 mt-4">
                                    <div className="flex justify-between items-center text-lg font-bold">
                                        <span>Total:</span>
                                        <span>₹{calculateTotal()}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                {selectedBuyer && selectedAddress && orderItems.length > 0 && (
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setShowPreview(true)}
                        >
                            Preview
                        </Button>
                        <Button
                            onClick={handleCreateOrder}
                            disabled={createOrderMutation.isPending}
                        >
                            {createOrderMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Create Order
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Add Address Dialog */}
                <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Address</DialogTitle>
                            <DialogDescription>
                                Add a new delivery address for the buyer
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="addressName">Address Label *</Label>
                                    <Input
                                        id="addressName"
                                        placeholder="Home, Office, etc."
                                        value={newAddress.addressName}
                                        onChange={(e) =>
                                            setNewAddress({ ...newAddress, addressName: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name *</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="Full name"
                                        value={newAddress.fullName}
                                        onChange={(e) =>
                                            setNewAddress({ ...newAddress, fullName: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address *</Label>
                                <Input
                                    id="address"
                                    placeholder="Street address"
                                    value={newAddress.address}
                                    onChange={(e) =>
                                        setNewAddress({ ...newAddress, address: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City *</Label>
                                    <Input
                                        id="city"
                                        placeholder="City"
                                        value={newAddress.city}
                                        onChange={(e) =>
                                            setNewAddress({ ...newAddress, city: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State *</Label>
                                    <Input
                                        id="state"
                                        placeholder="State"
                                        value={newAddress.state}
                                        onChange={(e) =>
                                            setNewAddress({ ...newAddress, state: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pincode">Pincode *</Label>
                                    <Input
                                        id="pincode"
                                        placeholder="Pincode"
                                        value={newAddress.pincode}
                                        onChange={(e) =>
                                            setNewAddress({ ...newAddress, pincode: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone *</Label>
                                    <Input
                                        id="phone"
                                        placeholder="Phone number"
                                        value={newAddress.phone}
                                        onChange={(e) =>
                                            setNewAddress({ ...newAddress, phone: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowAddressDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateAddress}
                                disabled={createAddressMutation.isPending}
                            >
                                {createAddressMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Address"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Product Search Dialog */}
                <Dialog open={showProductSearch} onOpenChange={setShowProductSearch}>
                    <DialogContent className="max-w-4xl max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>Search Products</DialogTitle>
                            <DialogDescription>
                                Search and select products to add to the order
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search products by name, SKU, category..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {loadingProducts ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    </div>
                                ) : productsData?.products?.length > 0 ? (
                                    productsData.products.map((product: Product) => (
                                        <Card
                                            key={product.id}
                                            className="cursor-pointer hover:bg-accent transition-colors"
                                            onClick={() => handleAddProduct(product)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-4">
                                                    {product.imageUrl && (
                                                        <img
                                                            src={product.imageUrl}
                                                            alt={product.name}
                                                            className="w-16 h-16 object-cover rounded"
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="font-semibold">{product.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            SKU: {product.sku || "N/A"} | Category:{" "}
                                                            {product.category}
                                                        </p>
                                                        <p className="text-sm">
                                                            Price: ₹{product.price} | Stock: {product.stock}
                                                        </p>
                                                    </div>
                                                    <Button size="sm">Add</Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">
                                        {productSearch
                                            ? "No products found. Try a different search."
                                            : "Enter a search term to find products."}
                                    </p>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Preview Dialog */}
                <AlertDialog open={showPreview} onOpenChange={setShowPreview}>
                    <AlertDialogContent className="max-w-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Order Preview</AlertDialogTitle>
                            <AlertDialogDescription>
                                Review the order details before creating
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <h3 className="font-semibold mb-2">Buyer Details</h3>
                                <p className="text-sm">Name: {selectedBuyer?.name}</p>
                                <p className="text-sm">Email: {selectedBuyer?.email}</p>
                                <p className="text-sm">Phone: {selectedBuyer?.phone}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Delivery Address</h3>
                                {addresses &&
                                    selectedAddress &&
                                    (() => {
                                        const address = addresses.find(
                                            (a: Address) => a.id === selectedAddress
                                        );
                                        return address ? (
                                            <>
                                                <p className="text-sm">{address.fullName}</p>
                                                <p className="text-sm">{address.address}</p>
                                                <p className="text-sm">
                                                    {address.city}, {address.state} - {address.pincode}
                                                </p>
                                                <p className="text-sm">Phone: {address.phone}</p>
                                            </>
                                        ) : null;
                                    })()}
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Order Items</h3>
                                <div className="space-y-1">
                                    {orderItems.map((item) => (
                                        <div
                                            key={item.productId}
                                            className="flex justify-between text-sm"
                                        >
                                            <span>
                                                {item.product?.name} x {item.quantity}
                                            </span>
                                            <span>₹{(item.product?.price || 0) * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t mt-2 pt-2">
                                    <div className="flex justify-between font-semibold">
                                        <span>Total:</span>
                                        <span>₹{calculateTotal()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCreateOrder}>
                                Confirm & Create Order
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AdminLayout>
    );
}
