import { Set, SetCard } from "../set";
import { CardHistory } from "../card-history";

export class BinderState {
    readonly currentView: string = 'sets';
    readonly menuDisplayType: string = 'menu';
    readonly selectedFormat: string = 'standard';
    readonly allSets: ReadonlyArray<Set> = []; 
    readonly cardList: ReadonlyArray<SetCard> = [];
    readonly selectedSet: Set;
    readonly selectedCard: SetCard;
    readonly searchString: string;
    readonly searchResults: ReadonlyArray<SetCard> = [];
    readonly cardHistory: ReadonlyArray<CardHistory> = [];
    readonly shownCardHistory: ReadonlyArray<CardHistory> = [];
    readonly showOnlyNewCardsInHistory: boolean = false;
    readonly totalHistoryLength: number;
}