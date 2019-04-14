import { MainWindowStoreEvent } from "../main-window-store-event";

export class LoadMoreCardHistoryEvent implements MainWindowStoreEvent {
    readonly maxResults: number;

    constructor(maxResults: number) {
        this.maxResults = maxResults;
    }
    
    public eventName(): string {
        return 'LoadMoreCardHistoryEvent';
    }

    public static eventName(): string {
        return 'LoadMoreCardHistoryEvent';
    }
}