import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Plus,
  Trash2,
  Download,
  FileText,
  Loader2,
  Building2,
  Check,
  ChevronsUpDown,
  Eye,
  Truck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  price: number;
  gstRate: number;
  mrp: number;
  allowPieces?: boolean;
  allowSets?: boolean;
  piecesPerSet?: number;
}

interface Distributor {
  id: number;
  companyName: string;
  businessType: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  gstNumber?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface InvoiceItem {
  productId: number;
  productName: string;
  quantity: number;
  orderType: "pieces" | "sets";
}

interface CustomInvoiceFormData {
  distributorId: string;
  items: InvoiceItem[];
  deliveryCharges: number;
  deliveryChargesGstRate: number;
  cashHandlingFees?: number;
  discount?: number;
}

export function CustomInvoiceForm() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [bulkItems, setBulkItems] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingDistributors, setLoadingDistributors] = useState(true);
  const [distributorOpen, setDistributorOpen] = useState(false);
  const [productOpen, setProductOpen] = useState<{ [key: number]: boolean }>(
    {}
  );

  // Helper function to get available order types for a product
  const getAvailableOrderTypes = (productId: number): ("pieces" | "sets")[] => {
    const bulkItem = bulkItems.find((item) => item.productId === productId);
    if (!bulkItem) return [];

    const types: ("pieces" | "sets")[] = [];
    if (bulkItem.allowPieces) types.push("pieces");
    if (bulkItem.allowSets) types.push("sets");
    return types;
  };

  // Helper function to get bulk item info
  const getBulkItemInfo = (productId: number) => {
    return bulkItems.find((item) => item.productId === productId);
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomInvoiceFormData>({
    defaultValues: {
      distributorId: "",
      items: [
        {
          productId: 0,
          productName: "",
          quantity: 1,
          orderType: "pieces",
        },
      ],
      deliveryCharges: 0,
      deliveryChargesGstRate: 18,
      cashHandlingFees: undefined,
      discount: undefined,
    },
  });

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch only bulk-eligible products (products configured in bulk items)
        const res = await fetch("/api/bulk-items");
        if (res.ok) {
          const data = await res.json();
          // Store full bulk items data
          setBulkItems(data || []);
          // Map bulk items to product format expected by the form
          const bulkProducts = data.map((item: any) => ({
            id: item.productId,
            name: item.productName,
            price: parseFloat(item.sellingPrice || item.productPrice),
            gstRate: 0, // GST rate will be fetched from product details when needed
            mrp: parseFloat(item.productPrice),
            allowPieces: item.allowPieces,
            allowSets: item.allowSets,
            piecesPerSet: item.piecesPerSet,
          }));
          setProducts(bulkProducts || []);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        });
      } finally {
        setLoadingProducts(false);
      }
    };

    const fetchDistributors = async () => {
      try {
        const res = await fetch("/api/distributors");
        if (res.ok) {
          const data = await res.json();
          setDistributors(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch distributors:", error);
        toast({
          title: "Error",
          description: "Failed to load distributors",
          variant: "destructive",
        });
      } finally {
        setLoadingDistributors(false);
      }
    };

    fetchProducts();
    fetchDistributors();
  }, [toast]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === parseInt(productId));
    if (product) {
      setValue(`items.${index}.productId`, product.id);
      setValue(`items.${index}.productName`, product.name);
      setProductOpen({ ...productOpen, [index]: false });
    }
  };

  const getSelectedDistributorText = () => {
    const distributorId = watch("distributorId");
    if (!distributorId) return "Choose a distributor";
    const dist = distributors.find((d) => d.id.toString() === distributorId);
    return dist
      ? `${dist.companyName} - ${dist.userName}`
      : "Choose a distributor";
  };

  const getSelectedProductText = (index: number) => {
    const productId = items[index]?.productId;
    if (!productId) return "Select a product";
    const product = products.find((p) => p.id === productId);
    return product ? `${product.name} - ₹${product.price}` : "Select a product";
  };

  const handlePreview = async (data: CustomInvoiceFormData) => {
    setIsPreviewing(true);

    try {
      // Find selected distributor
      const distributor = distributors.find(
        (d) => d.id.toString() === data.distributorId
      );

      if (!distributor) {
        throw new Error("Distributor not found");
      }

      // Prepare invoice data for preview
      const invoiceData = {
        distributor: {
          id: distributor.id,
          companyName: distributor.companyName,
          name: distributor.userName,
          email: distributor.userEmail,
          phone: distributor.userPhone,
          gstNumber: distributor.gstNumber || "N/A",
          address: distributor.address,
          city: distributor.city,
          state: distributor.state,
          pincode: distributor.pincode,
        },
        items: data.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          orderType: item.orderType,
        })),
        deliveryCharges: data.deliveryCharges || 0,
        deliveryChargesGstRate: data.deliveryChargesGstRate || 18,
        cashHandlingFees: data.cashHandlingFees || undefined,
        discount: data.discount || undefined,
      };

      // Call preview endpoint
      const response = await fetch("/api/invoices/preview-custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate preview");
      }

      const html = await response.text();
      setPreviewHtml(html);
      setPreviewData(invoiceData);
      setShowPreview(true);

      toast({
        title: "Preview Ready",
        description: "Review your invoice before generating the PDF.",
      });
    } catch (error) {
      console.error("Error generating preview:", error);
      toast({
        title: "Preview Failed",
        description: "Failed to generate the preview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleGenerateFromPreview = async () => {
    if (!previewData) return;

    setIsGenerating(true);
    setShowPreview(false);

    try {
      toast({
        title: "Generating Invoice",
        description: "Creating order and generating PDF...",
      });

      // Send request to generate invoice PDF (this will create the order first)
      const response = await fetch("/api/invoices/generate-custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(previewData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate invoice");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "invoice.pdf";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Invoice Generated!",
        description: "Your custom invoice has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate the invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: CustomInvoiceFormData) => {
    // When form is submitted, show the preview first
    await handlePreview(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Distributor Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="distributorId">Select Distributor *</Label>
            {loadingDistributors ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Loading distributors...
                </span>
              </div>
            ) : (
              <Popover open={distributorOpen} onOpenChange={setDistributorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={distributorOpen}
                    className="w-full justify-between font-normal"
                  >
                    {getSelectedDistributorText()}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search distributors..." />
                    <CommandList>
                      <CommandEmpty>
                        {distributors.length === 0
                          ? "No distributors found"
                          : "No results found"}
                      </CommandEmpty>
                      <CommandGroup>
                        {distributors.map((dist) => (
                          <CommandItem
                            key={dist.id}
                            value={`${dist.companyName} ${dist.userName}`}
                            onSelect={() => {
                              setValue("distributorId", dist.id.toString());
                              setDistributorOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                watch("distributorId") === dist.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {dist.companyName} - {dist.userName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            {errors.distributorId && (
              <p className="text-sm text-red-500">Distributor is required</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Items
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-2 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Item {index + 1}</h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor={`items.${index}.productId`}>Product *</Label>
                  {loadingProducts ? (
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                      disabled
                    >
                      Loading products...
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    </Button>
                  ) : (
                    <Popover
                      open={productOpen[index] || false}
                      onOpenChange={(open) =>
                        setProductOpen({ ...productOpen, [index]: open })
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={productOpen[index] || false}
                          className="w-full justify-between font-normal"
                        >
                          {getSelectedProductText(index)}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search products..." />
                          <CommandList>
                            <CommandEmpty>No products found</CommandEmpty>
                            <CommandGroup>
                              {products.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={`${product.name} ${product.price}`}
                                  onSelect={() =>
                                    handleProductSelect(
                                      index,
                                      product.id.toString(),
                                    )
                                  }
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      items[index]?.productId === product.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  {product.name} - ₹{product.price}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                  {errors.items?.[index]?.productId && (
                    <p className="text-sm text-red-500">Product is required</p>
                  )}
                  {/* Hidden field for productName */}
                  <input
                    type="hidden"
                    {...register(`items.${index}.productName`)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.orderType`}>
                    Order Type *
                  </Label>
                  <select
                    id={`items.${index}.orderType`}
                    {...register(`items.${index}.orderType`)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={
                      !items[index]?.productId ||
                      getAvailableOrderTypes(items[index]?.productId || 0)
                        .length === 0
                    }
                  >
                    {!items[index]?.productId && (
                      <option value="">Select product first</option>
                    )}
                    {items[index]?.productId &&
                      (() => {
                        const availableTypes = getAvailableOrderTypes(
                          items[index].productId,
                        );
                        const bulkItem = getBulkItemInfo(
                          items[index].productId,
                        );
                        return (
                          <>
                            {availableTypes.includes("pieces") && (
                              <option value="pieces">Pieces</option>
                            )}
                            {availableTypes.includes("sets") && (
                              <option value="sets">
                                Sets
                                {bulkItem?.piecesPerSet
                                  ? ` (${bulkItem.piecesPerSet} pcs/set)`
                                  : ""}
                              </option>
                            )}
                            {availableTypes.length === 0 && (
                              <option value="">No order types available</option>
                            )}
                          </>
                        );
                      })()}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.quantity`}>Quantity *</Label>
                  <Input
                    id={`items.${index}.quantity`}
                    type="number"
                    min="1"
                    {...register(`items.${index}.quantity`, {
                      required: "Quantity is required",
                      min: { value: 1, message: "Minimum quantity is 1" },
                      valueAsNumber: true,
                    })}
                    placeholder="1"
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="text-sm text-red-500">
                      {errors.items[index]?.quantity?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                productId: 0,
                productName: "",
                quantity: 1,
                orderType: "pieces",
              })
            }
            disabled={loadingProducts}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery Charges & Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryCharges">
                Delivery Charges (Inclusive of GST)
              </Label>
              <Input
                id="deliveryCharges"
                type="number"
                min="0"
                step="0.01"
                {...register("deliveryCharges", {
                  valueAsNumber: true,
                })}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Enter the total delivery amount including GST
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryChargesGstRate">
                Delivery GST Rate (%)
              </Label>
              <Input
                id="deliveryChargesGstRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...register("deliveryChargesGstRate", {
                  valueAsNumber: true,
                })}
                placeholder="18"
              />
              <p className="text-xs text-muted-foreground">
                GST rate as a percentage (e.g., 5, 12, 18)
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cashHandlingFees">
                Cash Handling Fees (Optional)
              </Label>
              <Input
                id="cashHandlingFees"
                type="number"
                min="0"
                step="0.01"
                {...register("cashHandlingFees", {
                  valueAsNumber: true,
                })}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                If provided, payment type will be set to COD. Leave empty for
                Prepaid orders.
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="discount">Discount (Optional)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                step="0.01"
                {...register("discount", {
                  valueAsNumber: true,
                })}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Discount amount to be deducted from the total.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={isPreviewing || loadingProducts}
        >
          {isPreviewing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Preview...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Preview Invoice
            </>
          )}
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              Review your invoice before generating the PDF. Order ID and
              Invoice Number will be automatically created upon generation.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto border rounded-lg p-4 bg-white">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateFromPreview} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate & Download PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
