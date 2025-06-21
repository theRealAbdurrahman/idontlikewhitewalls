import { create } from "zustand";

/**
 * Event interface representing an event in the system
 */
interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  date: string;
  endDate?: string;
  image?: string;
  organizerId: string;
  organizerName: string;
  attendeeCount: number;
  isCheckedIn: boolean;
  isJoined: boolean;
  tags: string[];
  category: string;
  website?: string;
  maxAttendees?: number;
  price?: number;
  currency?: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
}

/**
 * Question interface representing a question/post in the system
 */
interface Question {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  eventId?: string;
  eventName?: string;
  title: string;
  description: string;
  image?: string;
  tags: string[];
  createdAt: string;
  visibility: "anyone" | "network" | "event";
  isAnonymous: boolean;
  upvotes: number;
  meTooCount: number;
  canHelpCount: number;
  isUpvoted: boolean;
  isMeToo: boolean;
  isBookmarked: boolean;
  replies: number;
}

/**
 * Notification interface
 */
interface Notification {
  id: string;
  type: "me_too" | "can_help" | "upvote" | "reply" | "event" | "connection";
  title: string;
  message: string;
  avatar?: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
  questionId?: string;
  userId?: string;
}

/**
 * Message interface for chat system
 */
interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  questionId?: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  type: "text" | "image" | "file";
}

/**
 * Chat thread interface
 */
interface ChatThread {
  id: string;
  participants: string[];
  participantNames: string[];
  participantAvatars: string[];
  lastMessage?: Message;
  unreadCount: number;
  questionId?: string;
  questionTitle?: string;
  updatedAt: string;
}

/**
 * App state interface
 */
interface AppState {
  events: Event[];
  questions: Question[];
  notifications: Notification[];
  chatThreads: ChatThread[];
  messages: Record<string, Message[]>;
  activeFilters: string[];
  sortBy: "latest" | "most_uplifted" | "most_helpers" | "most_relatable" | "bookmarked";
  unreadNotifications: number;
  unreadMessages: number;
}

/**
 * App actions interface
 */
interface AppActions {
  // Events
  setEvents: (events: Event[]) => void;
  joinEvent: (eventId: string) => void;
  checkInEvent: (eventId: string) => void;
  
  // Questions
  setQuestions: (questions: Question[]) => void;
  addQuestion: (question: Omit<Question, "id" | "createdAt">) => void;
  updateQuestion: (questionId: string, updates: Partial<Question>) => void;
  toggleUpvote: (questionId: string) => void;
  toggleMeToo: (questionId: string) => void;
  toggleBookmark: (questionId: string) => void;
  
  // Filtering and sorting
  setActiveFilters: (filters: string[]) => void;
  setSortBy: (sortBy: AppState["sortBy"]) => void;
  
  // Notifications
  setNotifications: (notifications: Notification[]) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  
  // Messages
  setChatThreads: (threads: ChatThread[]) => void;
  setMessages: (threadId: string, messages: Message[]) => void;
  addMessage: (threadId: string, message: Omit<Message, "id" | "createdAt">) => void;
  markMessagesRead: (threadId: string) => void;
}

/**
 * Main app store using Zustand
 */
export const useAppStore = create<AppState & AppActions>((set, get) => ({
  // Initial state
  events: [],
  questions: [],
  notifications: [],
  chatThreads: [],
  messages: {},
  activeFilters: ["all"],
  sortBy: "latest",
  unreadNotifications: 0,
  unreadMessages: 0,

  // Event actions
  setEvents: (events) => set({ events }),
  
  joinEvent: (eventId) => {
    set((state) => ({
      events: state.events.map((event) =>
        event.id === eventId
          ? { ...event, isJoined: true, attendeeCount: event.attendeeCount + 1 }
          : event
      ),
    }));
  },
  
  checkInEvent: (eventId) => {
    set((state) => ({
      events: state.events.map((event) =>
        event.id === eventId ? { ...event, isCheckedIn: true } : event
      ),
    }));
  },

  // Question actions
  setQuestions: (questions) => set({ questions }),
  
  addQuestion: (questionData) => {
    const newQuestion: Question = {
      ...questionData,
      id: `question-${Date.now()}`,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      meTooCount: 0,
      canHelpCount: 0,
      isUpvoted: false,
      isMeToo: false,
      isBookmarked: false,
      replies: 0,
    };
    
    set((state) => ({
      questions: [newQuestion, ...state.questions],
    }));
  },
  
  updateQuestion: (questionId, updates) => {
    set((state) => ({
      questions: state.questions.map((question) =>
        question.id === questionId ? { ...question, ...updates } : question
      ),
    }));
  },
  
  toggleUpvote: (questionId) => {
    set((state) => ({
      questions: state.questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              isUpvoted: !question.isUpvoted,
              upvotes: question.isUpvoted
                ? question.upvotes - 1
                : question.upvotes + 1,
            }
          : question
      ),
    }));
  },
  
  toggleMeToo: (questionId) => {
    set((state) => ({
      questions: state.questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              isMeToo: !question.isMeToo,
              meTooCount: question.isMeToo
                ? question.meTooCount - 1
                : question.meTooCount + 1,
            }
          : question
      ),
    }));
  },
  
  toggleBookmark: (questionId) => {
    set((state) => ({
      questions: state.questions.map((question) =>
        question.id === questionId
          ? { ...question, isBookmarked: !question.isBookmarked }
          : question
      ),
    }));
  },

  // Filter and sort actions
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  setSortBy: (sortBy) => set({ sortBy }),

  // Notification actions
  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadNotifications: unreadCount });
  },
  
  markNotificationRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      ),
      unreadNotifications: Math.max(0, state.unreadNotifications - 1),
    }));
  },
  
  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
      unreadNotifications: 0,
    }));
  },

  // Message actions
  setChatThreads: (threads) => {
    const unreadCount = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);
    set({ chatThreads: threads, unreadMessages: unreadCount });
  },
  
  setMessages: (threadId, messages) => {
    set((state) => ({
      messages: { ...state.messages, [threadId]: messages },
    }));
  },
  
  addMessage: (threadId, messageData) => {
    const newMessage: Message = {
      ...messageData,
      id: `message-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    set((state) => ({
      messages: {
        ...state.messages,
        [threadId]: [...(state.messages[threadId] || []), newMessage],
      },
    }));
  },
  
  markMessagesRead: (threadId) => {
    set((state) => {
      const thread = state.chatThreads.find((t) => t.id === threadId);
      if (!thread) return state;
      
      return {
        chatThreads: state.chatThreads.map((t) =>
          t.id === threadId ? { ...t, unreadCount: 0 } : t
        ),
        unreadMessages: Math.max(0, state.unreadMessages - thread.unreadCount),
      };
    });
  },
}));