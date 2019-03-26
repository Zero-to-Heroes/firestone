import { MainWindowStoreEvent } from "../main-window-store-event";

export class LoadMoreCardHistoryEvent implements MainWindowStoreEvent {
    readonly maxResults: number;

    constructor(maxResults: number) {
        this.maxResults = maxResults;
    }
}