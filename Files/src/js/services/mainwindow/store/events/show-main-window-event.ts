import { MainWindowStoreEvent } from "./main-window-store-event";

export class ShowMainWindowEvent implements MainWindowStoreEvent {

    public eventName(): string {
        return 'ShowMainWindowEvent';
    }

    public static eventName(): string {
        return 'ShowMainWindowEvent';
    }
}