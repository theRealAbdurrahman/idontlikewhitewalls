import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { 
  useReadEventsApiV1EventsGet, 
  useReadQuestionsApiV1QuestionsGet,
  useReadInteractionsApiV1InteractionsGet,
} from "../api-client/api-client";
import { useAuthStore } from "../stores/authStore";
import { useAppStore } from "../stores/appStore";
// COMMENTED OUT: Mock data imports for future reference
// import { mockEvents, mockQuestions, mockNotifications, mockChatThreads } from "../data/mockData";

/**
 * Authentication context interface
 */
interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  loading: boolean;
}

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider component that manages auth state and loads initial data
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuthStore();
  const { setEvents, setQuestions, setNotifications, setChatThreads, setUnreadNotifications, setUnreadMessages } = useAppStore();

  // Fetch data from API using TanStack Query
  const { 
    data: eventsData, 
    isLoading: eventsLoading, 
    error: eventsError 
  } = useReadEventsApiV1EventsGet();
  
  const { 
    data: questionsData, 
    isLoading: questionsLoading, 
    error: questionsError 
  } = useReadQuestionsApiV1QuestionsGet();
  
  const { 
    data: interactionsData, 
    isLoading: interactionsLoading, 
    error: interactionsError 
  } = useReadInteractionsApiV1InteractionsGet();

  // Load API data when available
  useEffect(() => {
    if (eventsData?.data) {
      // Transform EventRead[] to Event[] format expected by the app
      const transformedEvents = eventsData.data.map((event) => ({
        id: event.id,
        name: event.name,
        description: event.description || "",
        location: event.location || "",
        date: event.start_date,
        endDate: event.end_date,
        image: undefined, // API doesn't have image field yet
        organizerId: event.creator_id,
        organizerName: "Event Organizer", // Default for now
        attendeeCount: 0, // Will be populated from event participants
        isCheckedIn: false, // Will be determined from user's participation
        isJoined: false, // Will be determined from user's participation
        tags: [], // Default empty for now
        category: "General", // Default category
        website: undefined,
        maxAttendees: undefined,
        price: undefined,
        currency: "EUR",
        status: "upcoming" as const,
      }));
      setEvents(transformedEvents);
    }
  }, [eventsData, setEvents]);

  useEffect(() => {
    if (questionsData?.data) {
      // Transform QuestionRead[] to Question[] format expected by the app
      const transformedQuestions = questionsData.data.map((question) => ({
        id: question.id,
        authorId: question.user_id,
        authorName: "Question Author", // Will need to fetch user data
        authorAvatar: undefined,
        eventId: question.event_id,
        eventName: undefined, // Will need to match with events
        title: question.title,
        description: question.content,
        image: undefined,
        tags: [], // Default empty for now
        createdAt: question.created_at || new Date().toISOString(),
        visibility: "anyone" as const, // Default visibility
        isAnonymous: question.is_anonymous || false,
        upvotes: 0, // Will be calculated from interactions
        meTooCount: 0, // Will be calculated from interactions
        canHelpCount: 0, // Will be calculated from interactions
        isUpvoted: false, // Will be determined from user's interactions
        isMeToo: false, // Will be determined from user's interactions
        isBookmarked: false, // Will be determined from user's interactions
        replies: 0, // Default for now
      }));
      setQuestions(transformedQuestions);
    }
  }, [questionsData, setQuestions]);

  useEffect(() => {
    if (interactionsData?.data) {
      // Transform interactions to notifications format
      const transformedNotifications = interactionsData.data
        .filter((interaction) => interaction.user_id !== user?.id) // Exclude own interactions
        .slice(0, 10) // Limit to recent notifications
        .map((interaction) => ({
          id: interaction.id,
          type: interaction.interaction_type === "uplift" ? "upvote" as const :
                interaction.interaction_type === "me_too" ? "me_too" as const :
                interaction.interaction_type === "i_can_help" ? "can_help" as const :
                "upvote" as const,
          title: `New ${interaction.interaction_type} interaction`,
          message: `Someone ${interaction.interaction_type}ed your content`,
          avatar: undefined,
          createdAt: interaction.created_at || new Date().toISOString(),
          isRead: false,
          questionId: interaction.target_type === "question" ? interaction.target_id : undefined,
          userId: interaction.user_id,
        }));
      setNotifications(transformedNotifications);
      setUnreadNotifications(transformedNotifications.filter(n => !n.isRead).length);
    }
  }, [interactionsData, user?.id, setNotifications, setUnreadNotifications]);

  // COMMENTED OUT: Original mock data loading for future reference
  // useEffect(() => {
  //   if (isAuthenticated && user) {
  //     // Load mock data - in a real app, this would be API calls
  //     setEvents(mockEvents);
  //     setQuestions(mockQuestions);
  //     setNotifications(mockNotifications);
  //     setChatThreads(mockChatThreads);
  //   }
  // }, [isAuthenticated, user, setEvents, setQuestions, setNotifications, setChatThreads]);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    loading: loading || eventsLoading || questionsLoading || interactionsLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};