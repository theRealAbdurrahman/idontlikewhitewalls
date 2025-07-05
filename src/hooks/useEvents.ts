import { useAppStore } from "../stores/appStore";

export const useEvents = () => {
    const store = useAppStore();
    // get event by id from store
    const getEventByID = (id: string) => {
        return store.events.find(event => event.id === id);
    };

    return {
        getEventByID
    };
}