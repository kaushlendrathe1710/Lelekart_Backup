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
  MapPin, 
  Calendar, 
  Clock, 
  RefreshCw,
  User,
  Phone,
  Mail,
  Home
} from 'lucide-react';

// A component to display an event in the tracking timeline
const TrackingEvent = ({ event, isLast = false }) => {
  return (
    <div className="flex">
      <div className="flex flex-col items-center mr-4">
        <div className="w-3 h-3 rounded-full bg-primary"></div>
        {!isLast && <div className="w-0.5 h-full bg-gray-200 mt-1"></div>}
      </div>
      <div className={`pb-6 ${isLast ? '' : 'border-l-0'}`}>
        <p className="font-medium">{event.description}</p>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <Calendar className="h-3.5 w-3.5 mr-1" />
          <span>{event.date}</span>
          <Clock className="h-3.5 w-3.5 ml-3 mr-1" />
          <span>{event.time}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <MapPin className="h-3.5 w-3.5 mr-1" />
          <span>{event.location}</span>
        </div>
      </div>
    </div>
  );
};

const TrackingDetailsPage = () => {
  const params = useParams();
  const trackingNumber = params.trackingNumber;
  
  // Sample data - in a real app, this would come from an API using the tracking number
  const trackingDetails = {
    carrierName: "Shiprocket",
    trackingNumber: trackingNumber || "SR123456789",
    status: "In Transit",
    estimatedDelivery: "Apr 20, 2025",
    orderNumber: "ORD-5893",
    events: [
      {
        id: 1,
        description: "Out for Delivery",
        date: "Apr 16, 2025",
        time: "09:30 AM",
        location: "Mumbai, Maharashtra"
      },
      {
        id: 2,
        description: "Arrived at Delivery Facility",
        date: "Apr 15, 2025",
        time: "08:15 PM",
        location: "Mumbai, Maharashtra"
      },
      {
        id: 3,
        description: "In Transit",
        date: "Apr 14, 2025",
        time: "02:45 PM",
        location: "Delhi, Delhi"
      },
      {
        id: 4,
        description: "Shipment Picked Up",
        date: "Apr 13, 2025",
        time: "11:20 AM",
        location: "Gurgaon, Haryana"
      },
      {
        id: 5,
        description: "Shipping Label Created",
        date: "Apr 12, 2025",
        time: "03:40 PM",
        location: "Gurgaon, Haryana"
      }
    ],
    shipmentDetails: {
      weight: "1.2 kg",
      dimensions: "30 x 25 x 5 cm",
      courier: "Delhivery Express",
      service: "Standard Delivery",
      trackingUrl: "https://shiprocket.co/tracking/" + trackingNumber
    },
    customer: {
      name: "Deepak Singh",
      email: "deepak.singh@example.com",
      phone: "+91 98765 43210",
      address: {
        line1: "123, Vijay Apartments",
        line2: "Sector 15",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: "India"
      }
    }
  };
  
  const getStatusBadgeVariant = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'default'; // green
      case 'in transit':
        return 'secondary'; // blue
      case 'out for delivery':
        return 'outline'; // purple
      case 'exception':
        return 'destructive'; // red
      default:
        return 'secondary';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Button 
              variant="ghost" 
              className="pl-0 mb-2 flex items-center"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tracking Management
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Tracking Details</h1>
            <p className="text-muted-foreground mt-1">
              Tracking number: {trackingDetails.trackingNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button>
              <Truck className="h-4 w-4 mr-2" />
              Track on Carrier Site
            </Button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Tracking Status */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Shipment Status
                    </CardTitle>
                    <CardDescription>
                      Order #{trackingDetails.orderNumber}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(trackingDetails.status)}>
                    {trackingDetails.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carrier</span>
                    <span className="font-medium">{trackingDetails.carrierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Delivery</span>
                    <span className="font-medium">{trackingDetails.estimatedDelivery}</span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <h3 className="font-semibold mb-4">Tracking History</h3>
                <div className="space-y-1">
                  {trackingDetails.events.map((event, index) => (
                    <TrackingEvent 
                      key={event.id} 
                      event={event} 
                      isLast={index === trackingDetails.events.length - 1} 
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Additional Info */}
          <div className="space-y-6">
            {/* Shipment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Truck className="h-5 w-5 mr-2" />
                  Shipment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Weight</div>
                  <div className="text-sm">{trackingDetails.shipmentDetails.weight}</div>
                  
                  <div className="text-sm text-muted-foreground">Dimensions</div>
                  <div className="text-sm">{trackingDetails.shipmentDetails.dimensions}</div>
                  
                  <div className="text-sm text-muted-foreground">Courier</div>
                  <div className="text-sm">{trackingDetails.shipmentDetails.courier}</div>
                  
                  <div className="text-sm text-muted-foreground">Service</div>
                  <div className="text-sm">{trackingDetails.shipmentDetails.service}</div>
                </div>
              </CardContent>
            </Card>
            
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <User className="h-5 w-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{trackingDetails.customer.name}</h4>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Phone className="h-3.5 w-3.5 mr-1" />
                    <span>{trackingDetails.customer.phone}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    <span>{trackingDetails.customer.email}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium flex items-center">
                    <Home className="h-4 w-4 mr-1" />
                    Delivery Address
                  </h4>
                  <div className="text-sm text-muted-foreground mt-1">
                    <p>{trackingDetails.customer.address.line1}</p>
                    {trackingDetails.customer.address.line2 && <p>{trackingDetails.customer.address.line2}</p>}
                    <p>{trackingDetails.customer.address.city}, {trackingDetails.customer.address.state} {trackingDetails.customer.address.pincode}</p>
                    <p>{trackingDetails.customer.address.country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TrackingDetailsPage;