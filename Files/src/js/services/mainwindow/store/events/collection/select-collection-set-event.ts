import { MainWindowStoreEvent } from "../main-window-store-event";

export class SelectCollectionSetEvent implements MainWindowStoreEvent {
    readonly setId: string;

    constructor(setId: string) {
        this.setId = setId;
    }
}