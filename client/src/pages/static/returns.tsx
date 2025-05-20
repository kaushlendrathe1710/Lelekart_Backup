import React from 'react';
import { StaticPageTemplate, StaticPageSection } from '@/components/static-page-template';
import { 
  Card, 
  CardContent,
} from '@/components/ui/card';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle,
  PackageOpen,
  ArrowLeftRight,
  Clock,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function ReturnsPage() {
  return (
    <StaticPageTemplate 
      title="Cancellation & Returns" 
      subtitle="Understanding our return, refund, and cancellation policies"
    >
      <StaticPageSection 
        section="returns_page"
        titleFilter="Returns Intro" 
        defaultContent={
          <div className="mb-8 text-gray-700">
            <p className="text-lg">
              At Lelekart, we want you to be completely satisfied with your purchase. 
              If you're not happy with your order for any reason, we offer easy returns 
              and refunds as part of our customer satisfaction commitment.
            </p>
          </div>
        }
      />
      
      {/* Return Policy Overview */}
      <Tabs defaultValue="returns" className="w-full mb-10">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="returns" className="flex items-center gap-1">
            <RefreshCw size={16} />
            <span>Returns</span>
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-1">
            <CreditCard size={16} />
            <span>Refunds</span>
          </TabsTrigger>
          <TabsTrigger value="cancellations" className="flex items-center gap-1">
            <Clock size={16} />
            <span>Cancellations</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Returns Tab */}
        <TabsContent value="returns">
          <StaticPageSection 
            section="returns_page"
            titleFilter="Returns Policy" 
            defaultContent={
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#2874f0] flex items-center gap-2">
                  <RefreshCw size={20} />
                  Return Policy
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-[#efefef]">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-3">Return Window</h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <div className="min-w-9 flex items-center justify-center">
                            <div className="w-8 h-8 bg-[#2874f0]/10 rounded-full flex items-center justify-center">
                              <span className="text-[#2874f0] font-medium">7</span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-sm">Electronics</p>
                            <p className="text-sm text-gray-600">7 days from delivery</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="min-w-9 flex items-center justify-center">
                            <div className="w-8 h-8 bg-[#2874f0]/10 rounded-full flex items-center justify-center">
                              <span className="text-[#2874f0] font-medium">10</span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-sm">Fashion & Lifestyle</p>
                            <p className="text-sm text-gray-600">10 days from delivery</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="min-w-9 flex items-center justify-center">
                            <div className="w-8 h-8 bg-[#2874f0]/10 rounded-full flex items-center justify-center">
                              <span className="text-[#2874f0] font-medium">7</span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-sm">Home & Furniture</p>
                            <p className="text-sm text-gray-600">7 days from delivery</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-[#efefef]">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-3">Return Conditions</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">Unused and unworn condition</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">Original packaging and tags intact</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">All accessories and freebies included</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">Original invoice available</span>
                        </li>
                        <li className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">Products marked as non-returnable cannot be returned</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-[#efefef]">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-3">Non-Returnable Items</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">Personal care items (cosmetics, grooming products)</span>
                        </li>
                        <li className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">Innerwear, lingerie, and swimwear</span>
                        </li>
                        <li className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">Customized or personalized products</span>
                        </li>
                        <li className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">Grocery and perishable items</span>
                        </li>
                        <li className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">Products with tampered seal or packaging</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Return Process */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Return Process</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#2874f0]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-[#2874f0]">1</span>
                      </div>
                      <h4 className="font-medium mb-1">Initiate Return</h4>
                      <p className="text-sm text-gray-600">Log in to your account and go to "My Orders" to request a return</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#2874f0]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-[#2874f0]">2</span>
                      </div>
                      <h4 className="font-medium mb-1">Package Item</h4>
                      <p className="text-sm text-gray-600">Pack the item securely in its original packaging with all accessories</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#2874f0]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-[#2874f0]">3</span>
                      </div>
                      <h4 className="font-medium mb-1">Pickup/Drop-off</h4>
                      <p className="text-sm text-gray-600">Wait for our pickup agent or drop the item at the nearest designated center</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#2874f0]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-[#2874f0]">4</span>
                      </div>
                      <h4 className="font-medium mb-1">Get Refund</h4>
                      <p className="text-sm text-gray-600">After verification, receive your refund or replacement within 5-7 business days</p>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        </TabsContent>
        
        {/* Refunds Tab */}
        <TabsContent value="refunds">
          <StaticPageSection 
            section="returns_page"
            titleFilter="Refunds Policy" 
            defaultContent={
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#2874f0] flex items-center gap-2">
                  <CreditCard size={20} />
                  Refund Policy
                </h2>
                
                <p className="text-gray-700">
                  Once your return is received and inspected, we will process your refund. Depending on your payment method, 
                  refunds may take different amounts of time to appear in your account.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-[#efefef]">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-3">Refund Timelines</h3>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <Clock className="h-5 w-5 text-[#2874f0] mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Lelekart Wallet Credit</p>
                            <p className="text-sm text-gray-600">Within 24 hours after return approval</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <Clock className="h-5 w-5 text-[#2874f0] mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium">UPI/Net Banking</p>
                            <p className="text-sm text-gray-600">3-5 business days after return approval</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <Clock className="h-5 w-5 text-[#2874f0] mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Credit/Debit Card</p>
                            <p className="text-sm text-gray-600">5-7 business days after return approval</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <Clock className="h-5 w-5 text-[#2874f0] mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium">EMI/Pay Later</p>
                            <p className="text-sm text-gray-600">7-10 business days after return approval</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <Clock className="h-5 w-5 text-[#2874f0] mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Cash on Delivery</p>
                            <p className="text-sm text-gray-600">Bank transfer in 5-7 business days</p>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-[#efefef]">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-3">Refund Methods</h3>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <CreditCard className="h-5 w-5 text-[#2874f0] mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Original Payment Method</p>
                            <p className="text-sm text-gray-600">Refunds are typically processed to the original payment method</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <CreditCard className="h-5 w-5 text-[#2874f0] mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Lelekart Wallet</p>
                            <p className="text-sm text-gray-600">Option for instant refunds to your Lelekart wallet</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <CreditCard className="h-5 w-5 text-[#2874f0] mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Bank Transfer</p>
                            <p className="text-sm text-gray-600">For COD orders or when original payment method is unavailable</p>
                          </div>
                        </li>
                      </ul>
                      <div className="p-3 bg-green-50 border border-green-100 rounded-md mt-4">
                        <div className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-green-800">
                            <span className="font-medium">Instant refunds available!</span> Choose Lelekart Wallet refund option to receive your refund instantly.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md text-yellow-800 text-sm">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Important Note on Refunds</p>
                      <p>For damaged or defective items, we offer a full refund including shipping charges. For change of mind returns, original shipping charges (if any) are non-refundable. A return shipping fee may apply for non-quality related returns.</p>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        </TabsContent>
        
        {/* Cancellations Tab */}
        <TabsContent value="cancellations">
          <StaticPageSection 
            section="returns_page"
            titleFilter="Cancellations Policy" 
            defaultContent={
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#2874f0] flex items-center gap-2">
                  <Clock size={20} />
                  Cancellation Policy
                </h2>
                
                <p className="text-gray-700">
                  You can cancel an order at any time before it is shipped. Once shipped, you will need to initiate a return.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-[#efefef]">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-3">How to Cancel an Order</h3>
                      <ol className="space-y-3 pl-6 list-decimal">
                        <li className="text-gray-700">
                          <span className="font-medium">Log in to your account</span>
                          <p className="text-sm text-gray-600">Visit Lelekart.com and sign in to your account</p>
                        </li>
                        <li className="text-gray-700">
                          <span className="font-medium">Go to My Orders</span>
                          <p className="text-sm text-gray-600">Navigate to the My Orders section in your account</p>
                        </li>
                        <li className="text-gray-700">
                          <span className="font-medium">Select the order</span>
                          <p className="text-sm text-gray-600">Find and click on the order you wish to cancel</p>
                        </li>
                        <li className="text-gray-700">
                          <span className="font-medium">Click "Cancel Order"</span>
                          <p className="text-sm text-gray-600">Select the cancel option and choose your reason</p>
                        </li>
                        <li className="text-gray-700">
                          <span className="font-medium">Confirm cancellation</span>
                          <p className="text-sm text-gray-600">Review and confirm your cancellation request</p>
                        </li>
                      </ol>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-[#efefef]">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-3">Cancellation Terms</h3>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Pre-Shipment Cancellation</p>
                            <p className="text-sm text-gray-600">100% refund to original payment method</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Partial Order Cancellation</p>
                            <p className="text-sm text-gray-600">Available for multi-item orders that haven't been shipped</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Post-Shipment</p>
                            <p className="text-sm text-gray-600">Cannot be cancelled; please follow return process</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Non-Cancellable Items</p>
                            <p className="text-sm text-gray-600">Some items like perishables and custom orders cannot be cancelled</p>
                          </div>
                        </li>
                      </ul>
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-md mt-4">
                        <div className="flex items-start">
                          <HelpCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Need urgent help?</span> For immediate assistance with cancelling an order, please contact our customer service.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md text-yellow-800 text-sm">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Important Note</p>
                      <p>Refunds for cancelled orders are processed within 7-10 business days, depending on your payment method. For faster refunds, you can opt for Lelekart Wallet credit.</p>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        </TabsContent>
      </Tabs>
      
      <Separator className="my-10" />
      
      {/* Exchange Policy */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">Exchange Policy</h2>
        <StaticPageSection 
          section="returns_page"
          titleFilter="Exchange Policy" 
          defaultContent={
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-[#efefef]">
                <CardContent className="p-6">
                  <div className="flex items-start mb-4">
                    <ArrowLeftRight className="h-6 w-6 text-[#2874f0] mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Exchange Options</h3>
                      <p className="text-gray-600 mb-3">
                        For eligible products, you can request an exchange for a different:
                      </p>
                      <ul className="space-y-2">
                        <li className="flex items-center text-gray-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#2874f0] mr-2"></div>
                          Size (clothing, footwear)
                        </li>
                        <li className="flex items-center text-gray-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#2874f0] mr-2"></div>
                          Color (where multiple colors are available)
                        </li>
                        <li className="flex items-center text-gray-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#2874f0] mr-2"></div>
                          Variant (same product, different configuration)
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-[#efefef]">
                <CardContent className="p-6">
                  <div className="flex items-start mb-4">
                    <PackageOpen className="h-6 w-6 text-[#2874f0] mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Exchange Process</h3>
                      <p className="text-gray-600 mb-3">
                        To exchange a product:
                      </p>
                      <ol className="space-y-2 list-decimal pl-4">
                        <li className="text-gray-700">
                          Go to "My Orders" and find the item
                        </li>
                        <li className="text-gray-700">
                          Click "Exchange" instead of "Return"
                        </li>
                        <li className="text-gray-700">
                          Select the new size/color/variant
                        </li>
                        <li className="text-gray-700">
                          Schedule pickup for the original item
                        </li>
                        <li className="text-gray-700">
                          Receive replacement after item verification
                        </li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          }
        />
      </div>
      
      <StaticPageSection 
        section="returns_page"
        titleFilter="Returns Footer" 
        defaultContent={
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="md:w-2/3">
                <h3 className="text-xl font-semibold mb-3">Need Help?</h3>
                <p className="text-gray-600 mb-4">
                  If you have any questions about returns, refunds, or cancellations, 
                  our customer service team is ready to assist you.
                </p>
                <Button>Contact Customer Service</Button>
              </div>
              <div className="md:w-1/3 bg-white p-4 rounded-md border">
                <h4 className="font-medium mb-2 flex items-center">
                  <HelpCircle className="h-4 w-4 mr-1 text-[#2874f0]" />
                  Quick Help
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="text-gray-700">
                    <a href="#" className="hover:underline hover:text-[#2874f0]">How to package items for return</a>
                  </li>
                  <li className="text-gray-700">
                    <a href="#" className="hover:underline hover:text-[#2874f0]">Track return status</a>
                  </li>
                  <li className="text-gray-700">
                    <a href="#" className="hover:underline hover:text-[#2874f0]">Return pickup schedule</a>
                  </li>
                  <li className="text-gray-700">
                    <a href="#" className="hover:underline hover:text-[#2874f0]">Common return problems</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        }
      />
    </StaticPageTemplate>
  );
}