import { useEffect, useState, useContext } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { useCoAdmins, CoAdminPermissions, CreateCoAdminData } from "@/hooks/use-co-admins";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus, Trash2, Shield, Edit } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const createCoAdminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  permissions: z.object({
    // Dashboard
    canAccessDashboard: z.boolean().default(true),
    
    // Product Management
    canCreateProducts: z.boolean().default(false),
    canEditProducts: z.boolean().default(false),
    canDeleteProducts: z.boolean().default(false),
    canApproveProducts: z.boolean().default(false),
    canManageProductDisplay: z.boolean().default(false),
    
    // Category Management
    canCreateCategories: z.boolean().default(false),
    canEditCategories: z.boolean().default(false),
    canDeleteCategories: z.boolean().default(false),
    canManageSubcategories: z.boolean().default(false),
    
    // Hero Management
    canManageBanners: z.boolean().default(false),
    canDesignHero: z.boolean().default(false),
    
    // Content Management
    canManageFooter: z.boolean().default(false),
    canManageDocumentTemplates: z.boolean().default(false),
    canManageMediaLibrary: z.boolean().default(false),
    
    // Sales & Analytics
    canViewSales: z.boolean().default(true),
    canViewReports: z.boolean().default(true),
    canExportReports: z.boolean().default(false),
    canManageAnalytics: z.boolean().default(false),
    
    // Seller Management
    canManageSellers: z.boolean().default(false),
    canApproveSellers: z.boolean().default(false),
    canManageSellerAgreements: z.boolean().default(false),
    
    // Order Management
    canViewOrders: z.boolean().default(false),
    canManageOrders: z.boolean().default(false),
    canProcessRefunds: z.boolean().default(false),
    
    // User Management
    canViewUsers: z.boolean().default(false),
    canCreateUsers: z.boolean().default(false),
    canManageCustomers: z.boolean().default(false),
    canManageAdmins: z.boolean().default(false),
    
    // Shipping Management
    canAccessShippingSettings: z.boolean().default(false),
    canManageShippingGeneral: z.boolean().default(false),
    canManageShiprocket: z.boolean().default(false),
    canViewShipmentDashboard: z.boolean().default(false),
    canManagePendingShipments: z.boolean().default(false),
    canManageShippingRates: z.boolean().default(false),
    canManageTrackingInfo: z.boolean().default(false),
    
    // Rewards & Wallet Management
    canAccessWalletDashboard: z.boolean().default(false),
    canManageWalletSettings: z.boolean().default(false),
    canViewTransactions: z.boolean().default(false),
    canManageRewards: z.boolean().default(false),
    canManageGiftCards: z.boolean().default(false),
    canManageWallet: z.boolean().default(false), // Legacy, kept for compatibility
    
    // GST Management
    canManageGST: z.boolean().default(false),
    canSetTaxRates: z.boolean().default(false),
    canManageGSTReports: z.boolean().default(false),
    
    // Marketing & Promotions
    canManagePromotions: z.boolean().default(false),
    canManageCoupons: z.boolean().default(false),
    
    // Financial Management
    canViewFinancials: z.boolean().default(false),
    canManagePaymentSettings: z.boolean().default(false),
    canManageRazorpay: z.boolean().default(false),
    canManageStripe: z.boolean().default(false),
    
    // System Settings
    canAccessSettings: z.boolean().default(false),
    canManageStoreSettings: z.boolean().default(false),
    canManageSystemSettings: z.boolean().default(false),
    canBackupDatabase: z.boolean().default(false)
  })
});

const permissionDisplayNames = {
  // Dashboard
  canAccessDashboard: "Access Dashboard",
  
  // Product Management
  canCreateProducts: "Create Products",
  canEditProducts: "Edit Products",
  canDeleteProducts: "Delete Products",
  canApproveProducts: "Approve Products",
  canManageProductDisplay: "Manage Product Display",
  
  // Category Management
  canCreateCategories: "Create Categories",
  canEditCategories: "Edit Categories",
  canDeleteCategories: "Delete Categories",
  canManageSubcategories: "Manage Subcategories",
  
  // Hero Management
  canManageBanners: "Manage Banners",
  canDesignHero: "Design Hero Section",
  
  // Content Management
  canManageFooter: "Manage Footer",
  canManageDocumentTemplates: "Manage Document Templates",
  canManageMediaLibrary: "Manage Media Library",
  
  // Sales & Analytics
  canViewSales: "View Sales",
  canViewReports: "View Reports",
  canExportReports: "Export Reports",
  canManageAnalytics: "Manage Analytics",
  
  // Seller Management
  canManageSellers: "Manage Sellers",
  canApproveSellers: "Approve Sellers",
  canManageSellerAgreements: "Manage Seller Agreements",
  
  // Order Management
  canViewOrders: "View Orders",
  canManageOrders: "Manage Orders",
  canProcessRefunds: "Process Refunds",
  
  // User Management
  canViewUsers: "View Users",
  canCreateUsers: "Create Users",
  canManageCustomers: "Manage Customers",
  canManageAdmins: "Manage Admins",
  
  // Shipping Management
  canAccessShippingSettings: "Access Shipping Settings",
  canManageShippingGeneral: "Manage General Shipping",
  canManageShiprocket: "Manage Shiprocket Integration",
  canViewShipmentDashboard: "View Shipment Dashboard",
  canManagePendingShipments: "Manage Pending Shipments",
  canManageShippingRates: "Manage Shipping Rates",
  canManageTrackingInfo: "Manage Tracking Information",
  
  // Rewards & Wallet Management
  canAccessWalletDashboard: "Access Wallet Dashboard",
  canManageWalletSettings: "Manage Wallet Settings",
  canViewTransactions: "View Wallet Transactions",
  canManageRewards: "Manage Rewards System",
  canManageGiftCards: "Manage Gift Cards",
  
  // GST Management
  canManageGST: "Manage GST",
  canSetTaxRates: "Set Tax Rates",
  canManageGSTReports: "Manage GST Reports",
  
  // Marketing & Promotions
  canManagePromotions: "Manage Promotions",
  canManageCoupons: "Manage Coupons",
  
  // Financial Management
  canViewFinancials: "View Financials",
  canManagePaymentSettings: "Manage Payment Settings",
  canManageRazorpay: "Manage Razorpay Integration",
  canManageStripe: "Manage Stripe Integration",
  
  // System Settings
  canAccessSettings: "Access Settings",
  canManageStoreSettings: "Manage Store Settings",
  canManageSystemSettings: "Manage System Settings",
  canBackupDatabase: "Backup Database"
};

export default function ManageAdminsPage() {
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
  
  // Use context user if available, otherwise use query user
  const user = authContext?.user || apiUser;
  const authLoading = authContext ? authContext.isLoading : apiLoading;
  
  const { toast } = useToast();
  const {
    coAdmins,
    isLoading: coAdminsLoading,
    createCoAdmin,
    isCreating,
    updatePermissions,
    isUpdating,
    deleteCoAdmin,
    isDeleting
  } = useCoAdmins();
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCoAdmin, setSelectedCoAdmin] = useState<User | null>(null);
  const [editPermissions, setEditPermissions] = useState<CoAdminPermissions>({
    // Dashboard
    canAccessDashboard: true,
    
    // Product Management
    canCreateProducts: false,
    canEditProducts: false,
    canDeleteProducts: false,
    canApproveProducts: false,
    canManageProductDisplay: false,
    
    // Category Management
    canCreateCategories: false,
    canEditCategories: false,
    canDeleteCategories: false,
    canManageSubcategories: false,
    
    // Hero Management
    canManageBanners: false,
    canDesignHero: false,
    
    // Content Management
    canManageFooter: false,
    canManageDocumentTemplates: false,
    canManageMediaLibrary: false,
    
    // Sales & Analytics
    canViewSales: true,
    canViewReports: true,
    canExportReports: false,
    canManageAnalytics: false,
    
    // Seller Management
    canManageSellers: false,
    canApproveSellers: false,
    canManageSellerAgreements: false,
    
    // Order Management
    canViewOrders: false,
    canManageOrders: false,
    canProcessRefunds: false,
    
    // User Management
    canViewUsers: false,
    canCreateUsers: false,
    canManageCustomers: false,
    canManageAdmins: false,
    
    // Shipping Management
    canAccessShippingSettings: false,
    canManageShippingGeneral: false,
    canManageShiprocket: false,
    canViewShipmentDashboard: false,
    canManagePendingShipments: false,
    canManageShippingRates: false,
    canManageTrackingInfo: false,
    
    // Rewards & Wallet Management
    canAccessWalletDashboard: false,
    canManageWalletSettings: false,
    canViewTransactions: false,
    canManageRewards: false,
    canManageGiftCards: false,
    
    // GST Management
    canManageGST: false,
    canSetTaxRates: false,
    canManageGSTReports: false,
    
    // Marketing & Promotions
    canManagePromotions: false,
    canManageCoupons: false,
    
    // Financial Management
    canViewFinancials: false,
    canManagePaymentSettings: false,
    canManageRazorpay: false,
    canManageStripe: false,
    
    // System Settings
    canAccessSettings: false,
    canManageStoreSettings: false,
    canManageSystemSettings: false,
    canBackupDatabase: false
  });
  
  // Redirect if user is not an admin or is a co-admin
  useEffect(() => {
    if (user && (user.role !== "admin" || user.isCoAdmin)) {
      window.location.href = "/";
    }
  }, [user]);
  
  // Create new co-admin form
  const form = useForm<z.infer<typeof createCoAdminSchema>>({
    resolver: zodResolver(createCoAdminSchema),
    defaultValues: {
      username: "",
      email: "",
      permissions: {
        // Dashboard
        canAccessDashboard: true,
        
        // Product Management
        canCreateProducts: false,
        canEditProducts: false,
        canDeleteProducts: false,
        canApproveProducts: false,
        canManageProductDisplay: false,
        
        // Category Management
        canCreateCategories: false,
        canEditCategories: false,
        canDeleteCategories: false,
        canManageSubcategories: false,
        
        // Hero Management
        canManageBanners: false,
        canDesignHero: false,
        
        // Content Management
        canManageFooter: false,
        canManageDocumentTemplates: false,
        canManageMediaLibrary: false,
        
        // Sales & Analytics
        canViewSales: true,
        canViewReports: true,
        canExportReports: false,
        canManageAnalytics: false,
        
        // Seller Management
        canManageSellers: false,
        canApproveSellers: false,
        canManageSellerAgreements: false,
        
        // Order Management
        canViewOrders: false,
        canManageOrders: false,
        canProcessRefunds: false,
        
        // User Management
        canViewUsers: false,
        canCreateUsers: false,
        canManageCustomers: false,
        canManageAdmins: false,
        
        // Shipping Management
        canAccessShippingSettings: false,
        canManageShippingGeneral: false,
        canManageShiprocket: false,
        canViewShipmentDashboard: false,
        canManagePendingShipments: false,
        canManageShippingRates: false,
        canManageTrackingInfo: false,
        
        // Rewards & Wallet Management
        canAccessWalletDashboard: false,
        canManageWalletSettings: false,
        canViewTransactions: false,
        canManageRewards: false,
        canManageGiftCards: false,
        canManageWallet: false, // Legacy, kept for compatibility
        
        // GST Management
        canManageGST: false,
        canSetTaxRates: false,
        canManageGSTReports: false,
        
        // Marketing & Promotions
        canManagePromotions: false,
        canManageCoupons: false,
        
        // Financial Management
        canViewFinancials: false,
        canManagePaymentSettings: false,
        canManageRazorpay: false,
        canManageStripe: false,
        
        // System Settings
        canAccessSettings: false,
        canManageStoreSettings: false,
        canManageSystemSettings: false,
        canBackupDatabase: false
      }
    }
  });
  
  // Handle create form submission
  const onSubmit = (data: z.infer<typeof createCoAdminSchema>) => {
    createCoAdmin(data as CreateCoAdminData, {
      onSuccess: () => {
        setCreateModalOpen(false);
        form.reset();
      }
    });
  };
  
  // Open edit modal with selected co-admin
  const handleEditCoAdmin = (coAdmin: User) => {
    setSelectedCoAdmin(coAdmin);
    
    // Create default permissions object
    const defaultPermissions: CoAdminPermissions = {
      // Dashboard
      canAccessDashboard: true,
      
      // Product Management
      canCreateProducts: false,
      canEditProducts: false,
      canDeleteProducts: false,
      canApproveProducts: false,
      canManageProductDisplay: false,
      
      // Category Management
      canCreateCategories: false,
      canEditCategories: false,
      canDeleteCategories: false,
      canManageSubcategories: false,
      
      // Hero Management
      canManageBanners: false,
      canDesignHero: false,
      
      // Content Management
      canManageFooter: false,
      canManageDocumentTemplates: false,
      canManageMediaLibrary: false,
      
      // Sales & Analytics
      canViewSales: true,
      canViewReports: true,
      canExportReports: false,
      canManageAnalytics: false,
      
      // Seller Management
      canManageSellers: false,
      canApproveSellers: false,
      canManageSellerAgreements: false,
      
      // Order Management
      canViewOrders: false,
      canManageOrders: false,
      canProcessRefunds: false,
      
      // User Management
      canViewUsers: false,
      canCreateUsers: false,
      canManageCustomers: false,
      canManageAdmins: false,
      
      // Shipping Management
      canAccessShippingSettings: false,
      canManageShippingGeneral: false,
      canManageShiprocket: false,
      canViewShipmentDashboard: false,
      canManagePendingShipments: false,
      canManageShippingRates: false,
      canManageTrackingInfo: false,
      
      // Rewards & Wallet Management
      canAccessWalletDashboard: false,
      canManageWalletSettings: false,
      canViewTransactions: false,
      canManageRewards: false,
      canManageGiftCards: false,
      
      // GST Management
      canManageGST: false,
      canSetTaxRates: false,
      canManageGSTReports: false,
      
      // Marketing & Promotions
      canManagePromotions: false,
      canManageCoupons: false,
      
      // Financial Management
      canViewFinancials: false,
      canManagePaymentSettings: false,
      canManageRazorpay: false,
      canManageStripe: false,
      
      // System Settings
      canAccessSettings: false,
      canManageStoreSettings: false,
      canManageSystemSettings: false,
      canBackupDatabase: false
    };
    
    // Merge the default permissions with any existing permissions from the co-admin
    // This ensures that new permissions added to the system are available in the edit form
    const existingPermissions = coAdmin.permissions as CoAdminPermissions || {};
    const mergedPermissions = { ...defaultPermissions, ...existingPermissions };
    
    setEditPermissions(mergedPermissions);
    setEditModalOpen(true);
  };
  
  // Handle edit form submission
  const handleUpdatePermissions = () => {
    if (selectedCoAdmin) {
      updatePermissions({
        id: selectedCoAdmin.id,
        permissions: editPermissions
      }, {
        onSuccess: () => {
          setEditModalOpen(false);
          setSelectedCoAdmin(null);
        }
      });
    }
  };
  
  // Handle co-admin deletion
  const handleDeleteCoAdmin = (id: number) => {
    deleteCoAdmin(id);
  };
  
  if (!user || (user.role !== "admin" || user.isCoAdmin)) {
    return <div>Not authorized</div>;
  }
  
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manage Co-Admins</h1>
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus size={18} />
                <span>Create Co-Admin</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Co-Admin</DialogTitle>
                <DialogDescription>
                  Create a new co-admin account with specific permissions
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="text-sm text-muted-foreground mt-2">
                        <p>Co-admin will use email OTP verification to login</p>
                        <p>No password is required</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4 overflow-y-auto max-h-[500px]">
                      <h3 className="text-lg font-medium mb-3">Permissions</h3>
                      
                      {/* Dashboard */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">Dashboard</h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {["canAccessDashboard"].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Product Management */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">Product Management</h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {["canCreateProducts", "canEditProducts", "canDeleteProducts", "canApproveProducts", "canManageProductDisplay"].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Category Management */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">Category Management</h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {["canCreateCategories", "canEditCategories", "canDeleteCategories", "canManageSubcategories"].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Hero Management */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">Hero Management</h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {["canManageBanners", "canDesignHero"].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Content Management */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">Content Management</h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {["canManageFooter", "canManageDocumentTemplates", "canManageMediaLibrary"].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Sales & Analytics */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">Sales & Analytics</h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {["canViewSales", "canViewReports", "canExportReports", "canManageAnalytics"].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Seller Management */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">Seller Management</h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {["canManageSellers", "canApproveSellers"].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Order Management */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">Order Management</h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {["canViewOrders", "canManageOrders", "canProcessRefunds"].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* User Management */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">User Management</h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {["canViewUsers", "canCreateUsers", "canManageCustomers", "canManageAdmins"].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Shipping Management */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">Shipping Management</h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {[
                            "canAccessShippingSettings", 
                            "canManageShippingGeneral", 
                            "canManageShiprocket",
                            "canViewShipmentDashboard",
                            "canManagePendingShipments",
                            "canManageShippingRates",
                            "canManageTrackingInfo"
                          ].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Marketing & Promotions */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">Marketing & Promotions</h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {["canManagePromotions", "canManageCoupons"].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Financial Management */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">Financial Management</h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {["canViewFinancials", "canManagePaymentSettings", "canManageRazorpay", "canManageStripe"].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Rewards & Wallet Management */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">Rewards & Wallet</h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {["canAccessWalletDashboard", "canManageWalletSettings", "canViewTransactions", "canManageGiftCards"].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* GST Management */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">GST Management</h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {["canManageGST", "canSetTaxRates", "canManageGSTReports"].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* System Settings */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-primary">System Settings</h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {["canAccessSettings", "canManageStoreSettings", "canManageSystemSettings", "canBackupDatabase"].map((key) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`permissions.${key}` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Co-Admin
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Co-Administrators</CardTitle>
            <CardDescription>
              Manage co-admin accounts and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authLoading || coAdminsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !coAdmins || coAdmins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No co-admins found</p>
                <p className="text-sm mt-1">Create a co-admin to delegate administration tasks</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coAdmins.map((coAdmin) => (
                    <TableRow key={coAdmin.id}>
                      <TableCell className="font-medium">{coAdmin.username}</TableCell>
                      <TableCell>{coAdmin.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {coAdmin.permissions && typeof coAdmin.permissions === 'object' && 
                            Object.entries(coAdmin.permissions as Record<string, boolean>)
                              .filter(([_, value]) => Boolean(value))
                              .map(([key, _]) => (
                                <span key={key} className="text-xs bg-muted px-2 py-1 rounded-full">
                                  {permissionDisplayNames[key as keyof typeof permissionDisplayNames] || key}
                                </span>
                              ))
                          }
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCoAdmin(coAdmin)}
                            disabled={isUpdating}
                          >
                            <Edit size={16} className="mr-1" />
                            Edit
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={isDeleting}>
                                <Trash2 size={16} className="mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the co-admin account.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCoAdmin(coAdmin.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Edit Permissions Dialog */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Co-Admin Permissions</DialogTitle>
              <DialogDescription>
                {selectedCoAdmin && `Update permissions for ${selectedCoAdmin.username}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 my-4">
              <div className="border rounded-md p-4 overflow-y-auto max-h-[400px]">
                <h3 className="text-lg font-medium mb-3">Permissions</h3>
                
                {/* Product Management */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-primary">Product Management</h4>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {["canCreateProducts", "canEditProducts", "canDeleteProducts", "canApproveProducts"].map((key) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label htmlFor={`edit-${key}`} className="text-sm">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</Label>
                        <Switch
                          id={`edit-${key}`}
                          checked={editPermissions[key as keyof CoAdminPermissions] || false}
                          onCheckedChange={(checked) => {
                            setEditPermissions({
                              ...editPermissions,
                              [key]: checked
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Category Management */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-primary">Category Management</h4>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {["canCreateCategories", "canEditCategories", "canDeleteCategories"].map((key) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label htmlFor={`edit-${key}`} className="text-sm">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</Label>
                        <Switch
                          id={`edit-${key}`}
                          checked={editPermissions[key as keyof CoAdminPermissions] || false}
                          onCheckedChange={(checked) => {
                            setEditPermissions({
                              ...editPermissions,
                              [key]: checked
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Content Management */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-primary">Content Management</h4>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {["canManageFooter", "canManageDocumentTemplates", "canManageMediaLibrary"].map((key) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label htmlFor={`edit-${key}`} className="text-sm">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</Label>
                        <Switch
                          id={`edit-${key}`}
                          checked={editPermissions[key as keyof CoAdminPermissions] || false}
                          onCheckedChange={(checked) => {
                            setEditPermissions({
                              ...editPermissions,
                              [key]: checked
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Sales & Analytics */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-primary">Sales & Analytics</h4>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {["canViewSales", "canViewReports", "canExportReports", "canManageAnalytics"].map((key) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label htmlFor={`edit-${key}`} className="text-sm">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</Label>
                        <Switch
                          id={`edit-${key}`}
                          checked={editPermissions[key as keyof CoAdminPermissions] || false}
                          onCheckedChange={(checked) => {
                            setEditPermissions({
                              ...editPermissions,
                              [key]: checked
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Seller Management */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-primary">Seller Management</h4>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {["canManageSellers", "canApproveSellers"].map((key) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label htmlFor={`edit-${key}`} className="text-sm">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</Label>
                        <Switch
                          id={`edit-${key}`}
                          checked={editPermissions[key as keyof CoAdminPermissions] || false}
                          onCheckedChange={(checked) => {
                            setEditPermissions({
                              ...editPermissions,
                              [key]: checked
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Order Management */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-primary">Order Management</h4>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {["canViewOrders", "canManageOrders", "canProcessRefunds"].map((key) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label htmlFor={`edit-${key}`} className="text-sm">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</Label>
                        <Switch
                          id={`edit-${key}`}
                          checked={editPermissions[key as keyof CoAdminPermissions] || false}
                          onCheckedChange={(checked) => {
                            setEditPermissions({
                              ...editPermissions,
                              [key]: checked
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* User Management */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-primary">User Management</h4>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {["canViewCustomers", "canManageCustomers"].map((key) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label htmlFor={`edit-${key}`} className="text-sm">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</Label>
                        <Switch
                          id={`edit-${key}`}
                          checked={editPermissions[key as keyof CoAdminPermissions] || false}
                          onCheckedChange={(checked) => {
                            setEditPermissions({
                              ...editPermissions,
                              [key]: checked
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Shipping Management */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-primary">Shipping Management</h4>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {["canAccessShippingSettings", "canManageShippingGeneral", "canManageShiprocket", "canViewShipmentDashboard", "canManagePendingShipments", "canManageShippingRates", "canManageTrackingInfo"].map((key) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label htmlFor={`edit-${key}`} className="text-sm">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</Label>
                        <Switch
                          id={`edit-${key}`}
                          checked={editPermissions[key as keyof CoAdminPermissions] || false}
                          onCheckedChange={(checked) => {
                            setEditPermissions({
                              ...editPermissions,
                              [key]: checked
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Marketing & Promotions */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-primary">Marketing & Promotions</h4>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {["canManagePromotions", "canManageCoupons"].map((key) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label htmlFor={`edit-${key}`} className="text-sm">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</Label>
                        <Switch
                          id={`edit-${key}`}
                          checked={editPermissions[key as keyof CoAdminPermissions] || false}
                          onCheckedChange={(checked) => {
                            setEditPermissions({
                              ...editPermissions,
                              [key]: checked
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Rewards & Wallet Management */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-primary">Rewards & Wallet Management</h4>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {["canAccessWalletDashboard", "canManageWalletSettings", "canViewTransactions", "canManageRewards", "canManageGiftCards"].map((key) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label htmlFor={`edit-${key}`} className="text-sm">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</Label>
                        <Switch
                          id={`edit-${key}`}
                          checked={editPermissions[key as keyof CoAdminPermissions] || false}
                          onCheckedChange={(checked) => {
                            setEditPermissions({
                              ...editPermissions,
                              [key]: checked
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* GST Management */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-primary">GST Management</h4>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {["canManageGST", "canSetTaxRates", "canManageGSTReports"].map((key) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label htmlFor={`edit-${key}`} className="text-sm">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</Label>
                        <Switch
                          id={`edit-${key}`}
                          checked={editPermissions[key as keyof CoAdminPermissions] || false}
                          onCheckedChange={(checked) => {
                            setEditPermissions({
                              ...editPermissions,
                              [key]: checked
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Management */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-primary">Financial Management</h4>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {["canViewFinancials", "canManagePaymentSettings", "canManageRazorpay", "canManageStripe"].map((key) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label htmlFor={`edit-${key}`} className="text-sm">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</Label>
                        <Switch
                          id={`edit-${key}`}
                          checked={editPermissions[key as keyof CoAdminPermissions] || false}
                          onCheckedChange={(checked) => {
                            setEditPermissions({
                              ...editPermissions,
                              [key]: checked
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* System Settings */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-primary">System Settings</h4>
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {["canAccessSettings", "canManageStoreSettings", "canManageSystemSettings", "canBackupDatabase"].map((key) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label htmlFor={`edit-${key}`} className="text-sm">{permissionDisplayNames[key as keyof typeof permissionDisplayNames]}</Label>
                        <Switch
                          id={`edit-${key}`}
                          checked={editPermissions[key as keyof CoAdminPermissions] || false}
                          onCheckedChange={(checked) => {
                            setEditPermissions({
                              ...editPermissions,
                              [key]: checked
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedCoAdmin(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdatePermissions} disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}