import { CollectionCardType } from '@firestone-hs/user-packs';

export interface InternalCardInfo {
	readonly cardId: string;
	readonly cardType: CollectionCardType;
	readonly isNew: boolean;
	readonly isSecondCopy: boolean;
	readonly currencyAmount: number;
	readonly mercenaryCardId: string;
}
