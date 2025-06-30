import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import {
    useReadEventsApiV1EventsGet,
    useReadQuestionsApiV1QuestionsGet,
    useReadInteractionsApiV1InteractionsGet,
} from '../api-client/api-client';
import { useAppStore } from '../stores/appStore';
import { useAuth } from './AuthProvider';

/**
 * Data Context Interface
 * Handles all application data fetching and synchronization
 */
interface DataContextType {
    isLoading: boolean;
    error: string | null;
    refetchAll: () => void;
}

/**
 * Data Context
 */
const DataContext = createContext<DataContextType | undefined>(undefined);

/**
 * Data Provider Props
 */
interface DataProviderProps {
    children: ReactNode;
}

/**
 * Data Provider Component
 * 
 * This component:
 * - Fetches all application data (events, questions, interactions)
 * - Transforms API data to app format
 * - Manages data loading states
 * - Provides data refresh functionality
 * 
 * Separated from AuthProvider to maintain single responsibility
 */
export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const {
        setEvents,
        setQuestions,
        setNotifications,
        setUnreadNotifications
    } = useAppStore();

    // API queries - only fetch when authenticated
    const {
        data: eventsData,
        isLoading: eventsLoading,
        error: eventsError,
        refetch: refetchEvents
    } = useReadEventsApiV1EventsGet();

    const {
        data: questionsData,
        isLoading: questionsLoading,
        error: questionsError,
        refetch: refetchQuestions
    } = useReadQuestionsApiV1QuestionsGet();

    const {
        data: interactionsData,
        isLoading: interactionsLoading,
        error: interactionsError,
        refetch: refetchInteractions
    } = useReadInteractionsApiV1InteractionsGet();

    /**
     * Transform and load events data
     */
    useEffect(() => {
        if (eventsData?.data && isAuthenticated) {
            const getEventsArray = (data: any) => {
                if (Array.isArray(data)) {
                    return data;
                } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
                    return data.data;
                }
                return [];
            };

            const eventsArray = getEventsArray(eventsData.data);

            const transformedEvents = eventsArray.map((event: any) => ({
                id: event.id,
                name: event.name,
                description: event.description || "",
                location: event.location || "",
                date: event.start_date,
                endDate: event.end_date,
                image: event.banner_image,
                organizerId: event.creator_id,
                organizerName: "Event Organizer", // TODO: Fetch actual organizer data
                attendeeCount: 0, // TODO: Get from participants
                isCheckedIn: false, // TODO: Determine from user's participation
                isJoined: false, // TODO: Determine from user's participation
                tags: event.tags || [],
                category: "General",
                website: event.event_url,
                maxAttendees: undefined,
                price: undefined,
                currency: "EUR",
                status: "upcoming" as const,
            }));

            setEvents(transformedEvents);
        }
    }, [eventsData, isAuthenticated, setEvents]);

    /**
     * Transform and load questions data
     */
    useEffect(() => {
        if (questionsData?.data && isAuthenticated) {
            const getQuestionsArray = (data: any) => {
                if (Array.isArray(data)) {
                    return data;
                } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
                    return data.data;
                }
                return [];
            };

            const questionsArray = getQuestionsArray(questionsData.data);

            const transformedQuestions = questionsArray.map((question: any) => ({
                id: question.id,
                authorId: question.user_id,
                authorName: "Question Author", // TODO: Fetch user data
                authorAvatar: undefined,
                eventId: question.event_id,
                eventName: undefined, // TODO: Match with events
                title: question.title,
                description: question.content,
                image: undefined,
                tags: question.tags || [],
                createdAt: question.created_at || new Date().toISOString(),
                visibility: "anyone" as const,
                isAnonymous: question.is_anonymous || false,
                upvotes: 0, // TODO: Calculate from interactions
                meTooCount: 0, // TODO: Calculate from interactions
                canHelpCount: 0, // TODO: Calculate from interactions
                isUpvoted: false, // TODO: Determine from user's interactions
                isMeToo: false, // TODO: Determine from user's interactions
                isBookmarked: false, // TODO: Determine from user's interactions
                replies: 0,
            }));

            setQuestions(transformedQuestions);
        }
    }, [questionsData, isAuthenticated, setQuestions]);

    /**
     * Transform and load interactions data (notifications)
     */
    useEffect(() => {
        if (interactionsData?.data && isAuthenticated && user?.id) {
            const getInteractionsArray = (data: any) => {
                if (Array.isArray(data)) {
                    return data;
                } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
                    return data.data;
                }
                return [];
            };

            const interactionsArray = getInteractionsArray(interactionsData.data);

            const transformedNotifications = interactionsArray
                .filter((interaction: any) => interaction.user_id !== user.id) // Exclude own interactions
                .slice(0, 10) // Limit to recent notifications
                .map((interaction: any) => ({
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
            setUnreadNotifications(transformedNotifications.filter((n: any) => !n.isRead).length);
        }
    }, [interactionsData, isAuthenticated, user?.id, setNotifications, setUnreadNotifications]);

    /**
     * Refetch all data
     */
    const refetchAll = () => {
        if (isAuthenticated) {
            refetchEvents();
            refetchQuestions();
            refetchInteractions();
        }
    };

    // Calculate overall loading state
    const isLoading = eventsLoading || questionsLoading || interactionsLoading;

    // Calculate overall error state
    const error = eventsError?.message || questionsError?.message || interactionsError?.message || null;

    const value: DataContextType = {
        isLoading,
        error,
        refetchAll,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

/**
 * Hook to use data context
 */
export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
