import { CardsForSet, Profile, ProfileAchievementCategory, ProfileSet } from '@firestone-hs/api-user-profile';

export interface WebsiteProfileState {
	loaded: boolean;
	error?: string | null;

	profile?: ExtendedProfile;
	showingShareDialog?: boolean;
	shareStatusMessage?: ShareStatusMessageType;
	shareAlias?: string | null;
	watchingOtherPlayer?: string | null;
}

export type ShareStatusMessageType = 'sharing' | 'existing-alias' | 'success' | 'error';

export interface ExtendedProfile extends Profile {
	readonly sets?: readonly ExtendedProfileSet[];
	readonly achievementCategories?: readonly ExtendedProfileAchievementCategory[];
}

export interface ExtendedProfileSet extends ProfileSet {
	readonly totalCollectibleCards: number;
	readonly global: ExtendedCardsForSet;
	readonly golden: ExtendedCardsForSet;
}

export interface ExtendedCardsForSet extends CardsForSet {
	readonly totalCollectedCards: number;
}

export interface ExtendedProfileAchievementCategory extends ProfileAchievementCategory {
	readonly empty: boolean;
	readonly complete: boolean;
	readonly displayName: string;
	readonly categoryIcon: string;
}
