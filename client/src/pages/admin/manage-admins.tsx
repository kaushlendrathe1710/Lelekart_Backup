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
    canCreateProducts: z.boolean().default(false),
    canEditProducts: z.boolean().default(false),
    canDeleteProducts: z.boolean().default(false),
    canApproveProducts: z.boolean().default(false),
    canCreateCategories: z.boolean().default(false),
    canEditCategories: z.boolean().default(false),
    canDeleteCategories: z.boolean().default(false),
    canManageBanners: z.boolean().default(false),
    canManageFooter: z.boolean().default(false),
    canViewSales: z.boolean().default(true),
    canViewReports: z.boolean().default(true),
    canManageSellers: z.boolean().default(false),
    canApproveSellers: z.boolean().default(false)
  })
});

const permissionDisplayNames = {
  canCreateProducts: "Create Products",
  canEditProducts: "Edit Products",
  canDeleteProducts: "Delete Products",
  canApproveProducts: "Approve Products",
  canCreateCategories: "Create Categories",
  canEditCategories: "Edit Categories",
  canDeleteCategories: "Delete Categories",
  canManageBanners: "Manage Banners",
  canManageFooter: "Manage Footer",
  canViewSales: "View Sales",
  canViewReports: "View Reports",
  canManageSellers: "Manage Sellers",
  canApproveSellers: "Approve Sellers"
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
    canCreateProducts: false,
    canEditProducts: false,
    canDeleteProducts: false,
    canApproveProducts: false,
    canCreateCategories: false,
    canEditCategories: false,
    canDeleteCategories: false,
    canManageBanners: false,
    canManageFooter: false,
    canViewSales: true,
    canViewReports: true,
    canManageSellers: false,
    canApproveSellers: false
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
        canCreateProducts: false,
        canEditProducts: false,
        canDeleteProducts: false,
        canApproveProducts: false,
        canCreateCategories: false,
        canEditCategories: false,
        canDeleteCategories: false,
        canManageBanners: false,
        canManageFooter: false,
        canViewSales: true,
        canViewReports: true,
        canManageSellers: false,
        canApproveSellers: false
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
    
    // Set the permissions from the co-admin object or default if not available
    const permissions = coAdmin.permissions as CoAdminPermissions || {
      canCreateProducts: false,
      canEditProducts: false,
      canDeleteProducts: false,
      canApproveProducts: false,
      canCreateCategories: false,
      canEditCategories: false,
      canDeleteCategories: false,
      canManageBanners: false,
      canManageFooter: false,
      canViewSales: true,
      canViewReports: true,
      canManageSellers: false,
      canApproveSellers: false
    };
    
    setEditPermissions(permissions);
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
                    
                    <div className="border rounded-md p-4">
                      <h3 className="text-lg font-medium mb-3">Permissions</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(permissionDisplayNames).map(([key, label]) => (
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
                                <FormLabel className="text-sm font-normal">{label}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
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
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-3">Permissions</h3>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(permissionDisplayNames).map(([key, label]) => (
                    <div key={key} className="flex justify-between items-center">
                      <Label htmlFor={key} className="text-sm">{label}</Label>
                      <Switch
                        id={key}
                        checked={editPermissions[key as keyof CoAdminPermissions]}
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