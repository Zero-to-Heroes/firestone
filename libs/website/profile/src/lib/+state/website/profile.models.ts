import { CardsForSet, ProfileSet } from '@firestone-hs/api-user-profile';

export interface WebsiteProfileState {
	loaded: boolean;
	error?: string | null;

	sets?: readonly ExtendedProfileSet[];
	showingShareDialog?: boolean;
	shareStatusMessage?: ShareStatusMessageType;
	shareAlias?: string | null;
	watchingOtherPlayer?: string | null;
}

export type ShareStatusMessageType = 'sharing' | 'existing-alias' | 'success' | 'error';

export interface ExtendedProfileSet extends ProfileSet {
	readonly totalCollectibleCards: number;
	readonly global: ExtendedCardsForSet;
	readonly golden: ExtendedCardsForSet;
}

export interface ExtendedCardsForSet extends CardsForSet {
	readonly totalCollectedCards: number;
}
