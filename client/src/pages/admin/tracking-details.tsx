import React from 'react';
import { useParams } from 'wouter';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  ExternalLink, 
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  MapPin
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const TrackingDetailsPage = () => {
  const { trackingId } = useParams();
  
  // In a real app, fetch the tracking details based on the ID
  // This is simulated data for demonstration
  const trackingDetails = {
    id: trackingId || 'SR123456789',
    orderId: 'ORD-5893',
    customer: {
      name: 'Deepak Singh',
      email: 'deepak@example.com',
      phone: '+91 9876543210'
    },
    carrier: 'Shiprocket',
    status: 'In Transit',
    estimatedDelivery: '2025-04-17',
    shippedDate: '2025-04-15',
    origin: 'Warehouse, Delhi',
    destination: 'Mumbai, Maharashtra, 400001',
    package: {
      weight: '1.5 kg',
      dimensions: '30 x 20 x 10 cm',
      items: 3
    },
    trackingUrl: 'https://shiprocket.co/tracking/SR123456789',
    trackingHistory: [
      {
        date: '2025-04-15 14:30',
        status: 'In Transit',
        location: 'Mumbai, MH',
        description: 'Package is in transit to the next facility'
      },
      {
        date: '2025-04-15 09:45',
        status: 'Package Processed',
        location: 'Delhi Sorting Center, DL',
        description: 'Package has been processed at sorting facility'
      },
      {
        date: '2025-04-14 18:20',
        status: 'Picked Up',
        location: 'Delhi, DL',
        description: 'Package has been picked up by carrier'
      },
      {
        date: '2025-04-14 12:30',
        status: 'Ready for Pickup',
        location: 'Warehouse, Delhi',
        description: 'Package is ready for pickup'
      },
      {
        date: '2025-04-14 10:15',
        status: 'Label Created',
        location: 'Warehouse, Delhi',
        description: 'Shipping label has been created'
      }
    ]
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>;
      case 'in transit':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Transit</Badge>;
      case 'out for delivery':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Out for Delivery</Badge>;
      case 'picked up':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Picked Up</Badge>;
      case 'exception':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Exception</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
    }
  };

  // Calculate delivery progress
  const calculateProgress = () => {
    const statusSteps = ['Label Created', 'Ready for Pickup', 'Picked Up', 'Package Processed', 'In Transit', 'Out for Delivery', 'Delivered'];
    const currentStatusIndex = statusSteps.findIndex(step => step.toLowerCase() === trackingDetails.status.toLowerCase());
    
    if (currentStatusIndex === -1) return 0;
    return Math.round((currentStatusIndex / (statusSteps.length - 1)) * 100);
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
            <h1 className="text-2xl font-bold tracking-tight">Tracking Details</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <a href={trackingDetails.trackingUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on {trackingDetails.carrier}
              </a>
            </Button>
          </div>
        </div>

        {/* Tracking Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Tracking Number: {trackingDetails.id}</CardTitle>
            <CardDescription>
              Order #{trackingDetails.orderId} • {trackingDetails.customer.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Carrier</p>
                <div className="flex items-center">
                  <Truck className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="font-medium">{trackingDetails.carrier}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div>
                  {getStatusBadge(trackingDetails.status)}
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Shipped Date</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p>{trackingDetails.shippedDate}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Expected Delivery</p>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p>{trackingDetails.estimatedDelivery}</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <p className="font-medium">Delivery Progress</p>
                <p>{calculateProgress()}%</p>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <p>Label Created</p>
                <p>In Transit</p>
                <p>Delivered</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">From</p>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <p className="text-sm">{trackingDetails.origin}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">To</p>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <p className="text-sm">{trackingDetails.destination}</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Package Details</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">Weight: {trackingDetails.package.weight}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">Dimensions: {trackingDetails.package.dimensions}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">Items: {trackingDetails.package.items}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tracking History */}
        <Card>
          <CardHeader>
            <CardTitle>Tracking History</CardTitle>
            <CardDescription>
              Complete history of shipment activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="relative border-l border-gray-200 ml-3">
              {trackingDetails.trackingHistory.map((event, index) => (
                <li key={index} className="mb-10 ml-6">
                  <span className="absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-white">
                    {index === 0 ? (
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        event.status.toLowerCase() === 'delivered'
                          ? 'bg-green-100'
                          : event.status.toLowerCase().includes('transit')
                            ? 'bg-blue-100'
                            : event.status.toLowerCase().includes('exception')
                              ? 'bg-red-100'
                              : 'bg-gray-100'
                      }`}>
                        {event.status.toLowerCase() === 'delivered' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : event.status.toLowerCase().includes('exception') ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-blue-600" />
                        )}
                      </span>
                    ) : (
                      <span className="w-3 h-3 rounded-full bg-gray-200"></span>
                    )}
                  </span>
                  <h3 className="flex items-center mb-1 text-lg font-semibold">
                    {event.status}
                    {index === 0 && (
                      <span className="text-sm font-medium mr-2 px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 ml-3">
                        Latest
                      </span>
                    )}
                  </h3>
                  <time className="block mb-2 text-sm font-normal text-gray-500">
                    {event.date}
                  </time>
                  <div className="mb-4 text-base font-normal flex items-start space-x-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span>{event.location}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default TrackingDetailsPage;