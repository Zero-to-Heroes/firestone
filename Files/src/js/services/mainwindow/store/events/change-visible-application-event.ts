import { MainWindowStoreEvent } from "./main-window-store-event";

export class ChangeVisibleApplicationEvent implements MainWindowStoreEvent {
    readonly module: string;

    constructor(module: string) {
        this.module = module;
    }
}