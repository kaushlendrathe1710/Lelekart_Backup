import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function SellerGettingStartedGuide() {
  return (
    <SellerDashboardLayout>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Lelekart Seller Onboarding</CardTitle>
            <CardDescription>
              Your step-by-step guide to getting started and succeeding as a seller on Lelekart.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-2">1. Create & Complete Your Seller Profile</h2>
              <ul className="list-disc ml-6 text-gray-700">
                <li>Fill in your business and contact details accurately.</li>
                <li>Upload required documents for verification.</li>
                <li>Set up your payment and shipping preferences.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">2. Add Your First Products</h2>
              <ul className="list-disc ml-6 text-gray-700">
                <li>Use the <Link href="/seller/add-product" className="text-blue-600 underline">Add Product</Link> page to list your items.</li>
                <li>Provide clear titles, descriptions, and high-quality images.</li>
                <li>Set competitive prices and stock levels.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">3. Manage Orders & Shipments</h2>
              <ul className="list-disc ml-6 text-gray-700">
                <li>Track new orders from your <Link href="/seller/orders" className="text-blue-600 underline">Orders</Link> dashboard.</li>
                <li>Process and ship orders promptly to ensure customer satisfaction.</li>
                <li>Update tracking information for buyers.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">4. Grow Your Business</h2>
              <ul className="list-disc ml-6 text-gray-700">
                <li>Participate in promotions and campaigns.</li>
                <li>Monitor your analytics and optimize your listings.</li>
                <li>Engage with customers through reviews and messages.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">Tips for Success</h2>
              <ul className="list-disc ml-6 text-gray-700">
                <li>Respond quickly to customer queries and support tickets.</li>
                <li>Keep your inventory updated to avoid cancellations.</li>
                <li>Use high-quality images and detailed descriptions for all products.</li>
                <li>Stay updated with platform announcements and new features.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">Need Help?</h2>
              <p className="mb-2">Our support team is here for you. Visit <Link href="/seller/help" className="text-blue-600 underline">Help & Support</Link> or <a href="mailto:seller-support@lelekart.com" className="text-blue-600 underline">email us</a>.</p>
              <Button asChild variant="outline">
                <Link href="/seller/help">Go to Help & Support</Link>
              </Button>
            </section>
          </CardContent>
        </Card>
      </div>
    </SellerDashboardLayout>
  );
} 