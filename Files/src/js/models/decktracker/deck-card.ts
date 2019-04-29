export class DeckCard {
    readonly cardId: string;
    readonly entityId: number;
    readonly cardName: string;
    readonly manaCost: number;
    readonly rarity: string;
    // readonly totalQuantity: number;
    readonly zone: string; // Optional, should only be read when in the Other zone
}