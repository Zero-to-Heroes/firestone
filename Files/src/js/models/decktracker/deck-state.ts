import { Map } from 'immutable';
import { DeckCard } from './deck-card';
import { HeroCard } from './hero-card';

export class DeckState {
    readonly name: string;
    readonly hero: HeroCard;
    readonly deckList: ReadonlyArray<DeckCard> = [];

    readonly graveyard: ReadonlyArray<DeckCard> = [];
    readonly hand: ReadonlyArray<DeckCard> = [];
    readonly deck: ReadonlyArray<DeckCard> = [];
    readonly otherZone: ReadonlyArray<DeckCard> = [];
}