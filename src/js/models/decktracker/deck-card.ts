import { CardMetaInfo } from './card-meta-info';

export class DeckCard {
	readonly cardId: string;
	readonly entityId: number;
	readonly cardName: string;
	readonly manaCost: number;
	readonly rarity: string;
	readonly creatorCardId?: string;
	// readonly totalQuantity: number;
	readonly zone: 'DISCARD' | 'BURNED' | 'PLAY' | 'SETASIDE' | 'SECRET' | 'HAND'; // Optional, should only be read when in the Other zone
	readonly metaInfo: CardMetaInfo = new CardMetaInfo();
}
