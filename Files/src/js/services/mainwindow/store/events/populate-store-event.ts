import { MainWindowStoreEvent } from "./main-window-store-event";

export class PopulateStoreEvent implements MainWindowStoreEvent {

    public eventName(): string {
        return 'PopulateStoreEvent';
    }

    public static eventName(): string {
        return 'PopulateStoreEvent';
    }
}