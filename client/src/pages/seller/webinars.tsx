import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const webinars = [
  {
    title: "Getting Started on Lelekart",
    date: "2025-09-15",
    desc: "Learn the basics of setting up your seller account and listing your first products.",
    upcoming: true
  },
  {
    title: "Smart Inventory & Order Management",
    date: "2025-09-22",
    desc: "Tips and tools for managing your stock and fulfilling orders efficiently.",
    upcoming: true
  },
  {
    title: "How to Win More Customers",
    date: "2025-08-20",
    desc: "Best practices for marketing and customer engagement.",
    upcoming: false
  }
];

export default function SellerWebinarsPage() {
  return (
    <SellerDashboardLayout>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Seller Webinars</CardTitle>
            <CardDescription>Join our live webinars to learn, grow, and connect with other sellers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold mb-2">Upcoming Webinars</h2>
              {webinars.filter(w => w.upcoming).length === 0 && <div className="text-muted-foreground">No upcoming webinars. Check back soon!</div>}
              {webinars.filter(w => w.upcoming).map((w, idx) => (
                <div key={idx} className="mb-4 p-4 border rounded bg-blue-50">
                  <div className="font-medium text-blue-900">{w.title}</div>
                  <div className="text-sm text-blue-700 mb-1">{new Date(w.date).toLocaleDateString()}</div>
                  <div className="text-gray-700 text-sm">{w.desc}</div>
                </div>
              ))}
            </section>
            <section>
              <h2 className="text-lg font-semibold mb-2">Past Webinars</h2>
              {webinars.filter(w => !w.upcoming).length === 0 && <div className="text-muted-foreground">No past webinars yet.</div>}
              {webinars.filter(w => !w.upcoming).map((w, idx) => (
                <div key={idx} className="mb-4 p-4 border rounded bg-gray-50">
                  <div className="font-medium text-gray-900">{w.title}</div>
                  <div className="text-sm text-gray-700 mb-1">{new Date(w.date).toLocaleDateString()}</div>
                  <div className="text-gray-700 text-sm">{w.desc}</div>
                </div>
              ))}
            </section>
          </CardContent>
        </Card>
      </div>
    </SellerDashboardLayout>
  );
} 