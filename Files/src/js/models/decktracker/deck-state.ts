import { Map } from 'immutable';
import { DeckCard } from './deck-card';

export class DeckState {
    readonly name: string;
    readonly deckList: ReadonlyArray<DeckCard> = [];

    readonly graveyard: ReadonlyArray<DeckCard> = [];
    readonly hand: ReadonlyArray<DeckCard> = [];
    readonly deck: ReadonlyArray<DeckCard> = [];
    readonly otherZone: ReadonlyArray<DeckCard> = [];
}