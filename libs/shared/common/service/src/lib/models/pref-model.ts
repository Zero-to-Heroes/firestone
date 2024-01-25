// TODO: this has been copy-pasted from the models everywhere just to remove

import { allDuelsHeroes } from '@firestone-hs/reference-data';

// external dependencies. We should find a better way to do this
export type CurrentAppType =
	| 'collection'
	| 'achievements'
	| 'decktracker'
	| 'replays'
	| 'battlegrounds'
	| 'mercenaries'
	| 'general'
	| 'duels'
	| 'arena'
	| 'tavern-brawl'
	| 'profile'
	| 'streams'
	| 'mailbox'
	| 'live';
export type LotteryTabType = 'lottery' | 'achievements';
export type AchievementsCompletedFilterType = 'ALL_ACHIEVEMENTS' | 'ONLY_MISSING' | 'ONLY_COMPLETED';
export type StatGameFormatType = 'unknown' | 'all' | 'standard' | 'wild' | 'classic' | 'twist';
export type CollectionPortraitCategoryFilter = 'collectible' | 'battlegrounds' | 'mercenaries' | 'book-of-mercs';
export type CollectionPortraitOwnedFilter = 'all' | 'own' | 'dontown';
export type CollectionCardRarityFilterType = 'all' | 'common' | 'rare' | 'epic' | 'legendary';
export type CollectionCardOwnedFilterType =
	| 'all'
	| 'own'
	| 'missingplayablecopies'
	| 'goldenown'
	| 'dontown'
	| 'notpremiumnotcompleted'
	| 'notcompleted';
export type CollectionCardClassFilterType =
	| 'all'
	| 'deathknight'
	| 'demonhunter'
	| 'druid'
	| 'hunter'
	| 'mage'
	| 'paladin'
	| 'priest'
	| 'rogue'
	| 'shaman'
	| 'warlock'
	| 'warrior';
export type StatGameModeType =
	| 'unknown'
	| 'arena'
	| 'arena-draft'
	| 'casual'
	| 'friendly'
	| 'practice'
	| 'ranked'
	| 'tutorial'
	| 'tavern-brawl'
	| 'battlegrounds'
	| 'battlegrounds-friendly'
	| 'duels'
	| 'mercenaries-ai-vs-ai'
	| 'mercenaries-pve'
	| 'mercenaries-pve-coop'
	| 'mercenaries-pvp'
	| 'mercenaries-friendly'
	| 'paid-duels';
export type DeckTimeFilterType = 'all-time' | 'season-start' | 'last-patch' | 'past-30' | 'past-7' | 'past-1';
export type DeckSortType = 'last-played' | 'games-played' | 'winrate';
export type DeckRankFilterType =
	| 'all'
	// | 'bronze'
	| 'silver'
	| 'gold'
	| 'platinum'
	| 'diamond'
	| 'legend'
	| 'legend-500';
export type MmrGroupFilterType = 'per-match' | 'per-day';
export type DeckRankingCategoryType = 'leagues' | 'legend';
export type DecktrackerViewType =
	| 'decks'
	| 'ladder-stats'
	| 'ladder-ranking'
	| 'replays'
	| 'deck-details'
	| 'constructed-meta-decks'
	| 'constructed-meta-deck-details'
	| 'constructed-meta-archetypes'
	| 'constructed-meta-archetype-details'
	| 'constructed-deckbuilder';
export type ConstructedStatsTab = 'overview' | 'matchups';
export type ConstructedMetaDecksDustFilterType = 'all' | number;
export type BgsActiveTimeFilterType = 'all-time' | 'past-three' | 'past-seven' | 'last-patch';
export type BgsRankFilterType = 100 | 50 | 25 | 10 | 1;
export type BgsQuestActiveTabType = 'quests' | 'rewards';
export type BgsHeroSortFilterType = 'tier' | 'average-position' | 'games-played' | 'mmr' | 'last-played';
export type BgsStatsFilterId =
	| 'hp-by-turn'
	| 'warband-total-stats-by-turn'
	| 'warband-composition-by-turn'
	| 'stats'
	| 'winrate-per-turn'
	// For stats of past games
	| 'battles';
export type DuelsHeroSortFilterType = 'player-winrate' | 'global-winrate' | 'games-played';
export type DuelsDeckSortFilterType = 'last-played' | 'winrate';
export type DuelsHeroFilterType = typeof allDuelsHeroes[number][];
export type DuelsTimeFilterType = 'all-time' | 'past-three' | 'past-seven' | 'last-patch';
export type DuelsGameModeFilterType = 'all' | 'duels' | 'paid-duels';
export type DuelsStatTypeFilterType = 'hero' | 'hero-power' | 'signature-treasure';
export type DuelsTreasureStatTypeFilterType =
	| 'treasure-1'
	| 'treasure-2'
	| 'treasure-3'
	| 'passive-1'
	| 'passive-2'
	| 'passive-3';
export type DuelsTopDecksDustFilterType = 'all' | '3200' | '1600' | '400' | '100' | '40' | '0';
export type MercenariesHeroLevelFilterType = 0 | 1 | 5 | 15 | 30; // 0 for all levels
export type MercenariesModeFilterType = 'pve' | 'pvp';
export type MercenariesPveDifficultyFilterType = 'all' | 'normal' | 'heroic' | 'legendary';
export type MercenariesPvpMmrFilterType = 100 | 50 | 25 | 10 | 5 | 1;
export type MercenariesRoleFilterType = 'all' | 'caster' | 'fighter' | 'protector';
export type MercenariesStarterFilterType = 'all' | 'starter' | 'bench';
export type MercenariesFullyUpgradedFilterType = 'all' | 'upgraded' | 'non-upgraded';
export type MercenariesOwnedFilterType = 'all' | 'owned' | 'non-owned';
export type MercenariesPersonalHeroesSortCriteriaType =
	| 'level'
	| 'role'
	| 'name'
	| 'xp-in-level'
	| 'coins-left'
	| 'coins-needed-to-max'
	| 'coins-to-farm-to-max'
	| 'task-progress';
export type MercenariesPersonalHeroesSortCriteriaDirection = 'asc' | 'desc';
export type ArenaClassFilterType =
	| 'all'
	| 'deathknight'
	| 'demonhunter'
	| 'druid'
	| 'hunter'
	| 'mage'
	| 'paladin'
	| 'priest'
	| 'rogue'
	| 'shaman'
	| 'warrior'
	| 'warlock';
export type ArenaCardClassFilterType = ArenaClassFilterType | 'neutral' | 'no-neutral';
export type ArenaTimeFilterType = 'all-time' | 'past-three' | 'past-seven' | 'last-patch';
export type ArenaCardTypeFilterType = 'all' | 'legendary' | 'treasure' | 'other';
export type StatsXpGraphSeasonFilterType =
	| 'all-seasons'
	| 'season-1'
	| 'season-2'
	| 'season-3'
	| 'season-4'
	| 'season-5'
	| 'season-6'
	| 'season-7'
	| 'season-8'
	| 'season-9';
export type FtueKey = undefined | 'hasSeenAchievementsLoginButton' | 'hasSeenGlobalFtue';
export type ReplaysFilterCategoryType = 'gameMode' | 'deckstring' | 'bg-hero' | 'player-class' | 'opponent-class';

export interface MercenariesPersonalHeroesSortCriteria {
	readonly criteria: MercenariesPersonalHeroesSortCriteriaType;
	readonly direction: MercenariesPersonalHeroesSortCriteriaDirection;
}
export interface ConstructedDeckVersions {
	readonly versions: readonly ConstructedDeckVersion[];
}
export interface ConstructedDeckVersion {
	readonly deckstring: string;
	// Leave the option to name the version, or add comments
}
export class DeckFilters {
	readonly gameFormat: StatGameFormatType = 'all';
	readonly gameMode: StatGameModeType = 'ranked';
	readonly time: DeckTimeFilterType = 'all-time';
	readonly sort: DeckSortType = 'last-played';
	readonly rank: DeckRankFilterType = 'all';
	readonly rankingGroup: MmrGroupFilterType = 'per-match';
	readonly rankingCategory: DeckRankingCategoryType = 'leagues';
}
export class Ftue {
	readonly hasSeenGlobalFtue: boolean = false;
	readonly hasSeenAchievementsLoginButton: boolean = false;
}
