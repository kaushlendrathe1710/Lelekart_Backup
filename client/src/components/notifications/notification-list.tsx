import { useNotifications } from '@/contexts/notification-context';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';
import { 
  Trash2, 
  CheckSquare, 
  ShoppingBag, 
  CreditCard, 
  Bell, 
  CheckCircle2, 
  MessageSquare, 
  Tag,
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationType } from '@shared/schema';
import { Badge } from '@/components/ui/badge';

interface NotificationListProps {
  filter?: 'all' | 'unread' | 'important';
}

export function NotificationList({ filter = 'all' }: NotificationListProps) {
  const { notifications, isLoading, markAsRead, deleteNotification } = useNotifications();
  
  // Filter notifications based on tab
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'important') {
      // Consider ORDER_STATUS, WALLET, and PRODUCT_APPROVAL as important
      return (
        notification.type === NotificationType.ORDER_STATUS ||
        notification.type === NotificationType.WALLET ||
        notification.type === NotificationType.PRODUCT_APPROVAL
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filteredNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground mb-2">
          {filter === 'all' ? 'No notifications yet' : 
           filter === 'unread' ? 'No unread notifications' :
           'No important notifications'}
        </p>
        <p className="text-xs text-muted-foreground">
          {filter === 'all' ? 'When you receive notifications, they will appear here' :
           filter === 'unread' ? 'All notifications have been read' :
           'You have no important notifications at this time'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {filteredNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={markAsRead}
          onDelete={deleteNotification}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: {
    id: number;
    title: string;
    message: string;
    read: boolean;
    type: NotificationType;
    link?: string | null;
    createdAt: string;
  };
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ORDER_STATUS:
        return 'bg-blue-100 text-blue-800';
      case NotificationType.WALLET:
        return 'bg-green-100 text-green-800';
      case NotificationType.PRODUCT_APPROVAL:
        return 'bg-purple-100 text-purple-800';
      case NotificationType.PRICE_DROP:
        return 'bg-orange-100 text-orange-800';
      case NotificationType.NEW_MESSAGE:
        return 'bg-yellow-100 text-yellow-800';
      case NotificationType.SYSTEM:
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ORDER_STATUS:
        return 'Order';
      case NotificationType.WALLET:
        return 'Wallet';
      case NotificationType.PRODUCT_APPROVAL:
        return 'Product';
      case NotificationType.PRICE_DROP:
        return 'Price Alert';
      case NotificationType.NEW_MESSAGE:
        return 'Message';
      case NotificationType.SYSTEM:
      default:
        return 'System';
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ORDER_STATUS:
        return <ShoppingBag className="h-4 w-4 text-blue-600" />;
      case NotificationType.WALLET:
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case NotificationType.PRODUCT_APPROVAL:
        return <CheckCircle2 className="h-4 w-4 text-purple-600" />;
      case NotificationType.PRICE_DROP:
        return <Tag className="h-4 w-4 text-orange-600" />;
      case NotificationType.NEW_MESSAGE:
        return <MessageSquare className="h-4 w-4 text-yellow-600" />;
      case NotificationType.SYSTEM:
      default:
        return <Bell className="h-4 w-4 text-red-600" />;
    }
  };

  const getTypeIconBackground = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ORDER_STATUS:
        return 'bg-blue-100';
      case NotificationType.WALLET:
        return 'bg-green-100';
      case NotificationType.PRODUCT_APPROVAL:
        return 'bg-purple-100';
      case NotificationType.PRICE_DROP:
        return 'bg-orange-100';
      case NotificationType.NEW_MESSAGE:
        return 'bg-yellow-100';
      case NotificationType.SYSTEM:
      default:
        return 'bg-red-100';
    }
  };

  const NotificationContent = () => (
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <h5 className="font-semibold text-gray-900">{notification.title}</h5>
        <Badge 
          variant="outline" 
          className={`text-[10px] px-1.5 py-0.5 rounded-full ${getTypeColor(notification.type)}`}
        >
          {getTypeLabel(notification.type)}
        </Badge>
        {!notification.read && (
          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-700">{notification.message}</p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
          {notification.link && (
            <div className="text-xs text-primary font-medium">
              View Details
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className={`flex items-start gap-3 p-4 hover:bg-muted/50 border-b transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
    >
      {/* Notification icon based on type */}
      <div className={`flex-shrink-0 rounded-full p-2 mt-1 ${getTypeIconBackground(notification.type)}`}>
        {getTypeIcon(notification.type)}
      </div>
      
      {notification.link ? (
        <Link 
          to={notification.link} 
          className="flex-1"
          onClick={handleClick}
        >
          <NotificationContent />
        </Link>
      ) : (
        <NotificationContent />
      )}
      <div className="flex flex-col gap-1 ml-2">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMarkAsRead(notification.id)}
            title="Mark as read"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(notification.id)}
          title="Delete notification"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}