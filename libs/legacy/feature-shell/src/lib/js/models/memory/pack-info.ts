import { BoosterType } from '@firestone-hs/reference-data';

export interface PackInfo {
	readonly BoosterId: BoosterType;
	readonly Cards: readonly CardPackInfo[];
}

export interface CardPackInfo {
	readonly CardId: string;
	readonly IsNew: boolean;
	readonly Premium: number;
	readonly TotalCount: number;
	readonly CurrencyAmount: number;
	readonly MercenaryArtVariationId: number;
	readonly MercenaryArtVariationPremium: number;
	readonly MercenaryId: number;
}
