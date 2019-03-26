import { MainWindowStoreEvent } from "../main-window-store-event";

export class UpdateCardSearchResultsEvent implements MainWindowStoreEvent {
    readonly searchString: string;

    constructor(searchString: string) {
        this.searchString = searchString;
    }
}