import { DeckState } from "./deck-state";

export class GameState {
    readonly playerDeck: DeckState = new DeckState();
    readonly mulliganOver: boolean = false;
}