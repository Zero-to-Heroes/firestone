import { DeckCard } from "../deck-card";

export interface DeckZone {
    readonly name;
    readonly cards: ReadonlyArray<DeckCard>;
}