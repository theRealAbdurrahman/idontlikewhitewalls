import React from "react";
import { SettingsIcon, LogOutIcon, QrCodeIcon, MessageCircleIcon, BookmarkIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { StickyNote } from "../components/ui/sticky-note";
import { useAuthStore } from "../stores/authStore";
import { useAppStore } from "../stores/appStore";

/**
 * Profile screen component displaying user profile information
 */
export const Profile: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { questions } = useAppStore();

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return null;
  }

  // Calculate user stats
  const userQuestions = questions.filter(q => q.authorId === user.id);
  const totalUpvotes = userQuestions.reduce((sum, q) => sum + q.upvotes, 0);

  const stats = [
    { label: "Questions", value: user.questionsCount, icon: MessageCircleIcon },
    { label: "Me Too", value: user.meTooCount, icon: BookmarkIcon },
    { label: "Can Help", value: user.canHelpCount, icon: MessageCircleIcon },
    { label: "Uplifts", value: totalUpvotes, icon: BookmarkIcon },
  ];

  return (
    <div className="px-4 py-6">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-xl">{user.name[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-black">{user.name}</h1>
                {user.verified && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              
              {user.title && user.company && (
                <p className="text-gray-600 text-sm mb-1">
                  {user.title} at {user.company}
                </p>
              )}
              
              {user.location && (
                <p className="text-gray-500 text-sm mb-2">{user.location}</p>
              )}
              
              <p className="text-gray-600 text-sm">{user.connections} connections</p>
            </div>
          </div>
          
          {user.bio && (
            <p className="text-gray-700 text-sm mt-4 leading-relaxed">{user.bio}</p>
          )}
          
          {/* Sticky Note */}
          <div className="flex justify-end mt-4">
            <StickyNote
              content="Remember to follow up on networking connections from The Summeet 2025! 💡"
              backgroundColor="#FFE066"
              width={180}
              height={160}
              rotation={3}
              className="hover:rotate-0 transition-transform duration-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="font-semibold text-lg text-black mb-4">Activity</h2>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mx-auto mb-2">
                    <Icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-black">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="font-semibold text-lg text-black mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => console.log("Show QR code")}
            >
              <QrCodeIcon className="w-5 h-5" />
              Show QR Code for Check-ins
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => console.log("View bookmarked")}
            >
              <BookmarkIcon className="w-5 h-5" />
              View Bookmarked Questions
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => console.log("Settings")}
            >
              <SettingsIcon className="w-5 h-5" />
              Settings & Privacy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardContent className="p-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12 text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOutIcon className="w-5 h-5" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Version Info */}
      <div className="text-center mt-6">
        <p className="text-xs text-gray-500">
          Meetball v1.0.0 • Made with ❤️ in Lisbon
        </p>
      </div>
    </div>
  );
};