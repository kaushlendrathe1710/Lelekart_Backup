import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const stories = [
  {
    name: "Amit Kumar",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    title: "From Local to National Seller",
    text: "Amit started with just 10 products and now ships to 20+ states. 'Lelekart gave me the platform to grow beyond my city.'"
  },
  {
    name: "Priya Sharma",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    title: "Turning Passion into Profit",
    text: "Priya turned her handmade crafts into a thriving business. 'The support and tools made it easy to reach new customers.'"
  },
  {
    name: "Ravi Patel",
    photo: "https://randomuser.me/api/portraits/men/65.jpg",
    title: "Scaling Up with Smart Inventory",
    text: "Ravi used Lelekart's smart inventory to double his sales in 6 months. 'Automation helped me focus on quality and service.'"
  }
];

export default function SellerSuccessStories() {
  return (
    <SellerDashboardLayout>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Seller Success Stories</CardTitle>
            <CardDescription>Be inspired by real sellers who grew their business on Lelekart.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {stories.map((story, idx) => (
              <div key={idx} className="flex gap-4 items-start border-b pb-6 last:border-b-0 last:pb-0">
                <img src={story.photo} alt={story.name} className="w-16 h-16 rounded-full object-cover border" />
                <div>
                  <h3 className="font-semibold text-lg">{story.name}</h3>
                  <div className="text-blue-700 font-medium mb-1">{story.title}</div>
                  <div className="text-gray-700">{story.text}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SellerDashboardLayout>
  );
} 