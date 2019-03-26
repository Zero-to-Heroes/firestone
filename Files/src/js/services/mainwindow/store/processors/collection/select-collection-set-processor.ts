import { Processor } from "../processor";
import { MainWindowState } from "../../../../../models/mainwindow/main-window-state";
import { BinderState } from "../../../../../models/mainwindow/binder-state";
import { SelectCollectionSetEvent } from "../../events/collection/select-collection-set-event";
import { Set } from "../../../../../models/set";

export class SelectCollectionSetProcessor implements Processor {

    public async process(event: SelectCollectionSetEvent, currentState: MainWindowState): Promise<MainWindowState> {
        const selectedSet: Set = currentState.binder.allSets.find((set) => set.id === event.setId);
        const newBinder = Object.assign(new BinderState(), currentState.binder, {
            currentView: 'cards',
            menuDisplayType: 'breadcrumbs',
            selectedSet: selectedSet,
            selectedFormat: selectedSet.standard ? 'standard' : 'wild',
            cardList: selectedSet.allCards,
            searchString: undefined,
            selectedCard: undefined,
        } as BinderState)
        return Object.assign(new MainWindowState(), currentState, {
            isVisible: true,
            currentApp: 'collection',
            binder: newBinder,
        } as MainWindowState);
    }
}