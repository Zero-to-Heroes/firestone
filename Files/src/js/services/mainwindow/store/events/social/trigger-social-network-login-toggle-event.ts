import { MainWindowStoreEvent } from "../main-window-store-event";

export class TriggerSocialNetworkLoginToggleEvent implements MainWindowStoreEvent {
    readonly network: string;

    constructor(network: string) {
        this.network = network;
    }
}