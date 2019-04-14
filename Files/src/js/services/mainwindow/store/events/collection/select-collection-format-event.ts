import { MainWindowStoreEvent } from "../main-window-store-event";

export class SelectCollectionFormatEvent implements MainWindowStoreEvent {
    readonly format: string;

    constructor(format: string) {
        this.format = format;
    }
    
    public eventName(): string {
        return 'SelectCollectionFormatEvent';
    }

    public static eventName(): string {
        return 'SelectCollectionFormatEvent';
    }
}