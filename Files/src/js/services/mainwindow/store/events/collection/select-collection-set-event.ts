import { MainWindowStoreEvent } from "../main-window-store-event";

export class SelectCollectionSetEvent implements MainWindowStoreEvent {
    readonly setId: string;

    constructor(setId: string) {
        this.setId = setId;
    }
    
    public eventName(): string {
        return 'SelectCollectionSetEvent';
    }

    public static eventName(): string {
        return 'SelectCollectionSetEvent';
    }
}