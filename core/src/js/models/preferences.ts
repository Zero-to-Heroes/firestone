import { OutOfCardsToken } from '../services/mainwindow/out-of-cards.service';
import { BgsStatsFilterId } from './battlegrounds/post-match/bgs-stats-filter-id.type';
import { DuelsClassFilterType } from './duels/duels-class-filter.type';
import { DuelsGameModeFilterType } from './duels/duels-game-mode-filter.type';
import { DuelsHeroSortFilterType } from './duels/duels-hero-sort-filter.type';
import { DuelsStatTypeFilterType } from './duels/duels-stat-type-filter.type';
import { DuelsTimeFilterType } from './duels/duels-time-filter.type';
import { DuelsTopDecksDustFilterType } from './duels/duels-top-decks-dust-filter.type';
import { DuelsTreasureSortFilterType } from './duels/duels-treasure-sort-filter.type';
import { DuelsTreasureStatTypeFilterType } from './duels/duels-treasure-stat-type-filter.type';
import { BgsActiveTimeFilterType } from './mainwindow/battlegrounds/bgs-active-time-filter.type';
import { BgsHeroSortFilterType } from './mainwindow/battlegrounds/bgs-hero-sort-filter.type';
import { BgsRankFilterType } from './mainwindow/battlegrounds/bgs-rank-filter.type';
import { MmrGroupFilterType } from './mainwindow/battlegrounds/mmr-group-filter-type';
import { CurrentAppType } from './mainwindow/current-app.type';
import { DeckFilters } from './mainwindow/decktracker/deck-filters';
import { Ftue } from './preferences/ftue';

export class Preferences {
	readonly id: number = 1;

	readonly launchAppOnGameStart: boolean = true;
	readonly showSessionRecapOnExit: boolean = true;
	readonly shareGamesWithVS: boolean = true;
	readonly setAllNotifications: boolean = true;
	readonly contactEmail: string;
	readonly lastSeenReleaseNotes: string;
	readonly dontShowNewVersionNotif: boolean = false;

	readonly advancedModeToggledOn: boolean;

	readonly currentMainVisibleSection: CurrentAppType = 'decktracker';

	readonly achievementsLiveTracking: boolean = true;
	readonly achievementsDisplayNotifications = true;
	readonly resetAchievementsOnAppStart = false;
	// TODO: both should be removed
	readonly dontConfirmVideoReplayDeletion: boolean;
	readonly hasSeenVideoCaptureChangeNotif: boolean;

	readonly showXpRecapAtGameEnd: boolean = false;

	readonly collectionEnableNotifications: boolean = true;
	readonly showDust: boolean = true;
	readonly showCommon: boolean = true;
	readonly showCardsOutsideOfPacks: boolean = true;
	readonly collectionHistoryShowOnlyNewCards: boolean = false;
	readonly collectionUseHighResImages: boolean = false;
	readonly collectionCardScale: number = 100;
	readonly collectionSetShowGoldenStats: boolean = false;
	readonly collectionUseAnimatedCardBacks: boolean = false;

	readonly collectionUseOverlay: boolean;

	readonly desktopDeckFilters: DeckFilters;
	readonly desktopDeckShowHiddenDecks: boolean = false;
	readonly desktopDeckHiddenDeckCodes: readonly string[] = [];
	readonly desktopDeckShowMatchupAsPercentages: boolean = true;

	readonly decktrackerShowRanked: boolean = true;
	readonly decktrackerShowDuels: boolean = true;
	readonly decktrackerShowArena: boolean = true;
	readonly decktrackerShowTavernBrawl: boolean = true;
	readonly decktrackerShowPractice: boolean = true;
	readonly decktrackerShowFriendly: boolean = true;
	readonly decktrackerShowCasual: boolean = true;
	readonly decktrackerCloseOnGameEnd: boolean = true;
	readonly decktrackerScale: number = 100;
	readonly decktrackerPosition: { left: number; top: number };

	readonly dectrackerShowOpponentTurnDraw: boolean = true;
	readonly dectrackerShowOpponentGuess: boolean = true;
	readonly dectrackerShowOpponentBuffInHand: boolean = true;
	readonly decktrackerOpponentHandScale: number = 100;

	readonly guessOpponentArchetype: boolean = true;

	// readonly overlayDisplayMode: string;
	readonly overlayShowTitleBar: boolean = true;
	readonly overlayShowControlBar: boolean = true;
	readonly overlayShowTooltipsOnHover: boolean = true;
	readonly overlayShowRarityColors: boolean = true;
	readonly overlayShowGiftedCardsInSeparateLine: boolean = false;
	readonly overlayShowDeckWinrate: boolean = true;
	readonly overlayShowMatchupWinrate: boolean = true;

	readonly overlayGroupByZone: boolean = true;
	// readonly overlayHighlightCardsInHand: boolean = false; // Doesn't have a UI anymore?
	readonly overlayCardsGoToBottom: boolean = false;
	readonly overlayShowGlobalEffects: boolean = true;
	readonly overlayHideGeneratedCardsInOtherZone: boolean = false;
	readonly overlaySortByManaInOtherZone: boolean = false;
	readonly decktrackerNoDeckMode: boolean = false;
	readonly overlayOpacityInPercent: number = 100;
	readonly overlayWidthInPx: number = 227; // No UI
	readonly overlayShowCostReduction: boolean = true;

	readonly opponentOverlayGroupByZone: boolean = true;
	readonly opponentOverlayCardsGoToBottom: boolean = true;
	readonly opponentOverlayShowGlobalEffects: boolean = true;
	readonly opponentOverlayHideGeneratedCardsInOtherZone: boolean = false;
	readonly opponentOverlaySortByManaInOtherZone: boolean = false;
	readonly opponentOverlayDarkenUsedCards: boolean = true;
	readonly opponentTracker: boolean = true;
	readonly opponentOverlayWidthInPx: number = 227;
	readonly opponentOverlayOpacityInPercent: number = 100;
	readonly opponentOverlayScale: number = 100;
	readonly opponentOverlayPosition: { left: number; top: number };
	readonly opponentLoadAiDecklist: boolean = true;

	readonly secretsHelper: boolean = true;
	readonly secretsHelperOpacity: number = 100;
	readonly secretsHelperScale: number = 80;
	readonly secretsHelperCardsGoToBottom: boolean = true;
	readonly secretsHelperPosition: { left: number; top: number };
	readonly secretsHelperWidgetPosition: { left: number; top: number };

	readonly playerGalakrondCounter: boolean = true;
	readonly playerGalakrondCounterWidgetPosition: { left: number; top: number };
	readonly opponentGalakrondCounter: boolean = true;
	readonly opponentGalakrondCounterWidgetPosition: { left: number; top: number };
	readonly playerPogoCounter: boolean = true;
	readonly playerPogoCounterWidgetPosition: { left: number; top: number };
	readonly opponentPogoCounter: boolean = true;
	readonly opponentPogoCounterWidgetPosition: { left: number; top: number };
	readonly playerJadeGolemCounter: boolean = true;
	readonly playerJadeGolemCounterWidgetPosition: { left: number; top: number };
	readonly opponentJadeGolemCounterCounter: boolean = true;
	readonly opponentJadeGolemWidgetPosition: { left: number; top: number };
	readonly playerAttackCounter: boolean = true;
	readonly playerAttackCounterWidgetPosition: { left: number; top: number };
	readonly opponentAttackCounter: boolean = true;
	readonly opponentAttackCounterWidgetPosition: { left: number; top: number };
	readonly playerCthunCounter: boolean = true;
	readonly playerCthunCounterWidgetPosition: { left: number; top: number };
	readonly opponentCthunCounter: boolean = true;
	readonly opponentCthunCounterWidgetPosition: { left: number; top: number };
	readonly playerFatigueCounter: boolean = true;
	readonly playerFatigueCounterWidgetPosition: { left: number; top: number };
	readonly opponentFatigueCounter: boolean = true;
	readonly opponentFatigueCounterWidgetPosition: { left: number; top: number };
	readonly playerSpellCounter: boolean = true;
	readonly playerSpellCounterWidgetPosition: { left: number; top: number };
	readonly playerElementalCounter: boolean = true;
	readonly playerElementalCounterWidgetPosition: { left: number; top: number };

	readonly playerBgsPogoCounter: boolean = true;
	readonly playerBgsPogoCounterWidgetPosition: { left: number; top: number };

	readonly replaysShowNotification: boolean = false;
	readonly replaysFilterDeckstring: string;
	readonly replaysFilterGameMode: string;

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
	readonly bgsHideSimResultsOnRecruit = true;
	readonly bgsShowSimResultsOnlyOnRecruit = false;
	readonly bgsEnableSimulationSampleInOverlay = false;
	readonly bgsSimulatorNumberOfSims = 5000;
	readonly bgsSimulationWidgetPosition: { left: number; top: number };
	readonly bgsBannedTribesWidgetPosition: { left: number; top: number };
	readonly bgsBannedTribeScale = 101.6;
	readonly bgsBannedTribesShowVertically: boolean;
	readonly bgsEnableOpponentBoardMouseOver: boolean = true;
	readonly bgsOpponentBoardScale = 101.6;
	readonly bgsEnableMinionListOverlay: boolean = true;
	readonly bgsMinionsListPosition: { left: number; top: number };
	readonly bgsEnableMinionListMouseOver: boolean = true;
	readonly bgsShowTribesHighlight: boolean = true;
	readonly bgsShowLastOpponentIconInOverlay: boolean = true;
	readonly bgsShowHeroSelectionScreen: boolean = true;
	readonly bgsShowOverlayButton: boolean = true;
	readonly bgsOpponentOverlayAtTop: boolean = true;
	readonly bgsOverlayButtonPosition: { left: number; top: number };

	readonly bgsActiveTimeFilter: BgsActiveTimeFilterType = 'last-patch';
	readonly bgsActiveRankFilter: BgsRankFilterType = 'all';
	readonly bgsActiveHeroSortFilter: BgsHeroSortFilterType = 'average-position';
	readonly bgsActiveMmrGroupFilter: MmrGroupFilterType = 'per-match';
	readonly bgsSelectedTabs2: readonly BgsStatsFilterId[] = [
		'hp-by-turn',
		'winrate-per-turn',
		'warband-total-stats-by-turn',
		'warband-composition-by-turn',
	];
	readonly bgsNumberOfDisplayedTabs: number = 1;

	// readonly duelsRunUuid: string;
	readonly duelsActiveHeroSortFilter: DuelsHeroSortFilterType = 'global-winrate';
	readonly duelsActiveStatTypeFilter: DuelsStatTypeFilterType = 'hero';
	readonly duelsActiveTreasureSortFilter: DuelsTreasureSortFilterType = 'global-winrate';
	readonly duelsActiveTreasureStatTypeFilter: DuelsTreasureStatTypeFilterType = 'treasure';
	readonly duelsActiveTimeFilter: DuelsTimeFilterType = 'last-patch';
	readonly duelsActiveGameModeFilter: DuelsGameModeFilterType = 'all';
	readonly duelsActiveTopDecksClassFilter: DuelsClassFilterType = 'all';
	readonly duelsActiveTopDecksDustFilter: DuelsTopDecksDustFilterType = 'all';
	readonly duelsPersonalDeckNames: { [deckstring: string]: string } = {};
	readonly duelsPersonalDeckHiddenDeckCodes: readonly string[] = [];
	readonly duelsPersonalDeckShowHiddenDecks: boolean;

	readonly twitchAccessToken: string;
	readonly twitchUserName: string;

	readonly outOfCardsToken: OutOfCardsToken;
	readonly outOfCardsShowNotifOnSync: boolean = false;

	readonly ftue: Ftue = new Ftue();
}
