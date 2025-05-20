import { useLocation } from 'wouter';
import AddProductForm from './add-product-form';

interface ProductVariant {
  id?: number;
  sku: string;
  color?: string;
  size?: string;
  price: number;
  mrp?: number;
  stock: number;
  images: string[];
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  mrp?: number;
  purchasePrice?: number;
  brand?: string;
  category: string;
  gstRate?: number;
  stock: number;
  sku?: string;
  images: string[];
  specifications?: string;
  warranty?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  color?: string;
  size?: string;
  variants?: ProductVariant[];
  isDraft?: boolean;
  approved?: boolean;
}

interface EditProductFormProps {
  product: Product;
  redirectTo?: string; // Where to redirect after successful update
}

/**
 * Edit Product Form Component
 * 
 * This is a wrapper around AddProductForm that passes the product data as initialValues.
 * Since AddProductForm can handle both creating and editing products, this component
 * simply prepares the proper initial values and passes them to AddProductForm.
 */
export default function EditProductForm({ 
  product,
  redirectTo = "/admin/products"
}: EditProductFormProps) {
  return (
    <AddProductForm
      initialValues={product}
      redirectTo={redirectTo}
    />
  );
}