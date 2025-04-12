import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { 
  Layers, 
  Search, 
  Plus, 
  Filter, 
  Edit,
  Trash,
  Upload,
  Download,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function SellerProductsPage() {
  // Try to use context first if available
  const authContext = useContext(AuthContext);
  
  // Get user data from direct API if context is not available
  const { data: apiUser } = useQuery<any>({
    queryKey: ['/api/user'],
    enabled: !authContext?.user,
  });
  
  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;
  
  // Mock product data for the UI
  const products = [
    {
      id: 1,
      name: "Smartphone X",
      sku: "SP-001",
      price: 15999,
      stock: 24,
      category: "Electronics",
      approved: true,
      image: "https://placehold.co/100x100"
    },
    {
      id: 2,
      name: "Wireless Headphones",
      sku: "WH-002",
      price: 2499,
      stock: 45,
      category: "Electronics",
      approved: true,
      image: "https://placehold.co/100x100"
    },
    {
      id: 3,
      name: "Smart Watch Pro",
      sku: "SW-003",
      price: 4999,
      stock: 18,
      category: "Electronics",
      approved: false,
      image: "https://placehold.co/100x100"
    },
    {
      id: 4,
      name: "Laptop Sleeve 15.6",
      sku: "LS-004",
      price: 899,
      stock: 60,
      category: "Accessories",
      approved: true,
      image: "https://placehold.co/100x100"
    },
    {
      id: 5,
      name: "Wireless Mouse",
      sku: "WM-005",
      price: 799,
      stock: 32,
      category: "Accessories",
      approved: true, 
      image: "https://placehold.co/100x100"
    }
  ];
  
  return (
    <SellerDashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Product Management</h1>
            <p className="text-muted-foreground">Manage your product listings</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              asChild
            >
              <Link href="/seller/products/bulk-upload">
                <Upload className="h-4 w-4" />
                Bulk Upload
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button 
              className="flex items-center gap-2"
              asChild
            >
              <Link href="/seller/products/add">
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>
              You have {products.length} products in your inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-8" />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-10 h-10 rounded-md object-cover" 
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>₹{product.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={product.stock < 20 ? "text-red-500 font-medium" : ""}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        {product.approved ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t pt-6">
            <div className="text-sm text-muted-foreground">
              Showing <strong>1-{products.length}</strong> of <strong>{products.length}</strong> products
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </SellerDashboardLayout>
  );
}