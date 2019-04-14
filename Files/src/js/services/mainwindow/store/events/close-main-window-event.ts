import { MainWindowStoreEvent } from "./main-window-store-event";

export class CloseMainWindowEvent implements MainWindowStoreEvent {

    public eventName(): string {
        return 'CloseMainWindowEvent';
    }

    public static eventName(): string {
        return 'CloseMainWindowEvent';
    }
}