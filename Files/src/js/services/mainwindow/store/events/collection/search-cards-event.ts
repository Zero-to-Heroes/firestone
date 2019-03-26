import { MainWindowStoreEvent } from "../main-window-store-event";

export class SearchCardsEvent implements MainWindowStoreEvent {
    readonly searchString: string;

    constructor(searchString: string) {
        this.searchString = searchString;
    }
}