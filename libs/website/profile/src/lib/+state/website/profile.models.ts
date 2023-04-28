import { CardsForSet, ProfileSet } from '@firestone-hs/api-user-profile';

export interface WebsiteProfileState {
	loaded: boolean;
	error?: string | null;

	sets?: readonly ExtendedProfileSet[];
}

export interface ExtendedProfileSet extends ProfileSet {
	readonly totalCollectibleCards: number;
	readonly global: ExtendedCardsForSet;
	readonly golden: ExtendedCardsForSet;
}

export interface ExtendedCardsForSet extends CardsForSet {
	readonly totalCollectedCards: number;
}
