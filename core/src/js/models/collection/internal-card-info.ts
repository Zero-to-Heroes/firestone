import { CollectionCardType } from './collection-card-type.type';

export interface InternalCardInfo {
	readonly cardId: string;
	readonly cardType: CollectionCardType;
	readonly isNew: boolean;
	readonly isSecondCopy: boolean;
	readonly currencyAmount: number;
	readonly mercenaryCardId: string;
}
