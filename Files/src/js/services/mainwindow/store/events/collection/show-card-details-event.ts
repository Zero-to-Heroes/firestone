import { MainWindowStoreEvent } from "../main-window-store-event";

export class ShowCardDetailsEvent implements MainWindowStoreEvent {
    readonly cardId: string;

    constructor(cardId: string) {
        this.cardId = cardId;
    }
    
    public eventName(): string {
        return 'ShowCardDetailsEvent';
    }

    public static eventName(): string {
        return 'ShowCardDetailsEvent';
    }
}