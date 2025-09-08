import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  CalendarDays,
  CreditCard,
  User,
  Building2,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  Search,
} from "lucide-react";

interface SellerWithdrawal {
  id: number;
  sellerId: number;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  paymentDate: string | null;
  referenceId: string | null;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  seller?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  sellerSettings?: {
    taxInformation: string;
    personalInfo: string;
    address: string;
  };
}

interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
}

export default function SellerWithdrawalsPage() {
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<SellerWithdrawal | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const queryClient = useQueryClient();

  // Fetch seller withdrawal requests
  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ["/api/admin/seller-withdrawals"],
    queryFn: async () => {
      const response = await fetch("/api/admin/seller-withdrawals");
      if (!response.ok) {
        throw new Error("Failed to fetch withdrawal requests");
      }
      return response.json();
    },
  });

  // Update withdrawal status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      referenceId,
      notes,
    }: {
      id: number;
      status: string;
      referenceId?: string;
      notes?: string;
    }) => {
      const response = await fetch(
        `/api/admin/seller-withdrawals/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, referenceId, notes }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update withdrawal status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/seller-withdrawals"],
      });
      toast({
        title: "Status Updated",
        description: "Withdrawal status updated successfully",
      });
      setSelectedWithdrawal(null);
      setReferenceId("");
      setAdminNotes("");
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (status: string) => {
    if (!selectedWithdrawal) return;

    setIsProcessing(true);
    updateStatusMutation.mutate({
      id: selectedWithdrawal.id,
      status,
      referenceId: referenceId || undefined,
      notes: adminNotes || undefined,
    });
    setIsProcessing(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      processing: { color: "bg-blue-100 text-blue-800", icon: Clock },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      failed: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const parseBankDetails = (taxInformation: string): BankDetails | null => {
    try {
      const parsed = JSON.parse(taxInformation);
      return parsed.bankInfo || null;
    } catch {
      return null;
    }
  };

  const parsePersonalInfo = (personalInfo: string) => {
    try {
      return JSON.parse(personalInfo);
    } catch {
      return null;
    }
  };

  const parseAddress = (address: string) => {
    try {
      return JSON.parse(address);
    } catch {
      return null;
    }
  };

  const filteredWithdrawals = withdrawals?.filter(
    (withdrawal: SellerWithdrawal) => {
      const matchesStatus =
        statusFilter === "all" || withdrawal.status === statusFilter;
      const matchesSearch =
        searchTerm === "" ||
        withdrawal.seller?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        withdrawal.seller?.email
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        withdrawal.id.toString().includes(searchTerm);

      return matchesStatus && matchesSearch;
    }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Seller Withdrawal Requests</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by seller name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredWithdrawals?.map((withdrawal) => {
            const bankDetails = withdrawal.sellerSettings?.taxInformation
              ? parseBankDetails(withdrawal.sellerSettings.taxInformation)
              : null;
            const personalInfo = withdrawal.sellerSettings?.personalInfo
              ? parsePersonalInfo(withdrawal.sellerSettings.personalInfo)
              : null;
            const address = withdrawal.sellerSettings?.address
              ? parseAddress(withdrawal.sellerSettings.address)
              : null;

            return (
              <Card
                key={withdrawal.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {withdrawal.seller?.name || "Unknown Seller"}
                        </h3>
                        <p className="text-gray-600">
                          {withdrawal.seller?.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          Request #{withdrawal.id} •{" "}
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ₹{Math.abs(withdrawal.amount).toLocaleString()}
                        </p>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWithdrawal(withdrawal)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Withdrawal Request Details
                            </DialogTitle>
                          </DialogHeader>

                          <div className="space-y-6">
                            {/* Seller Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center">
                                    <User className="w-5 h-5 mr-2" />
                                    Seller Information
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Name
                                    </Label>
                                    <p className="text-sm">
                                      {withdrawal.seller?.name || "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Email
                                    </Label>
                                    <p className="text-sm">
                                      {withdrawal.seller?.email || "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Phone
                                    </Label>
                                    <p className="text-sm">
                                      {withdrawal.seller?.phone || "N/A"}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center">
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    Bank Details
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  {bankDetails ? (
                                    <>
                                      <div>
                                        <Label className="text-sm font-medium">
                                          Account Holder
                                        </Label>
                                        <p className="text-sm">
                                          {bankDetails.accountHolderName}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">
                                          Account Number
                                        </Label>
                                        <p className="text-sm font-mono">
                                          {bankDetails.accountNumber}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">
                                          Bank Name
                                        </Label>
                                        <p className="text-sm">
                                          {bankDetails.bankName}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">
                                          IFSC Code
                                        </Label>
                                        <p className="text-sm font-mono">
                                          {bankDetails.ifscCode}
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <p className="text-sm text-gray-500">
                                      Bank details not provided
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            </div>

                            {/* Address Information */}
                            {address && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center">
                                    <MapPin className="w-5 h-5 mr-2" />
                                    Address
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm">
                                    {address.address || "N/A"}
                                  </p>
                                  <p className="text-sm">
                                    {address.city}, {address.state}{" "}
                                    {address.pincode}
                                  </p>
                                </CardContent>
                              </Card>
                            )}

                            {/* Withdrawal Details */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center">
                                  <Building2 className="w-5 h-5 mr-2" />
                                  Withdrawal Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Amount
                                    </Label>
                                    <p className="text-lg font-semibold text-green-600">
                                      ₹
                                      {Math.abs(
                                        withdrawal.amount
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Status
                                    </Label>
                                    <div className="mt-1">
                                      {getStatusBadge(withdrawal.status)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Request Date
                                    </Label>
                                    <p className="text-sm">
                                      {new Date(
                                        withdrawal.createdAt
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Payment Method
                                    </Label>
                                    <p className="text-sm">
                                      {withdrawal.paymentMethod || "N/A"}
                                    </p>
                                  </div>
                                </div>
                                {withdrawal.notes && (
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Seller Notes
                                    </Label>
                                    <p className="text-sm bg-gray-50 p-2 rounded">
                                      {withdrawal.notes}
                                    </p>
                                  </div>
                                )}
                                {withdrawal.referenceId && (
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Reference ID
                                    </Label>
                                    <p className="text-sm font-mono">
                                      {withdrawal.referenceId}
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* Admin Actions */}
                            {withdrawal.status === "pending" && (
                              <Card>
                                <CardHeader>
                                  <CardTitle>Admin Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div>
                                    <Label htmlFor="referenceId">
                                      Reference ID (Optional)
                                    </Label>
                                    <Input
                                      id="referenceId"
                                      value={referenceId}
                                      onChange={(e) =>
                                        setReferenceId(e.target.value)
                                      }
                                      placeholder="Enter bank reference or transaction ID"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="adminNotes">
                                      Admin Notes (Optional)
                                    </Label>
                                    <Textarea
                                      id="adminNotes"
                                      value={adminNotes}
                                      onChange={(e) =>
                                        setAdminNotes(e.target.value)
                                      }
                                      placeholder="Add any notes about this withdrawal"
                                      rows={3}
                                    />
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button
                                      onClick={() =>
                                        handleStatusUpdate("processing")
                                      }
                                      disabled={isProcessing}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      Mark as Processing
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleStatusUpdate("completed")
                                      }
                                      disabled={isProcessing}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      Mark as Completed
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleStatusUpdate("failed")
                                      }
                                      disabled={isProcessing}
                                      variant="destructive"
                                    >
                                      Mark as Failed
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredWithdrawals?.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No withdrawal requests found
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "No sellers have requested withdrawals yet."}
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
