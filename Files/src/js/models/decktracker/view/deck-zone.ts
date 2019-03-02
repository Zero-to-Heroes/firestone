import { DeckCard } from "../deck-card";

export interface DeckZone {
    readonly id: string;
    readonly name: string;
    readonly cards: ReadonlyArray<DeckCard>;
}