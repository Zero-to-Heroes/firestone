import { MainWindowStoreEvent } from "../main-window-store-event";

export class UpdateTwitterSocialInfoEvent implements MainWindowStoreEvent {

    public eventName(): string {
        return 'UpdateTwitterSocialInfoEvent';
    }

    public static eventName(): string {
        return 'UpdateTwitterSocialInfoEvent';
    }
}