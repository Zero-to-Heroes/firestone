import { Race } from '@firestone-hs/reference-data';
import 'reflect-metadata';
import { OutOfCardsToken } from '../services/mainwindow/out-of-cards.service';
import { ArenaClassFilterType } from './arena/arena-class-filter.type';
import { ArenaTimeFilterType } from './arena/arena-time-filter.type';
import { BgsStatsFilterId } from './battlegrounds/post-match/bgs-stats-filter-id.type';
import { CollectionPortraitCategoryFilter, CollectionPortraitOwnedFilter } from './collection/filter-types';
import { DuelsGameModeFilterType } from './duels/duels-game-mode-filter.type';
import { DuelsHeroFilterType } from './duels/duels-hero-filter.type';
import { DuelsHeroSortFilterType } from './duels/duels-hero-sort-filter.type';
import { DuelsStatTypeFilterType } from './duels/duels-stat-type-filter.type';
import { DuelsTimeFilterType } from './duels/duels-time-filter.type';
import { DuelsTopDecksDustFilterType } from './duels/duels-top-decks-dust-filter.type';
import { DuelsTreasureStatTypeFilterType } from './duels/duels-treasure-stat-type-filter.type';
import { AchievementsCompletedFilterType } from './mainwindow/achievement/filter-types';
import { BgsActiveTimeFilterType } from './mainwindow/battlegrounds/bgs-active-time-filter.type';
import { BgsHeroSortFilterType } from './mainwindow/battlegrounds/bgs-hero-sort-filter.type';
import { BgsRankFilterType } from './mainwindow/battlegrounds/bgs-rank-filter.type';
import { MmrGroupFilterType } from './mainwindow/battlegrounds/mmr-group-filter-type';
import { CurrentAppType } from './mainwindow/current-app.type';
import { DeckFilters } from './mainwindow/decktracker/deck-filters';
import { StatGameFormatType } from './mainwindow/stats/stat-game-format.type';
import { StatsXpGraphSeasonFilterType } from './mainwindow/stats/stats-xp-graph-season-filter.type';
import { MemoryVisitor } from './memory/memory-mercenaries-collection-info';
import {
	MercenariesFullyUpgradedFilterType,
	MercenariesHeroLevelFilterType,
	MercenariesModeFilterType,
	MercenariesPveDifficultyFilterType,
	MercenariesPvpMmrFilterType,
	MercenariesRoleFilterType,
	MercenariesStarterFilterType,
} from './mercenaries/mercenaries-filter-types';
import { MercenariesPersonalHeroesSortCriteria } from './mercenaries/personal-heroes-sort-criteria.type';
import { Ftue } from './preferences/ftue';

export const FORCE_LOCAL_PROP = 'forceLocalProp';

export class Preferences {
	public static deserialize(input: Preferences): Preferences {
		return {
			...input,
			lastUpdateDate: input.lastUpdateDate ? new Date(input.lastUpdateDate) : null,
			currentSessionStartDate: input.currentSessionStartDate ? new Date(input.currentSessionStartDate) : null,
		};
	}

	readonly lastUpdateDate: Date;
	readonly id: number = 1;

	readonly locale: string = 'enUS';

	readonly launchAppOnGameStart: boolean = true;
	readonly showSessionRecapOnExit: boolean = true;
	readonly shareGamesWithVS: boolean = true;
	readonly setAllNotifications: boolean = true;
	readonly contactEmail: string;
	readonly lastSeenReleaseNotes: string;
	readonly dontShowNewVersionNotif: boolean = false;
	readonly globalZoomLevel: number = 100;
	readonly flashWindowOnYourTurn: boolean = true;

	readonly advancedModeToggledOn: boolean;

	readonly currentMainVisibleSection: CurrentAppType = 'decktracker';

	readonly showCurrentSessionWidgetBgs: boolean = false;
	readonly currentSessionStartDate: Date = null;
	readonly sessionWidgetShowGroup: boolean = true;
	readonly sessionWidgetShowMatches: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly currentSessionWidgetScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly currentSessionWidgetPosition: { left: number; top: number };

	readonly achievementsEnabled2 = false;
	readonly achievementsLiveTracking2: boolean = false;
	readonly achievementsDisplayNotifications2 = false;
	readonly achievementsCompletedActiveFilter: AchievementsCompletedFilterType = 'ALL_ACHIEVEMENTS';
	readonly resetAchievementsOnAppStart = false;

	// TODO: both should be removed
	readonly dontConfirmVideoReplayDeletion: boolean;
	readonly hasSeenVideoCaptureChangeNotif: boolean;

	readonly showXpRecapAtGameEnd: boolean = false;

	readonly collectionUseOverlay: boolean;
	readonly collectionSelectedFormat: StatGameFormatType = 'all';
	readonly collectionEnableNotifications: boolean = true;
	readonly showDust: boolean = true;
	readonly showCommon: boolean = true;
	readonly showCardsOutsideOfPacks: boolean = true;
	readonly collectionHistoryShowOnlyNewCards: boolean = false;
	readonly collectionUseHighResImages: boolean = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly collectionCardScale: number = 100;
	readonly collectionSetShowGoldenStats: boolean = false;
	readonly collectionUseAnimatedCardBacks: boolean = false;
	readonly collectionShowOnlyBuyablePacks: boolean = false;
	readonly collectionActivePortraitCategoryFilter: CollectionPortraitCategoryFilter = 'collectible';
	readonly collectionActivePortraitOwnedFilter: CollectionPortraitOwnedFilter = 'all';

	readonly desktopDeckFilters: DeckFilters;
	readonly desktopDeckShowHiddenDecks: boolean = false;
	readonly desktopDeckHiddenDeckCodes: readonly string[] = [];
	readonly desktopDeckShowMatchupAsPercentages: boolean = true;
	readonly desktopDeckStatsReset: { [deckstring: string]: readonly number[] } = {};
	readonly desktopDeckDeletes: { [deckstring: string]: readonly number[] } = {};

	readonly decktrackerShowRanked: boolean = true;
	readonly decktrackerShowDuels: boolean = true;
	readonly decktrackerShowArena: boolean = true;
	readonly decktrackerShowTavernBrawl: boolean = true;
	readonly decktrackerShowPractice: boolean = true;
	readonly decktrackerShowFriendly: boolean = true;
	readonly decktrackerShowCasual: boolean = true;
	readonly decktrackerCloseOnGameEnd: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly decktrackerScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly decktrackerPosition: { left: number; top: number };

	readonly decktrackerShowMinionPlayOrderOnBoard: boolean = true;
	readonly dectrackerShowOpponentTurnDraw: boolean = true;
	readonly dectrackerShowOpponentGuess: boolean = true;
	readonly dectrackerShowOpponentBuffInHand: boolean = true;
	readonly overlayHighlightRelatedCards: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly decktrackerOpponentHandScale: number = 100;

	readonly guessOpponentArchetype: boolean = true;

	// readonly overlayDisplayMode: string;
	readonly overlayShowTitleBar: boolean = true;
	readonly overlayShowControlBar: boolean = true;
	readonly overlayShowTooltipsOnHover: boolean = true;
	readonly overlayShowRarityColors: boolean = true;
	readonly overlayShowGiftedCardsInSeparateLine: boolean = false;
	readonly overlayShowStatsChange: boolean = true;
	readonly overlayShowDeckWinrate: boolean = true;
	readonly overlayShowMatchupWinrate: boolean = true;

	readonly overlayGroupByZone: boolean = true;
	// readonly overlayHighlightCardsInHand: boolean = false; // Doesn't have a UI anymore?
	readonly overlayCardsGoToBottom: boolean = false;
	readonly overlayShowGlobalEffects: boolean = true;
	readonly overlayHideGeneratedCardsInOtherZone: boolean = false;
	readonly overlaySortByManaInOtherZone: boolean = false;
	readonly overlayDarkenUsedCards: boolean = true;
	readonly decktrackerNoDeckMode: boolean = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly overlayOpacityInPercent: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly overlayWidthInPx: number = 227; // No UI
	readonly overlayShowCostReduction: boolean = true;

	readonly opponentOverlayGroupByZone: boolean = true;
	readonly opponentOverlayCardsGoToBottom: boolean = true;
	readonly opponentOverlayShowGlobalEffects: boolean = true;
	readonly opponentOverlayHideGeneratedCardsInOtherZone: boolean = false;
	readonly opponentOverlaySortByManaInOtherZone: boolean = false;
	readonly opponentOverlayDarkenUsedCards: boolean = true;
	readonly opponentTracker: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentOverlayWidthInPx: number = 227;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentOverlayOpacityInPercent: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentOverlayScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentOverlayPosition: { left: number; top: number };
	readonly opponentLoadAiDecklist: boolean = true;

	readonly secretsHelper: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly secretsHelperOpacity: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly secretsHelperScale: number = 80;
	readonly secretsHelperCardsGoToBottom: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly secretsHelperPosition: { left: number; top: number };
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly secretsHelperWidgetPosition: { left: number; top: number };

	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly countersScale: number = 100;

	readonly playerGalakrondCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerGalakrondCounterWidgetPosition: { left: number; top: number };
	readonly opponentGalakrondCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentGalakrondCounterWidgetPosition: { left: number; top: number };

	readonly playerWatchpostCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerWatchpostCounterWidgetPosition: { left: number; top: number };
	readonly opponentWatchpostCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentWatchpostCounterWidgetPosition: { left: number; top: number };

	// These are turned off by default because you can quite easily see the info from the tracker
	readonly playerLibramCounter: boolean = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerLibramCounterWidgetPosition: { left: number; top: number };
	readonly opponentLibramCounter: boolean = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentLibramCounterWidgetPosition: { left: number; top: number };

	readonly playerPogoCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerPogoCounterWidgetPosition: { left: number; top: number };
	readonly opponentPogoCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentPogoCounterWidgetPosition: { left: number; top: number };

	readonly playerJadeGolemCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerJadeGolemCounterWidgetPosition: { left: number; top: number };
	readonly opponentJadeGolemCounterCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentJadeGolemWidgetPosition: { left: number; top: number };

	readonly playerAttackCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerAttackCounterWidgetPosition: { left: number; top: number };
	readonly opponentAttackCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentAttackCounterWidgetPosition: { left: number; top: number };

	readonly playerCthunCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerCthunCounterWidgetPosition: { left: number; top: number };
	readonly opponentCthunCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentCthunCounterWidgetPosition: { left: number; top: number };

	readonly playerFatigueCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerFatigueCounterWidgetPosition: { left: number; top: number };
	readonly opponentFatigueCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentFatigueCounterWidgetPosition: { left: number; top: number };

	readonly playerSpellCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerSpellCounterWidgetPosition: { left: number; top: number };

	readonly playerElementalCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerElementalCounterWidgetPosition: { left: number; top: number };

	readonly playerMulticasterCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerMulticasterCounterWidgetPosition: { left: number; top: number };

	readonly playerHeroPowerDamageCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerHeroPowerDamageCounterWidgetPosition: { left: number; top: number };
	readonly opponentHeroPowerDamageCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentHeroPowerDamageCounterWidgetPosition: { left: number; top: number };

	readonly playerElwynnBoarCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerElwynnBoarCounterWidgetPosition: { left: number; top: number };
	readonly opponentElwynnBoarCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentElwynnBoarCounterWidgetPosition: { left: number; top: number };

	readonly playerBolnerCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerBolnerCounterWidgetPosition: { left: number; top: number };

	readonly playerBrilliantMacawCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerBrilliantMacawCounterWidgetPosition: { left: number; top: number };

	readonly playerBgsPogoCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerBgsPogoCounterWidgetPosition: { left: number; top: number };

	readonly replaysShowNotification: boolean = false;
	readonly replaysFilterDeckstring: string;
	readonly replaysFilterGameMode: string;
	readonly replaysFilterBgHero: string;
	readonly replaysFilterPlayerClass: string;
	readonly replaysFilterOpponentClass: string;
	readonly replaysShowClassIcon: boolean = false;
	readonly replaysShowMercDetails: boolean = true;
	readonly replaysActiveGameModeFilter: string = null;
	readonly replaysActiveDeckstringFilter: string = null;
	readonly replaysActiveBgHeroFilter: string = null;
	readonly replaysActivePlayerClassFilter: string = null;
	readonly replaysActiveOpponentClassFilter: string = null;

	readonly bgsFullToggle = true;
	readonly bgsEnableApp = true;
	readonly bgsUseOverlay = false;
	readonly bgsEnableBattleSimulationOverlay = true;
	readonly bgsShowBannedTribesOverlay = true;
	readonly bgsForceShowPostMatchStats = true;
	readonly bgsUseLocalSimulator = true;
	readonly bgsUseLocalPostMatchStats = true;
	readonly bgsEnableSimulation = true;
	readonly bgsShowHeroSelectionAchievements = true;
	readonly bgsShowHeroSelectionTooltip = true;
	readonly bgsShowNextOpponentRecapSeparately = true;
	readonly bgsHideSimResultsOnRecruit = true;
	readonly bgsShowSimResultsOnlyOnRecruit = false;
	readonly bgsEnableSimulationSampleInOverlay = false;
	readonly bgsSimulatorNumberOfSims = 5000;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsSimulationWidgetPosition: { left: number; top: number };
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsBannedTribesWidgetPosition: { left: number; top: number };
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsBannedTribeScale = 101.6;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsSimulatorScale = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsMinionsListScale = 100;
	readonly bgsBannedTribesShowVertically: boolean;
	readonly bgsEnableOpponentBoardMouseOver: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsOpponentBoardScale = 101.6;
	readonly bgsEnableMinionListOverlay: boolean = true;
	readonly bgsEnableTurnNumbertOverlay: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsMinionsListPosition: { left: number; top: number };
	readonly bgsEnableMinionListMouseOver: boolean = true;
	readonly bgsShowTribesHighlight: boolean = true;
	readonly bgsMinionListShowGoldenCard: boolean = true;
	readonly bgsShowLastOpponentIconInOverlay: boolean = true;
	readonly bgsShowHeroSelectionScreen: boolean = true;
	readonly bgsShowOverlayButton: boolean = true;
	readonly bgsOpponentOverlayAtTop: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsOverlayButtonPosition: { left: number; top: number };

	readonly bgsActiveTimeFilter: BgsActiveTimeFilterType = 'last-patch';
	readonly bgsActiveRankFilter: BgsRankFilterType = 100;
	readonly bgsActiveTribesFilter: readonly Race[] = [];
	readonly bgsActiveHeroSortFilter: BgsHeroSortFilterType = 'average-position';
	readonly bgsActiveHeroFilter: string = 'all';
	readonly bgsActiveMmrGroupFilter: MmrGroupFilterType = 'per-match';
	readonly bgsSelectedTabs2: readonly BgsStatsFilterId[] = [
		'hp-by-turn',
		'winrate-per-turn',
		'warband-total-stats-by-turn',
		'warband-composition-by-turn',
	];
	readonly bgsNumberOfDisplayedTabs: number = 1;
	readonly bgsActiveSimulatorMinionTribeFilter: 'all' | 'blank' | string = 'all';
	readonly bgsActiveSimulatorMinionTierFilter: 'all' | '1' | '2' | '3' | '4' | '5' | '6' = 'all';

	// readonly duelsRunUuid: string;
	readonly duelsActiveHeroSortFilter: DuelsHeroSortFilterType = 'global-winrate';
	readonly duelsActiveStatTypeFilter: DuelsStatTypeFilterType = 'hero';
	// readonly duelsActiveTreasureSortFilter: DuelsTreasureSortFilterType = 'global-winrate';
	readonly duelsActiveTreasureStatTypeFilter: DuelsTreasureStatTypeFilterType = 'treasure-1';
	readonly duelsActiveTimeFilter: DuelsTimeFilterType = 'last-patch';
	readonly duelsActiveGameModeFilter: DuelsGameModeFilterType = 'all';
	readonly duelsActiveHeroFilter: DuelsHeroFilterType = 'all';
	readonly duelsActiveTopDecksDustFilter: DuelsTopDecksDustFilterType = 'all';
	readonly duelsActiveMmrFilter: 100 | 50 | 25 | 10 | 1 = 100;
	readonly duelsActiveHeroPowerFilter: 'all' | string = 'all';
	readonly duelsActiveSignatureTreasureFilter: 'all' | string = 'all';
	readonly duelsActiveLeaderboardModeFilter: 'paid-duels' | 'duels' = 'paid-duels';
	readonly duelsPersonalDeckNames: { [deckstring: string]: string } = {};
	readonly duelsPersonalDeckHiddenDeckCodes: readonly string[] = [];
	readonly duelsPersonalDeckShowHiddenDecks: boolean;
	readonly duelsHideStatsBelowThreshold: boolean;

	readonly mercenariesActiveModeFilter: MercenariesModeFilterType = 'pve';
	readonly mercenariesActiveRoleFilter: MercenariesRoleFilterType = 'all';
	readonly mercenariesActivePveDifficultyFilter: MercenariesPveDifficultyFilterType = 'all';
	readonly mercenariesActivePvpMmrFilter: MercenariesPvpMmrFilterType = 100;
	readonly mercenariesActiveStarterFilter: MercenariesStarterFilterType = 'all';
	readonly mercenariesActiveFullyUpgradedFilter: MercenariesFullyUpgradedFilterType = 'all';
	readonly mercenariesActiveHeroLevelFilter2: MercenariesHeroLevelFilterType = 30;
	readonly mercenariesShowColorChartButton: boolean = true;
	readonly mercenariesHighlightSynergies: boolean = true;
	// For now only for PvE
	readonly mercenariesShowTaskButton: boolean = true;
	// Most important criteria is first in the list
	readonly mercenariesPersonalHeroesSortCriteria: readonly MercenariesPersonalHeroesSortCriteria[] = [
		{
			criteria: 'name',
			direction: 'asc',
		},
	];
	readonly mercenariesShowHiddenTeams: boolean = true;
	readonly mercenariesHiddenTeamIds: readonly string[] = [];
	readonly mercenariesShowMercNamesInTeams: boolean = true;

	// Not the best place to store it, but the preferences are for now stored on the
	// server and backed up when another device is used.
	// Ideally this will be returned by the game itself, so we won't need it at all
	readonly mercenariesVisitorsProgress: readonly MemoryVisitor[];

	readonly mercenariesEnablePlayerTeamWidget = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly mercenariesPlayerTeamOverlayScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly mercenariesPlayerTeamOverlayPosition: { left: number; top: number };

	readonly mercenariesEnableOpponentTeamWidget = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly mercenariesOpponentTeamOverlayScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly mercenariesOpponentTeamOverlayPosition: { left: number; top: number };

	readonly mercenariesEnableActionsQueueWidgetPvE = true;
	readonly mercenariesEnableActionsQueueWidgetPvP = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly mercenariesActionsQueueOverlayScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly mercenariesActionsQueueOverlayPosition: { left: number; top: number };

	readonly mercenariesEnableOutOfCombatPlayerTeamWidget = true;
	readonly mercenariesEnableOutOfCombatPlayerTeamWidgetOnVillage = true;
	// @Reflect.metadata(FORCE_LOCAL_PROP, true)
	// readonly mercenariesOutOfCombatPlayerTeamOverlayScale: number = 100;
	// @Reflect.metadata(FORCE_LOCAL_PROP, true)
	// readonly mercenariesOutOfCombatPlayerTeamOverlayPosition: { left: number; top: number };

	readonly arenaActiveClassFilter: ArenaClassFilterType = 'all';
	readonly arenaActiveTimeFilter: ArenaTimeFilterType = 'all-time';

	readonly statsXpGraphSeasonFilter: StatsXpGraphSeasonFilterType = 'all-seasons';

	readonly twitchAccessToken: string;
	readonly twitchUserName: string;

	readonly outOfCardsToken: OutOfCardsToken;
	readonly outOfCardsShowNotifOnSync: boolean = false;

	readonly d0nkeySync: boolean = true;
	readonly hearthstoneDecksSync: boolean = true;

	readonly ftue: Ftue = new Ftue();
}
