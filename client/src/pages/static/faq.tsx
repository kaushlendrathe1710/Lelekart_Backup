import React from "react";
import { StaticPageSection } from "@/components/static-page-template";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Package,
  CreditCard,
  Shield,
  HelpCircle,
  ShoppingBag,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Helper to filter accordion items by search
  function filterAccordionItems(items: Array<{ question: string; answer: React.ReactNode }>) {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.trim().toLowerCase();
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        (typeof item.answer === "string"
          ? item.answer.toLowerCase().includes(q)
          : false)
    );
  }

  return (
    <div className="bg-[#f1f3f6] min-h-screen py-4">
      <div className="container mx-auto px-4">
        {/* Main Content Area */}
        <div className="bg-white shadow-sm rounded-md overflow-hidden mb-6">
          {/* Hero Banner */}
          <div className="bg-[#2874f0] text-white p-8 md:p-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h1>
              <p className="text-lg md:text-xl mb-6">
                Find answers to common questions about shopping on Lelekart
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
              {/* Search Bar */}
              <div className="mb-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search for questions..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* FAQ Categories */}
              <Tabs defaultValue="orders" className="w-full mb-10">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-6">
                  <TabsTrigger
                    value="orders"
                    className="flex items-center gap-1"
                  >
                    <Package size={16} />
                    <span>Orders</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="payments"
                    className="flex items-center gap-1"
                  >
                    <CreditCard size={16} />
                    <span>Payments</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="returns"
                    className="flex items-center gap-1"
                  >
                    <Package size={16} />
                    <span>Returns</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="account"
                    className="flex items-center gap-1"
                  >
                    <User size={16} />
                    <span>Account</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="shopping"
                    className="flex items-center gap-1"
                  >
                    <ShoppingBag size={16} />
                    <span>Shopping</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="flex items-center gap-1"
                  >
                    <Shield size={16} />
                    <span>Security</span>
                  </TabsTrigger>
                </TabsList>

                {/* Orders Tab with search filter */}
                <TabsContent value="orders">
                  <h2 className="text-2xl font-bold mb-6 text-[#2874f0] flex items-center gap-2">
                    <Package size={20} />
                    Orders & Shipping
                  </h2>
                  {(() => {
                    const items = [
                      {
                        question: "How do I track my order?",
                        answer: `You can track your order by following these steps: Log in to your Lelekart account, Go to 'My Orders' section, Find the order you want to track, Click on 'Track' button. You'll be able to see real-time updates on your order status and expected delivery date.`
                      },
                      {
                        question: "When will I receive my order?",
                        answer: `Delivery times vary depending on your location and the product. Metro cities: 1-3 business days, Tier 2 cities: 2-4 business days, Other areas: 4-7 business days. The estimated delivery date is shown at checkout and in your order confirmation.`
                      },
                      {
                        question: "Can I modify or cancel my order?",
                        answer: `You can modify or cancel your order only if it hasn't been shipped yet. Go to 'My Orders' in your account, Select the order you wish to modify or cancel, Click 'Cancel' or 'Modify' button (if available). If the order has already been shipped, you won't be able to cancel it directly. In that case, you can refuse the delivery or request a return once you receive it.`
                      },
                      {
                        question: "How do I check my order history?",
                        answer: `To view your order history: Log in to your Lelekart account, Go to 'My Orders' section, You'll see all your past and current orders, Click on any order to view its details. Your order history is available for all orders placed within the last 12 months.`
                      },
                      {
                        question: "What if I'm not available during delivery?",
                        answer: `If you're not available during delivery: Our delivery partner will attempt delivery up to 3 times, You'll receive notifications before each delivery attempt, You can reschedule delivery through the tracking page, For some areas, you can choose safe drop-off options. If delivery cannot be completed after 3 attempts, the order will be returned to our warehouse and a refund will be processed.`
                      },
                    ];
                    const filtered = filterAccordionItems(items);
                    if (filtered.length === 0) {
                      return <div className="text-center text-muted-foreground py-8">No matching questions found.</div>;
                    }
                    return (
                      <Accordion type="single" collapsible className="w-full">
                        {filtered.map((item, idx) => (
                          <AccordionItem value={`item-${idx + 1}`} key={item.question}>
                            <AccordionTrigger>{item.question}</AccordionTrigger>
                            <AccordionContent>{item.answer}</AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    );
                  })()}
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments">
                  <h2 className="text-2xl font-bold mb-6 text-[#2874f0] flex items-center gap-2">
                    <CreditCard size={20} />
                    Payments & Pricing
                  </h2>
                  <StaticPageSection
                    section="faq_page"
                    titleFilter="Payments FAQs"
                    defaultContent={
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                          <AccordionTrigger>
                            What payment methods are accepted?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>We accept multiple payment methods including:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                              <li>
                                Credit cards (Visa, MasterCard, American
                                Express)
                              </li>
                              <li>Debit cards</li>
                              <li>Net Banking</li>
                              <li>UPI (Google Pay, PhonePe, BHIM, etc.)</li>
                              <li>Wallets (Paytm, MobiKwik, etc.)</li>
                              <li>EMI (select banks)</li>
                              <li>Cash on Delivery (restrictions may apply)</li>
                              <li>Lelekart Pay Later</li>
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                          <AccordionTrigger>
                            When is my credit/debit card charged?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>
                              Your card is charged immediately when you place
                              the order. If for any reason your order is
                              canceled or unavailable, a full refund will be
                              processed to your original payment method.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                          <AccordionTrigger>
                            Is it safe to save my card information?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>
                              Yes, it's safe to save your card information on
                              Lelekart. We use industry-standard encryption and
                              security measures to protect your payment
                              information. We do not store your CVV number.
                            </p>
                            <p className="mt-2">
                              Your saved cards are secured with tokenization
                              technology as per RBI guidelines. You'll need to
                              enter your CVV each time you make a payment, even
                              with saved cards.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                          <AccordionTrigger>
                            How do EMI payments work?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>
                              EMI (Equated Monthly Installment) allows you to
                              split your payment into equal monthly
                              installments:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                              <li>Available for orders above ₹3,000</li>
                              <li>Supported by most major banks</li>
                              <li>
                                Choose from 3, 6, 9, 12, 18, or 24 month options
                              </li>
                              <li>
                                Interest rates vary by bank (0% EMI available on
                                select products)
                              </li>
                            </ul>
                            <p className="mt-2">
                              To use EMI, select "EMI" as your payment method
                              during checkout and choose your bank and tenure.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                          <AccordionTrigger>
                            How do I get an invoice for my purchase?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>
                              Your invoice is automatically generated and
                              available in your account:
                            </p>
                            <ol className="list-decimal pl-5 space-y-1 mt-2">
                              <li>Log in to your Lelekart account</li>
                              <li>Go to "My Orders"</li>
                              <li>
                                Select the order for which you need the invoice
                              </li>
                              <li>Click on "Download Invoice"</li>
                            </ol>
                            <p className="mt-2">
                              The invoice is also sent to your registered email
                              address once your order is shipped.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    }
                  />
                </TabsContent>

                {/* Returns Tab */}
                <TabsContent value="returns">
                  <h2 className="text-2xl font-bold mb-6 text-[#2874f0] flex items-center gap-2">
                    <Package size={20} />
                    Returns & Refunds
                  </h2>
                  <StaticPageSection
                    section="faq_page"
                    titleFilter="Returns FAQs"
                    defaultContent={
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                          <AccordionTrigger>
                            What is the return policy?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>
                              Our return policy allows you to return most items
                              within 7-10 days of delivery (varies by category):
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                              <li>Electronics: 7 days</li>
                              <li>Clothing and accessories: 10 days</li>
                              <li>Home and kitchen: 7 days</li>
                              <li>Books: 7 days</li>
                            </ul>
                            <p className="mt-2">
                              The item must be unused, unworn, unwashed, and
                              with all original tags/packaging intact. Some
                              products like innerwear, personal care items, and
                              customized products are not eligible for returns.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                          <AccordionTrigger>
                            How do I return a product?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>To return a product:</p>
                            <ol className="list-decimal pl-5 space-y-1 mt-2">
                              <li>Log in to your Lelekart account</li>
                              <li>
                                Go to "My Orders" and find the item you want to
                                return
                              </li>
                              <li>Click on "Return" button</li>
                              <li>Select the reason for return</li>
                              <li>Choose pickup address and available slots</li>
                              <li>Print the return label (if provided)</li>
                              <li>Pack the item in its original packaging</li>
                              <li>Hand it over to our pickup agent</li>
                            </ol>
                            <p className="mt-2">
                              Once we receive and inspect the returned item,
                              we'll process your refund.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                          <AccordionTrigger>
                            When will I get my refund?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>
                              Refund timelines depend on your payment method:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                              <li>
                                Lelekart Wallet: 24 hours after return approval
                              </li>
                              <li>UPI/Net Banking: 3-5 business days</li>
                              <li>Credit/Debit Card: 5-7 business days</li>
                              <li>EMI: 7-10 business days</li>
                              <li>Pay Later: 7-10 business days</li>
                              <li>
                                Cash on Delivery: 7-10 business days (refunded
                                to your bank account)
                              </li>
                            </ul>
                            <p className="mt-2">
                              You'll receive an email notification once your
                              refund is processed.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                          <AccordionTrigger>
                            What if I received a damaged or defective item?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>If you receive a damaged or defective item:</p>
                            <ol className="list-decimal pl-5 space-y-1 mt-2">
                              <li>
                                Initiate a return request within 48 hours of
                                delivery
                              </li>
                              <li>
                                Select "Damaged" or "Defective" as the reason
                              </li>
                              <li>
                                Provide photos of the damage/defect if prompted
                              </li>
                              <li>Choose between replacement or refund</li>
                            </ol>
                            <p className="mt-2">
                              For damaged or defective products, we offer free
                              pickup and either a replacement or a full refund.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                          <AccordionTrigger>
                            Can I exchange an item instead of returning it?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>
                              Yes, for eligible products like clothing and
                              footwear, you can request an exchange for a
                              different size or color:
                            </p>
                            <ol className="list-decimal pl-5 space-y-1 mt-2">
                              <li>Go to "My Orders" and select the item</li>
                              <li>Click "Exchange" instead of "Return"</li>
                              <li>Select the reason for exchange</li>
                              <li>Choose the new size or color you want</li>
                              <li>Schedule a pickup for the original item</li>
                            </ol>
                            <p className="mt-2">
                              The replacement item will be shipped once we
                              receive the original item. If the replacement is
                              not available, we'll process a refund.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    }
                  />
                </TabsContent>

                {/* Account Tab */}
                <TabsContent value="account">
                  <h2 className="text-2xl font-bold mb-6 text-[#2874f0] flex items-center gap-2">
                    <User size={20} />
                    Account & Profile
                  </h2>
                  <StaticPageSection
                    section="faq_page"
                    titleFilter="Account FAQs"
                    defaultContent={
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                          <AccordionTrigger>
                            How do I create an account?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>Creating an account is easy:</p>
                            <ol className="list-decimal pl-5 space-y-1 mt-2">
                              <li>
                                Click on "Login" at the top right of the
                                homepage
                              </li>
                              <li>
                                Choose "New to Lelekart? Create an account"
                              </li>
                              <li>Enter your mobile number or email address</li>
                              <li>Verify with OTP (One-Time Password)</li>
                              <li>Fill in your details (name, email, etc.)</li>
                              <li>Set a password</li>
                            </ol>
                            <p className="mt-2">
                              You can also sign up during checkout as a guest
                              user.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                          <AccordionTrigger>
                            How do I reset my password?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>To reset your password:</p>
                            <ol className="list-decimal pl-5 space-y-1 mt-2">
                              <li>Click on "Login" at the top of the page</li>
                              <li>Select "Forgot Password?"</li>
                              <li>
                                Enter your registered email or mobile number
                              </li>
                              <li>
                                Follow the instructions sent to your
                                email/mobile
                              </li>
                              <li>Create a new password</li>
                            </ol>
                            <p className="mt-2">
                              Make sure to choose a strong password that you
                              haven't used before. For security reasons, you'll
                              be logged out of all devices after changing your
                              password.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                          <AccordionTrigger>
                            How do I update my address or personal information?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>To update your profile information:</p>
                            <ol className="list-decimal pl-5 space-y-1 mt-2">
                              <li>Log in to your account</li>
                              <li>Click on your name at the top right</li>
                              <li>
                                Select "My Profile" from the dropdown menu
                              </li>
                              <li>
                                Click "Edit" next to the information you want to
                                update
                              </li>
                              <li>Make your changes and click "Save"</li>
                            </ol>
                            <p className="mt-2">
                              For addresses specifically, go to "Manage
                              Addresses" section where you can add, edit, or
                              delete addresses.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                          <AccordionTrigger>
                            How do I deactivate my account?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>To deactivate your account:</p>
                            <ol className="list-decimal pl-5 space-y-1 mt-2">
                              <li>Log in to your account</li>
                              <li>Go to "My Profile"</li>
                              <li>
                                Scroll to the bottom and click "Deactivate
                                Account"
                              </li>
                              <li>Select the reason for deactivation</li>
                              <li>Enter your password to confirm</li>
                              <li>Click "Deactivate Account"</li>
                            </ol>
                            <p className="mt-2">
                              Note: Deactivating your account will remove your
                              personal information, but your order history will
                              be retained as per regulatory requirements. If you
                              have any pending orders, they will be processed
                              normally.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                          <AccordionTrigger>
                            What is Lelekart Wallet and how does it work?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>
                              Lelekart Wallet is our digital payment system that
                              allows you to:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                              <li>Store money securely for future purchases</li>
                              <li>Receive refunds instantly</li>
                              <li>Earn cashback and rewards</li>
                              <li>Make faster payments during checkout</li>
                            </ul>
                            <p className="mt-2">
                              You can add money to your wallet using any payment
                              method. Wallet balance doesn't expire and can be
                              used for any purchase on Lelekart. For regulatory
                              compliance, you'll need to complete a one-time KYC
                              verification to use your wallet for purchases
                              above ₹10,000.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    }
                  />
                </TabsContent>

                {/* Shopping Tab */}
                <TabsContent value="shopping">
                  <h2 className="text-2xl font-bold mb-6 text-[#2874f0] flex items-center gap-2">
                    <ShoppingBag size={20} />
                    Shopping Experience
                  </h2>
                  <StaticPageSection
                    section="faq_page"
                    titleFilter="Shopping FAQs"
                    defaultContent={
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                          <AccordionTrigger>
                            How do I find specific products?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>You can find products in several ways:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                              <li>
                                <strong>Search bar:</strong> Type keywords or
                                product names
                              </li>
                              <li>
                                <strong>Categories:</strong> Browse through our
                                organized categories
                              </li>
                              <li>
                                <strong>Filters:</strong> Narrow down results by
                                price, brand, ratings, etc.
                              </li>
                              <li>
                                <strong>Collections:</strong> Explore curated
                                collections on the homepage
                              </li>
                            </ul>
                            <p className="mt-2">
                              You can also use our voice search feature by
                              clicking the microphone icon in the search bar.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                          <AccordionTrigger>
                            What are the benefits of using the wishlist?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>The wishlist feature offers several benefits:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                              <li>
                                Save products you're interested in for later
                              </li>
                              <li>
                                Get notified when wishlist items go on sale
                              </li>
                              <li>
                                Receive alerts when out-of-stock items become
                                available
                              </li>
                              <li>
                                Easily compare products before making a purchase
                              </li>
                              <li>
                                Share your wishlist with friends and family
                              </li>
                            </ul>
                            <p className="mt-2">
                              To add a product to your wishlist, simply click
                              the heart icon on any product page or search
                              result.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                          <AccordionTrigger>
                            How can I check product availability in my area?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>To check product availability in your area:</p>
                            <ol className="list-decimal pl-5 space-y-1 mt-2">
                              <li>
                                Enter your pincode in the "Delivery" or "Check"
                                box on the product page
                              </li>
                              <li>Click "Check" or "Apply"</li>
                              <li>
                                The system will display estimated delivery time
                                and availability
                              </li>
                            </ol>
                            <p className="mt-2">
                              You can also save your default pincode in your
                              profile settings to automatically check
                              availability for all products.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                          <AccordionTrigger>
                            How reliable are the product reviews?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>
                              Our product reviews are from verified customers
                              who have purchased and used the products. We have
                              several measures to ensure review authenticity:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                              <li>
                                Reviews can only be submitted by customers who
                                have purchased the product
                              </li>
                              <li>
                                "Verified Purchase" badge indicates confirmed
                                buyers
                              </li>
                              <li>
                                Reviews include the date of purchase and usage
                                duration
                              </li>
                              <li>
                                Photos and videos in reviews are from actual
                                customers
                              </li>
                              <li>
                                We use AI systems to detect and remove fake or
                                biased reviews
                              </li>
                            </ul>
                            <p className="mt-2">
                              We don't edit or remove negative reviews as long
                              as they comply with our community guidelines.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                          <AccordionTrigger>
                            What are Lelekart SuperCoins and how do I earn them?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>
                              SuperCoins are Lelekart's rewards currency. You
                              can earn SuperCoins by:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                              <li>
                                Shopping on Lelekart (1 SuperCoin for every ₹100
                                spent)
                              </li>
                              <li>
                                Writing product reviews (5-20 SuperCoins per
                                review)
                              </li>
                              <li>Participating in games and activities</li>
                              <li>Completing profile information</li>
                              <li>Referring friends to Lelekart</li>
                            </ul>
                            <p className="mt-2">
                              SuperCoins can be redeemed for vouchers, products,
                              or exclusive offers in the SuperCoin Zone. They
                              are valid for 12 months from the date they are
                              earned.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    }
                  />
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                  <h2 className="text-2xl font-bold mb-6 text-[#2874f0] flex items-center gap-2">
                    <Shield size={20} />
                    Security & Privacy
                  </h2>
                  <StaticPageSection
                    section="faq_page"
                    titleFilter="Security FAQs"
                    defaultContent={
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                          <AccordionTrigger>
                            How does Lelekart protect my personal information?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>
                              We implement multiple security measures to protect
                              your personal information:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                              <li>
                                End-to-end encryption for all sensitive data
                              </li>
                              <li>
                                PCI DSS compliance for all payment processing
                              </li>
                              <li>
                                Multi-factor authentication for account access
                              </li>
                              <li>
                                Regular security audits and penetration testing
                              </li>
                              <li>
                                Secure data centers with physical and digital
                                protection
                              </li>
                              <li>Limited employee access to personal data</li>
                            </ul>
                            <p className="mt-2">
                              We only collect information necessary for
                              providing our services and never sell your
                              personal data to third parties.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                          <AccordionTrigger>
                            What should I do if I notice suspicious activity on
                            my account?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>If you notice suspicious activity:</p>
                            <ol className="list-decimal pl-5 space-y-1 mt-2">
                              <li>Change your password immediately</li>
                              <li>
                                Contact our customer service at
                                security@lelekart.com
                              </li>
                              <li>
                                Review recent orders and report any unauthorized
                                transactions
                              </li>
                              <li>
                                Check your saved addresses and payment methods
                                for any changes
                              </li>
                              <li>
                                Enable two-factor authentication if not already
                                enabled
                              </li>
                            </ol>
                            <p className="mt-2">
                              Our security team will investigate and may
                              temporarily freeze your account to prevent further
                              unauthorized access. We may also help you report
                              any fraudulent transactions to the appropriate
                              authorities.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                          <AccordionTrigger>
                            How can I make my Lelekart account more secure?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>To enhance your account security:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                              <li>
                                Use a strong, unique password (combine letters,
                                numbers, and special characters)
                              </li>
                              <li>
                                Enable two-factor authentication in account
                                settings
                              </li>
                              <li>
                                Don't share your account credentials with anyone
                              </li>
                              <li>
                                Log out when using shared or public computers
                              </li>
                              <li>
                                Update your contact information to receive
                                security alerts
                              </li>
                              <li>
                                Regularly review your order history and account
                                activity
                              </li>
                              <li>Use verified and secure payment methods</li>
                            </ul>
                            <p className="mt-2">
                              We recommend changing your password periodically,
                              especially if you've used the same password for a
                              long time.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                          <AccordionTrigger>
                            Does Lelekart share my information with third
                            parties?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>
                              We only share your information in specific
                              circumstances:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                              <li>
                                With delivery partners to fulfill your orders
                              </li>
                              <li>
                                With payment processors to complete transactions
                              </li>
                              <li>
                                With service providers who help us operate our
                                platform
                              </li>
                              <li>
                                When required by law or regulatory requirements
                              </li>
                              <li>
                                To protect against fraud or illegal activity
                              </li>
                            </ul>
                            <p className="mt-2">
                              All third parties we work with are bound by strict
                              confidentiality agreements and data protection
                              standards. We never sell your personal information
                              to advertisers or data brokers. You can review our
                              complete Privacy Policy for more details.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                          <AccordionTrigger>
                            What is Lelekart's policy on cookies?
                          </AccordionTrigger>
                          <AccordionContent>
                            <p>
                              We use cookies to enhance your shopping
                              experience:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                              <li>
                                <strong>Essential cookies:</strong> Required for
                                basic site functionality
                              </li>
                              <li>
                                <strong>Functional cookies:</strong> Remember
                                your preferences and settings
                              </li>
                              <li>
                                <strong>Performance cookies:</strong> Help us
                                improve site performance
                              </li>
                              <li>
                                <strong>Analytics cookies:</strong> Provide
                                insights on how visitors use our site
                              </li>
                              <li>
                                <strong>Targeting cookies:</strong> Deliver more
                                relevant advertisements
                              </li>
                            </ul>
                            <p className="mt-2">
                              You can manage your cookie preferences through the
                              Cookie Settings option at the bottom of our
                              website. You can choose to accept all cookies,
                              only essential cookies, or customize your
                              preferences.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    }
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
