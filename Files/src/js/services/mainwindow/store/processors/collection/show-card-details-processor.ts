import { Processor } from "../processor";
import { MainWindowState } from "../../../../../models/mainwindow/main-window-state";
import { BinderState } from "../../../../../models/mainwindow/binder-state";
import { Set, SetCard } from "../../../../../models/set";
import { ShowCardDetailsEvent } from "../../events/collection/show-card-details-event";

export class ShowCardDetailsProcessor implements Processor {

    public async process(event: ShowCardDetailsEvent, currentState: MainWindowState): Promise<MainWindowState> {
        const selectedSet: Set = this.pickSet(currentState.binder.allSets, event.cardId);
        const selectedCard: SetCard = this.pickCard(selectedSet, event.cardId);
        const newBinder = Object.assign(new BinderState(), currentState.binder, {
            currentView: 'card-details',
            menuDisplayType: 'breadcrumbs',
            selectedSet: selectedSet,
            selectedCard: selectedCard,
            selectedFormat: selectedSet.standard ? 'standard' : 'wild',
            searchString: undefined,
        } as BinderState)
        return Object.assign(new MainWindowState(), currentState, {
            isVisible: true,
            currentApp: 'collection',
            binder: newBinder,
        } as MainWindowState)
    }

    private pickCard(selectedSet: Set, cardId: string): SetCard {
        return selectedSet.allCards.find((card) => card.id == cardId);
    }

    private pickSet(allSets: ReadonlyArray<Set>, cardId: string): Set {
        return allSets
                .find((set) => set.allCards.some((card) => card.id === cardId));
    }
}