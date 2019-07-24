import { Map } from 'immutable';
import { DeckCard } from './deck-card';
import { HeroCard } from './hero-card';
import { DynamicZone } from './view/dynamic-zone';

export class DeckState {
    readonly deckstring?: string;
    readonly name?: string;
    readonly hero?: HeroCard;
    readonly deckList: ReadonlyArray<DeckCard> = [];

    // Graveyard is not so easy in fact - we want to know the cards that 
    // can be interacted with, which means dead minions for Priest, or 
    // discarded cards for warlock (if the warlock decks contains specific
    // cards)
    // readonly graveyard: ReadonlyArray<DeckCard> = [];
    readonly hand: ReadonlyArray<DeckCard> = [];
    readonly deck: ReadonlyArray<DeckCard> = [];
    readonly board: ReadonlyArray<DeckCard> = [];
    readonly otherZone: ReadonlyArray<DeckCard> = [];
    readonly dynamicZones: ReadonlyArray<DynamicZone> = [];
}