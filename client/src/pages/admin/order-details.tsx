import React from 'react';
import { useParams } from 'wouter';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  User, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Info,
  Printer
} from 'lucide-react';

const OrderDetailsPage = () => {
  const { id } = useParams();
  
  // In a real app, fetch the order details from the API
  // This is simulated data based on the order ID
  const order = {
    id: id || 'ORD-0000',
    customer: {
      name: 'Deepak Singh',
      email: 'deepak.singh@example.com',
      phone: '+91 9876543210'
    },
    shipping: {
      address: 'Flat 501, Sunrise Tower',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India'
    },
    payment: {
      method: 'Credit Card',
      status: 'Paid',
      transactionId: 'TXN-78901234',
      amount: '₹4,590'
    },
    items: [
      {
        id: 'PROD-001',
        name: 'Smartphone XYZ',
        price: '₹1,990',
        quantity: 1,
        image: '/path/to/image1.jpg'
      },
      {
        id: 'PROD-002',
        name: 'Bluetooth Headphones',
        price: '₹1,200',
        quantity: 1,
        image: '/path/to/image2.jpg'
      },
      {
        id: 'PROD-003',
        name: 'Phone Case',
        price: '₹700',
        quantity: 2,
        image: '/path/to/image3.jpg'
      }
    ],
    status: 'Ready to Ship',
    date: '2025-04-15',
    subtotal: '₹4,090',
    shippingCost: '₹500',
    total: '₹4,590'
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'ready to ship':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-transparent">Ready to Ship</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-transparent">Processing</Badge>;
      case 'payment issue':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-transparent">Payment Issue</Badge>;
      case 'address issue':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-transparent">Address Issue</Badge>;
      case 'shipped':
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-transparent">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent">Delivered</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-transparent">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Order {order.id}</h1>
            {getStatusBadge(order.status)}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print Order
            </Button>
            {order.status.toLowerCase() === 'ready to ship' && (
              <Button onClick={() => window.location.href = `/admin/create-shipment?orderId=${order.id}`}>
                <Truck className="h-4 w-4 mr-2" />
                Create Shipment
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Order ID</dt>
                  <dd className="text-base">{order.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Date Placed</dt>
                  <dd className="text-base flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    {order.date}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                  <dd className="text-base">{getStatusBadge(order.status)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                  <dd className="text-base">{order.customer.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                  <dd className="text-base">{order.customer.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                  <dd className="text-base">{order.customer.phone}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                  <dd className="text-base">{order.shipping.address}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">City, State</dt>
                  <dd className="text-base">{order.shipping.city}, {order.shipping.state}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Postal Code, Country</dt>
                  <dd className="text-base">{order.shipping.postalCode}, {order.shipping.country}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Order Items
            </CardTitle>
            <CardDescription>
              {order.items.length} item(s) in this order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {item.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {`₹${(parseInt(item.price.replace(/[^0-9]/g, '')) * item.quantity).toLocaleString()}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6 border-t pt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{order.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{order.shippingCost}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{order.total}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Payment Method</dt>
                <dd className="text-base">{order.payment.method}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Transaction ID</dt>
                <dd className="text-base">{order.payment.transactionId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd className="text-base">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-transparent">
                    {order.payment.status}
                  </Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default OrderDetailsPage;