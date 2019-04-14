import { MainWindowStoreEvent } from "../main-window-store-event";

export class ToggleShowOnlyNewCardsInHistoryEvent implements MainWindowStoreEvent {

    
    public eventName(): string {
        return 'ToggleShowOnlyNewCardsInHistoryEvent';
    }

    public static eventName(): string {
        return 'ToggleShowOnlyNewCardsInHistoryEvent';
    }
}