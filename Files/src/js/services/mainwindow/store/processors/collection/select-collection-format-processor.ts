import { Processor } from "../processor";
import { MainWindowState } from "../../../../../models/mainwindow/main-window-state";
import { BinderState } from "../../../../../models/mainwindow/binder-state";
import { SelectCollectionFormatEvent } from "../../events/collection/select-collection-format-event";

export class SelectCollectionFormatProcessor implements Processor {

    public async process(event: SelectCollectionFormatEvent, currentState: MainWindowState): Promise<MainWindowState> {
        const newBinder = Object.assign(new BinderState(), currentState.binder, {
            currentView: 'sets',
            menuDisplayType: 'menu',
            selectedSet: undefined,
            selectedFormat: event.format,
            searchString: undefined,
            selectedCard: undefined,
        } as BinderState)
        return Object.assign(new MainWindowState(), currentState, {
            isVisible: true,
            currentApp: 'collection',
            binder: newBinder,
        } as MainWindowState)
    }
}