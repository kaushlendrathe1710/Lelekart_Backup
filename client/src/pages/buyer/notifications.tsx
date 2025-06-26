import { NotificationList } from '@/components/notifications/notification-list';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function BuyerNotificationsPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="container mx-auto py-6 px-4">
      <Button variant="outline" className="mb-4" onClick={() => setLocation('/buyer/dashboard')}>Back to Dashboard</Button>
      <h2 className="text-2xl font-bold mb-4">All Notifications</h2>
      <NotificationList filter="all" />
    </div>
  );
} 