import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "wouter";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Pagination } from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Layers,
  Search,
  Plus,
  Filter,
  Edit,
  FileEdit,
  Trash,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product as SchemaProduct } from "@shared/schema";
import ApprovalCheck from "@/components/ui/approval-check";

export default function SellerDraftProductsPage() {
  // ... existing code ...

  return (
    <SellerDashboardLayout>
      <ApprovalCheck>
        <div className="space-y-6">{/* Rest of the existing JSX */}</div>
      </ApprovalCheck>
    </SellerDashboardLayout>
  );
}
