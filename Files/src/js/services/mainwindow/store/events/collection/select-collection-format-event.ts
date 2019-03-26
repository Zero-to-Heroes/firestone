import { MainWindowStoreEvent } from "../main-window-store-event";

export class SelectCollectionFormatEvent implements MainWindowStoreEvent {
    readonly format: string;

    constructor(format: string) {
        this.format = format;
    }
}