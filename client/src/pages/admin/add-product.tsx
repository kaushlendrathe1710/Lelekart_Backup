import { useLocation } from 'wouter';
import AdminLayout from '@/components/layout/admin-layout';
import AddProductForm from '@/components/product/add-product-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Admin Add Product Page
 * 
 * This page provides an interface for adding new products in the admin panel.
 * It uses the AddProductForm component which handles form submission.
 */
export default function AdminAddProductPage() {
  const [, navigate] = useLocation();
  
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              className="gap-1" 
              onClick={() => navigate('/admin/products')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Add New Product</CardTitle>
              <CardDescription>
                Create a new product with detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddProductForm redirectTo="/admin/products" />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}