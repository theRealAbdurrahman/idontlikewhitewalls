import React from "react";
import { formatDistanceToNow } from "date-fns";
import { BellIcon, HandIcon, ArrowUpIcon, MessageCircleIcon, CalendarIcon, UsersIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAppStore } from "../stores/appStore";

/**
 * Notifications screen component
 */
export const Notifications: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppStore();

  const handleNotificationClick = (notificationId: string) => {
    markNotificationRead(notificationId);
    // TODO: Handle navigation based on notification type
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "me_too":
        return <HandIcon className="w-5 h-5 text-orange-500" />;
      case "can_help":
        return <UsersIcon className="w-5 h-5 text-green-500" />;
      case "upvote":
        return <ArrowUpIcon className="w-5 h-5 text-blue-500" />;
      case "reply":
        return <MessageCircleIcon className="w-5 h-5 text-purple-500" />;
      case "event":
        return <CalendarIcon className="w-5 h-5 text-indigo-500" />;
      case "connection":
        return <UsersIcon className="w-5 h-5 text-teal-500" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with your activity</p>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12">
          <BellIcon className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-gray-500 text-center">
            When people interact with your questions or events, 
            you'll see notifications here.
          </p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllRead}
              variant="outline"
              size="sm"
              className="text-sm"
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`cursor-pointer transition-colors ${
              !notification.isRead 
                ? "bg-blue-50 border-blue-200 hover:bg-blue-100" 
                : "hover:bg-gray-50"
            }`}
            onClick={() => handleNotificationClick(notification.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Avatar if available */}
                      {notification.avatar && (
                        <Avatar className="w-8 h-8 mb-2">
                          <AvatarImage src={notification.avatar} alt="User" />
                          <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                      )}
                      
                      {/* Title */}
                      <h3 className={`font-medium mb-1 ${
                        !notification.isRead ? "text-black" : "text-gray-800"
                      }`}>
                        {notification.title}
                      </h3>
                      
                      {/* Message */}
                      <p className={`text-sm ${
                        !notification.isRead ? "text-gray-700" : "text-gray-600"
                      }`}>
                        {notification.message}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};