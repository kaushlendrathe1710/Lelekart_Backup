import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Calendar,
  Check,
  CreditCard,
  HelpCircle,
  Loader2,
  LogOut,
  Mailbox,
  MessageSquare,
  Moon,
  Percent,
  PhoneCall,
  Save,
  Settings,
  ShieldAlert,
  Sun,
  Truck,
  UserCog,
  Wallet,
} from "lucide-react";

export default function SellerSettingsPage() {
  const [currentTab, setCurrentTab] = useState("account");
  const [holidayMode, setHolidayMode] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      orders: true,
      payments: true,
      returns: true,
      reviews: true,
      promotions: false,
    },
    sms: {
      orders: true,
      payments: false,
      returns: false,
      reviews: false,
      promotions: false,
    },
    push: {
      orders: true,
      payments: true,
      returns: true,
      reviews: true,
      promotions: true,
    },
  });

  const { toast } = useToast();

  // Fetch seller settings
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['/api/seller/settings'],
    queryFn: async () => {
      const res = await fetch('/api/seller/settings');
      if (!res.ok) {
        throw new Error('Failed to fetch settings');
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data) {
        setHolidayMode(data.holidayMode || false);
        if (data.notificationPreferences) {
          setNotificationSettings(data.notificationPreferences);
        }
      }
    },
  });

  const toggleHolidayMode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/seller/settings/holiday-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !holidayMode,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update holiday mode');
      }
      
      setHolidayMode(!holidayMode);
      toast({
        title: !holidayMode ? "Holiday Mode Activated" : "Holiday Mode Deactivated",
        description: !holidayMode 
          ? "Your store is now in holiday mode and won't accept new orders." 
          : "Your store is now active and accepting new orders.",
      });
    } catch (error) {
      console.error('Error toggling holiday mode:', error);
      toast({
        title: "Action Failed",
        description: "Could not update holiday mode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/seller/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }
      
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Save Failed",
        description: "Could not update notification settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationChange = (channel: 'email' | 'sms' | 'push', setting: string, checked: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [setting]: checked,
      },
    }));
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    setIsLoading(true);
    try {
      // Here would be the API call to change password
      // For demonstration, we're just simulating success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsPasswordDialogOpen(false);
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description: "Could not update your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SellerDashboardLayout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/4">
            <Tabs
              orientation="vertical"
              value={currentTab}
              onValueChange={setCurrentTab}
              className="w-full"
            >
              <TabsList className="flex flex-col h-auto w-full bg-transparent space-y-1 p-0">
                <TabsTrigger 
                  value="account" 
                  className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted"
                >
                  <UserCog className="mr-2 h-4 w-4" />
                  Account
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="store" 
                  className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Store Settings
                </TabsTrigger>
                <TabsTrigger 
                  value="billing" 
                  className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted"
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Security
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="md:w-3/4">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsContent value="account" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue={settings?.personalInfo?.name || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue={settings?.personalInfo?.email || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" defaultValue={settings?.personalInfo?.phone || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alternatePhone">Alternate Phone (Optional)</Label>
                      <Input id="alternatePhone" defaultValue={settings?.personalInfo?.alternatePhone || ""} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Address Information</CardTitle>
                  <CardDescription>Manage your address details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">Address Line 1</Label>
                    <Input id="addressLine1" defaultValue={settings?.address?.line1 || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                    <Input id="addressLine2" defaultValue={settings?.address?.line2 || ""} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" defaultValue={settings?.address?.city || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" defaultValue={settings?.address?.state || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input id="pincode" defaultValue={settings?.address?.pincode || ""} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-4">Email Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Mailbox className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="email-orders" className="flex-1">New Orders</Label>
                        </div>
                        <Switch 
                          id="email-orders" 
                          checked={notificationSettings.email.orders}
                          onCheckedChange={(checked) => handleNotificationChange('email', 'orders', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="email-payments" className="flex-1">Payment Updates</Label>
                        </div>
                        <Switch 
                          id="email-payments" 
                          checked={notificationSettings.email.payments}
                          onCheckedChange={(checked) => handleNotificationChange('email', 'payments', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="email-returns" className="flex-1">Returns & Refunds</Label>
                        </div>
                        <Switch 
                          id="email-returns" 
                          checked={notificationSettings.email.returns}
                          onCheckedChange={(checked) => handleNotificationChange('email', 'returns', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="email-reviews" className="flex-1">Customer Reviews</Label>
                        </div>
                        <Switch 
                          id="email-reviews" 
                          checked={notificationSettings.email.reviews}
                          onCheckedChange={(checked) => handleNotificationChange('email', 'reviews', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Percent className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="email-promotions" className="flex-1">Promotions & Offers</Label>
                        </div>
                        <Switch 
                          id="email-promotions" 
                          checked={notificationSettings.email.promotions}
                          onCheckedChange={(checked) => handleNotificationChange('email', 'promotions', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-4">SMS Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Mailbox className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="sms-orders" className="flex-1">New Orders</Label>
                        </div>
                        <Switch 
                          id="sms-orders" 
                          checked={notificationSettings.sms.orders}
                          onCheckedChange={(checked) => handleNotificationChange('sms', 'orders', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="sms-payments" className="flex-1">Payment Updates</Label>
                        </div>
                        <Switch 
                          id="sms-payments" 
                          checked={notificationSettings.sms.payments}
                          onCheckedChange={(checked) => handleNotificationChange('sms', 'payments', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="sms-returns" className="flex-1">Returns & Refunds</Label>
                        </div>
                        <Switch 
                          id="sms-returns" 
                          checked={notificationSettings.sms.returns}
                          onCheckedChange={(checked) => handleNotificationChange('sms', 'returns', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-4">Push Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Mailbox className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="push-orders" className="flex-1">New Orders</Label>
                        </div>
                        <Switch 
                          id="push-orders" 
                          checked={notificationSettings.push.orders}
                          onCheckedChange={(checked) => handleNotificationChange('push', 'orders', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="push-payments" className="flex-1">Payment Updates</Label>
                        </div>
                        <Switch 
                          id="push-payments" 
                          checked={notificationSettings.push.payments}
                          onCheckedChange={(checked) => handleNotificationChange('push', 'payments', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="push-returns" className="flex-1">Returns & Refunds</Label>
                        </div>
                        <Switch 
                          id="push-returns" 
                          checked={notificationSettings.push.returns}
                          onCheckedChange={(checked) => handleNotificationChange('push', 'returns', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="push-reviews" className="flex-1">Customer Reviews</Label>
                        </div>
                        <Switch 
                          id="push-reviews" 
                          checked={notificationSettings.push.reviews}
                          onCheckedChange={(checked) => handleNotificationChange('push', 'reviews', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Percent className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="push-promotions" className="flex-1">Promotions & Offers</Label>
                        </div>
                        <Switch 
                          id="push-promotions" 
                          checked={notificationSettings.push.promotions}
                          onCheckedChange={(checked) => handleNotificationChange('push', 'promotions', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={saveNotificationSettings} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="store" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Store Settings</CardTitle>
                  <CardDescription>Manage your store configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input id="storeName" defaultValue={settings?.store?.name || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeDescription">Store Description</Label>
                    <Textarea 
                      id="storeDescription" 
                      rows={4}
                      defaultValue={settings?.store?.description || ""}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input id="contactEmail" type="email" defaultValue={settings?.store?.contactEmail || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Contact Phone</Label>
                      <Input id="contactPhone" defaultValue={settings?.store?.contactPhone || ""} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Holiday Mode</CardTitle>
                  <CardDescription>
                    Temporarily disable your store for vacation or other reasons
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Holiday Mode</h3>
                      <p className="text-sm text-muted-foreground">
                        When enabled, your store will not accept new orders, but customers can still browse products.
                      </p>
                    </div>
                    <Switch 
                      checked={holidayMode} 
                      onCheckedChange={toggleHolidayMode}
                      disabled={isLoading}
                    />
                  </div>
                  
                  {holidayMode && (
                    <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 text-amber-600 mt-0.5 mr-3" />
                        <div>
                          <h4 className="font-medium text-amber-800">Holiday Mode Active</h4>
                          <p className="text-sm text-amber-700 mt-1">
                            Your store is currently not accepting new orders. Customers can browse but cannot place orders.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {holidayMode && (
                    <div className="space-y-2">
                      <Label htmlFor="holidayMessage">Holiday Message (Optional)</Label>
                      <Textarea 
                        id="holidayMessage" 
                        placeholder="Enter a message to display to customers while your store is in holiday mode..." 
                        rows={3}
                        defaultValue={settings?.holidayMessage || ""}
                      />
                      <p className="text-xs text-muted-foreground">
                        This message will be displayed to customers when they visit your store.
                      </p>
                    </div>
                  )}
                </CardContent>
                {holidayMode && (
                  <CardFooter className="flex justify-end">
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      Save Message
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Billing Information</CardTitle>
                  <CardDescription>Manage your billing and tax information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN Number</Label>
                    <Input id="gstin" defaultValue={settings?.billing?.gstin || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Legal Business Name</Label>
                    <Input id="businessName" defaultValue={settings?.billing?.businessName || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN Number</Label>
                    <Input id="panNumber" defaultValue={settings?.billing?.panNumber || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Business Type</Label>
                    <RadioGroup defaultValue={settings?.billing?.businessType || "individual"}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual">Individual/Proprietorship</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="partnership" id="partnership" />
                        <Label htmlFor="partnership">Partnership</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="company" id="company" />
                        <Label htmlFor="company">Private Limited/Limited Company</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bank Account Information</CardTitle>
                  <CardDescription>Manage your payout details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Holder Name</Label>
                    <Input id="accountName" defaultValue={settings?.bankAccount?.accountName || ""} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input id="accountNumber" defaultValue={settings?.bankAccount?.accountNumber || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ifscCode">IFSC Code</Label>
                      <Input id="ifscCode" defaultValue={settings?.bankAccount?.ifscCode || ""} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input id="bankName" defaultValue={settings?.bankAccount?.bankName || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branchName">Branch Name</Label>
                    <Input id="branchName" defaultValue={settings?.bankAccount?.branchName || ""} />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-medium">Change Password</h3>
                    <p className="text-sm text-muted-foreground">
                      Update your password to keep your account secure
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPasswordDialogOpen(true)}
                  >
                    Change Password
                  </Button>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <h3 className="text-base font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="twoFactor" />
                    <Label htmlFor="twoFactor">Enable Two-Factor Authentication</Label>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <h3 className="text-base font-medium">Account Sessions</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage active sessions on your account
                    </p>
                  </div>
                  <Button variant="outline">
                    View Active Sessions
                  </Button>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <h3 className="text-base font-medium text-destructive">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your seller account
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Delete Seller Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your seller account and remove your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password to update your credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPasswordDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => changePassword('oldPassword', 'newPassword')}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SellerDashboardLayout>
  );
}