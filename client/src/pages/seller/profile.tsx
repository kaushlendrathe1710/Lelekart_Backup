import React, { useState } from "react";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { Edit, Star, Award, ShieldCheck, CheckCircle, FileText, HelpCircle, Briefcase, Mail, Phone, MapPin, Globe, Calendar, TrendingUp, AlertCircle, BarChart2, Truck, Package, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SellerProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Sample data for seller profile
  const sellerData = {
    name: user?.username || "Seller",
    email: user?.email || "seller@example.com",
    businessName: "LeleKart Seller Business",
    phone: user?.phone || "1234567890",
    address: user?.address || "123 Seller Street, Business District",
    registrationDate: "April 10, 2023",
    rating: 4.2,
    orders: 128,
    deliverySpeed: 92,
    returnRate: 3.5,
    responseTime: "4 hours",
    qualityScore: 85,
    pricingCompetitiveness: 78,
    gstNumber: "22AAAAA0000A1Z5",
    panNumber: "ABCDE1234F",
    bankAccount: "XXXX XXXX XXXX 4321",
    bankName: "State Bank of India",
    ifscCode: "SBIN0001234",
  };

  // Performance Metrics
  const performanceMetrics = [
    { name: "Order Fulfillment", value: 95, benchmark: 85 },
    { name: "On-Time Shipping", value: 92, benchmark: 80 },
    { name: "Return Rate", value: 3.5, benchmark: 10, inverse: true },
    { name: "Quality Score", value: 85, benchmark: 75 },
    { name: "Customer Satisfaction", value: 88, benchmark: 80 },
  ];

  return (
    <SellerDashboardLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col gap-6">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
            <div className="flex gap-4 items-center">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {sellerData.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{sellerData.businessName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{sellerData.rating}</span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Verified Seller
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Member since {sellerData.registrationDate}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4 md:mt-0">
              <Button variant="outline" size="sm" className="gap-1">
                <FileText className="h-4 w-4" />
                <span>Export Data</span>
              </Button>
              <Button size="sm" className="gap-1">
                <Edit className="h-4 w-4" />
                <span>Edit Profile</span>
              </Button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="bg-white rounded-lg shadow-sm">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger 
                  value="profile" 
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Business Details
                </TabsTrigger>
                <TabsTrigger 
                  value="performance" 
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Performance
                </TabsTrigger>
                <TabsTrigger 
                  value="documents" 
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Documents
                </TabsTrigger>
                <TabsTrigger 
                  value="payments" 
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Payments
                </TabsTrigger>
                <TabsTrigger 
                  value="compliance" 
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Compliance
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Profile/Business Details Tab */}
            <TabsContent value="profile" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <span>Business Information</span>
                    </CardTitle>
                    <CardDescription>Your company and contact details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Business Name</p>
                          <p className="text-sm text-muted-foreground">{sellerData.businessName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Email Address</p>
                          <p className="text-sm text-muted-foreground">{sellerData.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Phone Number</p>
                          <p className="text-sm text-muted-foreground">{sellerData.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Business Address</p>
                          <p className="text-sm text-muted-foreground">{sellerData.address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Website</p>
                          <p className="text-sm text-muted-foreground">www.lelekartbusiness.com</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Registered On</p>
                          <p className="text-sm text-muted-foreground">{sellerData.registrationDate}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sales Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-primary" />
                      <span>Sales Summary</span>
                    </CardTitle>
                    <CardDescription>Overview of your selling activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-md">
                          <div className="text-xs text-blue-600 uppercase font-semibold">Total Orders</div>
                          <div className="text-2xl font-bold">{sellerData.orders}</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-md">
                          <div className="text-xs text-green-600 uppercase font-semibold">Ship On Time</div>
                          <div className="text-2xl font-bold">{sellerData.deliverySpeed}%</div>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-md">
                          <div className="text-xs text-amber-600 uppercase font-semibold">Return Rate</div>
                          <div className="text-2xl font-bold">{sellerData.returnRate}%</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-md">
                          <div className="text-xs text-purple-600 uppercase font-semibold">Response Time</div>
                          <div className="text-2xl font-bold">{sellerData.responseTime}</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Quality Score</span>
                          <span className="font-medium">{sellerData.qualityScore}%</span>
                        </div>
                        <Progress value={sellerData.qualityScore} className="h-2" />
                        
                        <div className="flex justify-between text-sm mt-4">
                          <span>Pricing Competitiveness</span>
                          <span className="font-medium">{sellerData.pricingCompetitiveness}%</span>
                        </div>
                        <Progress value={sellerData.pricingCompetitiveness} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Verification */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <span>Account Verification</span>
                    </CardTitle>
                    <CardDescription>Your account verification status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Email Verified</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Verified
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Phone Verified</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Verified
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">GST Verification</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Verified
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Bank Account</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Verified
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Business Documents</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Verified
                        </Badge>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-600">100% Account Completion</span>
                        </div>
                        <Progress value={100} className="h-2 mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Performance Overview */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span>Performance Metrics</span>
                    </CardTitle>
                    <CardDescription>
                      How your store is performing compared to benchmarks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {performanceMetrics.map((metric) => (
                        <div key={metric.name} className="space-y-2">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{metric.name}</span>
                              {metric.inverse ? (
                                <Badge variant="outline" className={metric.value < metric.benchmark ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                                  {metric.value < metric.benchmark ? "Good" : "Needs Improvement"}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className={metric.value > metric.benchmark ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                                  {metric.value > metric.benchmark ? "Good" : "Needs Improvement"}
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm font-semibold">{metric.value}{metric.inverse ? "%" : "%"}</span>
                          </div>
                          
                          <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                              <div>
                                <span className="text-xs text-gray-500">
                                  Benchmark: {metric.benchmark}%
                                </span>
                              </div>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full">
                              <div 
                                className={`h-2 rounded-full ${
                                  metric.inverse
                                    ? metric.value < metric.benchmark ? "bg-green-500" : "bg-red-500"
                                    : metric.value > metric.benchmark ? "bg-green-500" : "bg-red-500"
                                }`}
                                style={{ width: `${metric.value}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <span>Performance Insights</span>
                    </CardTitle>
                    <CardDescription>Tips to improve your seller metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-2 p-3 border rounded-md bg-amber-50 border-amber-200">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-700">Improve Response Time</p>
                          <p className="text-xs text-amber-600 mt-1">
                            Your current response time of 4 hours is above the average. Try to respond to customer inquiries within 2 hours to improve your score.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 border rounded-md bg-green-50 border-green-200">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-700">Great Order Fulfillment</p>
                          <p className="text-xs text-green-600 mt-1">
                            You're fulfilling 95% of orders successfully, which is above the benchmark of 85%. Keep up the good work!
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 border rounded-md bg-blue-50 border-blue-200">
                        <Truck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-700">Shipping Performance</p>
                          <p className="text-xs text-blue-600 mt-1">
                            Your on-time shipping rate of 92% exceeds the marketplace benchmark of 80%. This positively affects your seller rating.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 border rounded-md bg-purple-50 border-purple-200">
                        <Package className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-purple-700">Low Return Rate</p>
                          <p className="text-xs text-purple-600 mt-1">
                            Your return rate of 3.5% is significantly better than the benchmark of 10%. This indicates good product quality and accurate listings.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span>Business Documents</span>
                    </CardTitle>
                    <CardDescription>
                      Your business verification documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">GST Certificate</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verified</Badge>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">PAN Card</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verified</Badge>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Business Registration</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verified</Badge>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Bank Statement</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verified</Badge>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Address Proof</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verified</Badge>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Button variant="outline" size="sm" className="w-full">Upload New Document</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <span>Business Details</span>
                    </CardTitle>
                    <CardDescription>
                      Your business registration information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">GST Number</p>
                        <p className="text-sm text-muted-foreground">{sellerData.gstNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">PAN Number</p>
                        <p className="text-sm text-muted-foreground">{sellerData.panNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Business Type</p>
                        <p className="text-sm text-muted-foreground">Private Limited Company</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Tax Registration Date</p>
                        <p className="text-sm text-muted-foreground">January 15, 2023</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Tax Filing Status</p>
                        <p className="text-sm text-muted-foreground">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Up to date
                          </Badge>
                        </p>
                      </div>
                      <div className="pt-2">
                        <Button variant="outline" size="sm">Update Business Details</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <span>Payment Information</span>
                    </CardTitle>
                    <CardDescription>
                      Your banking and payment details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Bank Account</p>
                        <p className="text-sm text-muted-foreground">{sellerData.bankAccount}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Bank Name</p>
                        <p className="text-sm text-muted-foreground">{sellerData.bankName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">IFSC Code</p>
                        <p className="text-sm text-muted-foreground">{sellerData.ifscCode}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Account Holder Name</p>
                        <p className="text-sm text-muted-foreground">{sellerData.businessName}</p>
                      </div>
                      <div className="pt-2">
                        <Button variant="outline" size="sm">Update Banking Information</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-primary" />
                      <span>Payment Statistics</span>
                    </CardTitle>
                    <CardDescription>
                      Your payment processing metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-md">
                          <div className="text-xs text-blue-600 uppercase font-semibold">Pending</div>
                          <div className="text-2xl font-bold">₹48,550</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-md">
                          <div className="text-xs text-green-600 uppercase font-semibold">Processed</div>
                          <div className="text-2xl font-bold">₹2,35,640</div>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-md">
                          <div className="text-xs text-amber-600 uppercase font-semibold">On Hold</div>
                          <div className="text-2xl font-bold">₹12,500</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-md">
                          <div className="text-xs text-purple-600 uppercase font-semibold">Next Payout</div>
                          <div className="text-2xl font-bold">Apr 18</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="pt-2">
                        <Button variant="outline" size="sm" className="w-full">View Payment History</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <span>Compliance Status</span>
                    </CardTitle>
                    <CardDescription>
                      Your marketplace compliance status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Seller Guidelines</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Compliant
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Product Listings</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Compliant
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Shipping Policies</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Compliant
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Return Policies</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Compliant
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Tax Documentation</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Compliant
                        </Badge>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-600">100% Compliance Rating</span>
                        </div>
                        <Progress value={100} className="h-2 mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      <span>Compliance Resources</span>
                    </CardTitle>
                    <CardDescription>
                      Resources to help maintain compliance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-2 p-3 border rounded-md">
                        <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Seller Guidelines</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Comprehensive guide for selling on LeleKart
                          </p>
                          <Button variant="link" size="sm" className="h-8 px-0">
                            View Guidelines
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 border rounded-md">
                        <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Tax Requirements</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Information on tax obligations for sellers
                          </p>
                          <Button variant="link" size="sm" className="h-8 px-0">
                            View Tax Guide
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 border rounded-md">
                        <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Prohibited Items</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            List of items not permitted for sale
                          </p>
                          <Button variant="link" size="sm" className="h-8 px-0">
                            View List
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 border rounded-md">
                        <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Shipping & Returns</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Policies for shipping and handling returns
                          </p>
                          <Button variant="link" size="sm" className="h-8 px-0">
                            View Policies
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SellerDashboardLayout>
  );
}