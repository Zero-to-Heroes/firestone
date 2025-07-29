import { GameFormat, RankBracket, TimePeriod } from '@firestone-hs/constructed-deck-stats';
import { BnetRegion, GameFormat as GameFormatEnum, Race } from '@firestone-hs/reference-data';
import { IPreferences } from '@firestone/shared/framework/common';
import 'reflect-metadata';
import {
	AchievementsCompletedFilterType,
	ArenaCardClassFilterType,
	ArenaCardTypeFilterType,
	ArenaClassFilterType,
	ArenaTimeFilterType,
	BgsActiveTimeFilterType,
	BgsHeroSortFilterType,
	BgsQuestActiveTabType,
	BgsRankFilterType,
	BgsStatsFilterId,
	BgsTrinketActiveTabType,
	CollectionCardClassFilterType,
	CollectionCardOwnedFilterType,
	CollectionCardRarityFilterType,
	CollectionPortraitCategoryFilter,
	CollectionPortraitOwnedFilter,
	ConstructedDeckVersions,
	ConstructedMetaDecksDustFilterType,
	ConstructedStatsTab,
	CurrentAppType,
	DeckFilters,
	Ftue,
	LotteryTabType,
	MercenariesFullyUpgradedFilterType,
	MercenariesHeroLevelFilterType,
	MercenariesModeFilterType,
	MercenariesOwnedFilterType,
	MercenariesPersonalHeroesSortCriteria,
	MercenariesPveDifficultyFilterType,
	MercenariesPvpMmrFilterType,
	MercenariesRoleFilterType,
	MercenariesStarterFilterType,
	MmrGroupFilterType,
	StatGameFormatType,
	StatsXpGraphSeasonFilterType,
} from './pref-model';
import { OutOfCardsToken } from './unfit-pref-model';

export const FORCE_LOCAL_PROP = 'forceLocalProp';

export class Preferences implements IPreferences {
	readonly lastUpdateDate: Date | null;
	readonly id: number = 1;

	readonly locale: string = 'enUS';
	readonly hasChangedLocale: boolean = false;

	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly gameInstallPath: string;

	readonly modsEnabled: boolean;
	readonly disableLocalCache: boolean;

	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly globalWidgetScale: number | null = 80;
	readonly globalWidgetOpacity: number | null = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly cardTooltipScale: number = 100;
	readonly useNewCardTileStyle: boolean = true;
	readonly useGroupedCounters: boolean = false;
	readonly groupedCountersScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly groupedCountersPosition: { left: number; top: number };

	readonly showLottery: boolean | null = null;
	readonly lotteryOverlay: boolean | null = null;
	readonly lotteryCurrentModule: LotteryTabType = 'lottery';
	readonly lotteryShowHiddenWindowNotification: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly lotteryPosition: { left: number; top: number };
	readonly lotteryScale: number = 100;
	readonly lotteryOpacity: number = 100;

	readonly launchAppOnGameStart: boolean = true;
	readonly showSessionRecapOnExit: boolean = true;
	readonly shareGamesWithVS: boolean = true;
	readonly setAllNotifications: boolean = true;
	readonly notificationsPosition: CornerPosition = 'bottom-right';
	readonly contactEmail: string;
	readonly lastSeenReleaseNotes: string;
	readonly dontShowNewVersionNotif: boolean = false;
	readonly globalZoomLevel: number = 100;
	readonly flashWindowOnYourTurn: boolean = true;
	readonly showNotificationOnYourTurn: boolean = false;
	readonly allowGamesShare: boolean = true;
	readonly enableQuestsWidget: boolean = true;
	readonly showQuestsWidgetWhenEmpty: boolean = false;
	readonly showQuestsInGame: boolean = true;
	readonly useStreamerMode: boolean = false;
	readonly regionFilter: BnetRegion | 'all' = 'all';
	readonly lockWidgetPositions: boolean = false;

	readonly enableMailbox: boolean = true;
	readonly enableMailboxUnread: boolean = true;
	readonly mailboxLastVisitDate: Date;

	readonly advancedModeToggledOn: boolean;

	readonly currentMainVisibleSection: CurrentAppType = 'decktracker';

	readonly showCurrentSessionWidgetBgs: boolean = true;
	readonly hideCurrentSessionWidgetWhenFriendsListIsOpen: boolean = true;
	readonly showTurnTimer: boolean = true;
	readonly showTurnTimerMatchLength: boolean = true;
	readonly currentSessionStartDate: Date | null = null;
	readonly sessionWidgetShowGroup: boolean = true;
	readonly sessionWidgetShowMatches: boolean = true;
	readonly sessionWidgetNumberOfMatchesToShow: number = 5;
	readonly sessionWidgetOpacity: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly sessionWidgetScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly currentSessionWidgetPosition: { left: number; top: number };
	readonly turnTimerWidgetOpacity: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly turnTimerWidgetScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly turnTimerWidgetWidth: number = 175;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly turnTimerWidgetPosition: { left: number; top: number };

	readonly achievementsFullEnabled = false;
	readonly achievementsEnabled2 = false;
	readonly achievementsLiveTracking2: boolean = false;
	readonly achievementsDisplayNotifications2 = false;
	readonly achievementsCompletedActiveFilter: AchievementsCompletedFilterType = 'ALL_ACHIEVEMENTS';
	// internal HS achievement ids
	readonly pinnedAchievementIds: readonly number[] = [];

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
	readonly collectionCardRarityFilter: CollectionCardRarityFilterType = 'all';
	readonly collectionCardClassFilter: CollectionCardClassFilterType = 'all';
	readonly collectionCardOwnedFilter: CollectionCardOwnedFilterType = 'all';
	readonly collectionShowRelatedCards: boolean = true;
	readonly collectionSetStatsTypeFilter: CollectionSetStatsTypeFilterType = 'cards-stats';

	readonly collectionPityTimerResets: { [packId: string]: number } = {};

	readonly desktopDeckFilters: DeckFilters = new DeckFilters();
	readonly desktopDeckShowHiddenDecks: boolean = false;
	readonly desktopDeckHiddenDeckCodes: readonly string[] = [];
	readonly desktopDeckShowMatchupAsPercentages: boolean = true;
	readonly desktopStatsShowGoingFirstOnly: boolean = false;
	readonly desktopStatsShowGoingSecondOnly: boolean = false;
	readonly desktopPlayerClassFilter: readonly string[] = [];
	// When impementing this for other areas, don't forget to update the prefs update in app-bootstrap
	readonly desktopDeckStatsReset: { [deckstring: string]: readonly number[] } = {};
	readonly desktopDeckDeletes: { [deckstring: string]: readonly number[] } = {};
	readonly constructedDeckVersions: readonly ConstructedDeckVersions[] = [];
	readonly constructedDeckArchetypeOverrides: { [deckstring: string]: number | null } = {};
	readonly constructedStatsTab: ConstructedStatsTab = 'overview';
	readonly constructedDecksSearchString: string;
	readonly constructedMetaDecksFormatFilter: GameFormat = 'standard';
	readonly constructedMetaDecksTimeFilter: TimePeriod = 'last-patch';
	readonly constructedMetaDecksRankFilter2: RankBracket = 'legend';
	readonly constructedMetaDecksSampleSizeFilter: number = 200;
	readonly constructedMetaDecksDustFilter: ConstructedMetaDecksDustFilterType = 'all';
	readonly constructedMetaArchetypesSampleSizeFilter: number = 2000;
	readonly constructedMetaDecksUseConservativeWinrate: boolean = false;
	readonly constructedMetaDeckPlayCoinFilter: 'play' | 'coin' | null = null;
	readonly constructedMetaDecksShowRelativeInfo2: boolean = true;
	readonly constructedMetaDecksPlayerClassFilter: readonly string[] = [];
	readonly constructedMetaDecksArchetypeFilter: readonly number[] = [];
	readonly constructedMetaDecksSortCriteria: { criteria: string; direction: string } | null = null;
	readonly constructedShowOocTracker: boolean = true;
	readonly constructedShowOocTrackerExtended: boolean = false;
	readonly constructedOocTrackerScale: number = 100;
	readonly constructedOocTrackerPosition: { left: number; top: number };
	readonly constructedShowCardStatDuringDiscovers: boolean = true;
	readonly showArenaCardStatDuringDiscoversPremiumBanner: boolean = true;

	readonly decktrackerShowRanked: boolean = true;
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
	readonly decktrackerMinionPlayOrderOpacity: number = 100;
	readonly dectrackerShowOpponentTurnDraw: boolean = true;
	readonly dectrackerShowOpponentGuess: boolean = true;
	readonly dectrackerShowOpponentBuffInHand: boolean = true;
	readonly overlayHighlightRelatedCards: boolean = true;
	readonly overlayEnableDiscoverHelp: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly decktrackerOpponentHandScale: number = 100;

	readonly decktrackerShowMulliganCardImpact: boolean = true;
	readonly hideMulliganWhenFriendsListIsOpen: boolean = false;
	readonly decktrackerShowMulliganDeckOverview: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly decktrackerMulliganScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly constructedMulliganDeckWidgetPosition: { left: number; top: number };
	readonly decktrackerMulliganRankBracket: 'competitive' | 'top-2000-legend' | 'legend' | 'legend-diamond' | 'all' =
		'legend-diamond';
	readonly decktrackerMulliganOpponent: 'all' | string = 'all';
	readonly decktrackerOocMulliganOpponent: 'all' | string = 'all';
	readonly decktrackerMulliganTime: 'last-patch' | 'past-3' | 'past-7' = 'last-patch';
	readonly decktrackerMulliganFormatOverride: GameFormatEnum | null = null;
	readonly decktrackerMulliganPlayCoinOverride: 'play' | 'coin' | 'all' | null = null;
	readonly decktrackerMulliganPlayCoinOoc: 'play' | 'coin' | 'all' | null = null;

	readonly arenaShowMulliganCardImpact: boolean = true;
	readonly arenaShowMulliganDeckOverview: boolean = true;
	readonly arenaShowCurrentSessionWidget: boolean = true;
	readonly arenaShowCurrentSessionWidgetInGame: boolean = true;
	readonly arenaSessionWidgetShowGroup: boolean = true;
	readonly arenaSessionWidgetShowGroupInGame: boolean = true;
	readonly arenaSessionWidgetShowMatches: boolean = true;
	readonly arenaSessionWidgetShowMatchesInGame: boolean = true;
	readonly arenaShowAdvancedCardStats: boolean = false;
	readonly arenaSessionWidgetScale: number = 100;
	readonly arenaSessionWidgetOpacity: number = 100;
	readonly arenaSessionWidgetNumberOfMatchesToShow: number = 5;
	readonly arenaCurrentSessionStartDate: Date | null = null;
	readonly arenaCurrentSessionTimeFrame: ArenaSessionWidgetTimeFrame = 'current-season';
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly arenaCurrentSessionWidgetPosition: { left: number; top: number };

	readonly hsShowQuestsWidget: boolean = true;
	readonly hsShowQuestsWidgetOnHub: boolean = true;
	readonly hsShowQuestsWidgetOnBg: boolean = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly hsQuestsWidgetPosition: { left: number; top: number };

	readonly bgsShowQuestsWidget: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsQuestsWidgetPosition: { left: number; top: number };
	readonly bgsQuestsOverlayScale: number = 100;

	readonly mercsShowQuestsWidget: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly mercsQuestsWidgetPosition: { left: number; top: number };

	readonly guessOpponentArchetype: boolean = true;

	// readonly overlayDisplayMode: string;
	readonly overlayShowTitleBar: boolean = true;
	readonly overlayShowControlBar: boolean = true;
	readonly overlayShowTooltipsOnHover: boolean = true;
	readonly overlayShowRarityColors: boolean = true;
	readonly overlayShowRelatedCards: boolean = true;
	readonly overlayShowTransformedInto: boolean = true;
	readonly overlayShowGiftedCardsInSeparateLine: boolean = false;
	readonly overlayGroupSameCardsTogether: boolean = false;
	readonly overlayShowGiftedCardsSeparateZone: boolean = false;
	readonly overlayShowPlaguesOnTop: boolean = true;
	readonly overlayShowBoardCardsSeparateZone: boolean = false;
	readonly overlayResetDeckPositionAfterTrade2: boolean = false;
	readonly overlayShowStatsChange: boolean = true;
	readonly overlayShowDeckWinrate: boolean = true;
	readonly overlayShowMatchupWinrate: boolean = true;
	readonly overlayShowDkRunes: boolean = true;

	readonly overlayGroupByZone: boolean = true;
	// readonly overlayHighlightCardsInHand: boolean = false; // Doesn't have a UI anymore?
	readonly overlayCardsGoToBottom: boolean = false;
	readonly overlayShowGlobalEffects: boolean = true;
	readonly overlayShowDiscoveryZone: boolean = true;
	readonly overlayHideGeneratedCardsInOtherZone: boolean = false;
	readonly overlaySortByManaInOtherZone: boolean = false;
	readonly overlayShowTopCardsSeparately: boolean = true;
	readonly overlayRemoveDuplicatesInTooltip: boolean;
	readonly overlayShowBottomCardsSeparately: boolean = true;
	readonly overlayDarkenUsedCards: boolean = true;
	readonly decktrackerNoDeckMode: boolean = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly overlayOpacityInPercent: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly overlayWidthInPx: number = 227; // No UI
	readonly overlayShowCostReduction: boolean = true;
	readonly overlayShowUnknownCards: boolean = true;

	readonly opponentOverlayGroupByZone: boolean = true;
	readonly opponentOverlayCardsGoToBottom: boolean = true;
	readonly opponentOverlayShowGlobalEffects: boolean = true;
	readonly opponentOverlayHideGeneratedCardsInOtherZone: boolean = false;
	readonly opponentOverlaySortByManaInOtherZone: boolean = false;
	readonly opponentOverlayShowBottomCardsSeparately: boolean = true;
	readonly opponentOverlayShowTopCardsSeparately: boolean = true;
	readonly opponentOverlayShowDkRunes: boolean = true;
	readonly opponentOverlayDarkenUsedCards: boolean = true;
	readonly hideOpponentDecktrackerWhenFriendsListIsOpen: boolean = true;
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
	readonly opponentLoadKnownDecklist: boolean = true;

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

	readonly countersScale: number = 100;
	readonly countersScaleOpponent: number = 100;
	readonly countersScaleOther: number = 100;
	readonly countersScaleOpponentOther: number = 100;
	readonly countersUseExpandedView: boolean = true;

	readonly playerAttackCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerAttackCounterWidgetPosition: { left: number; top: number };
	readonly opponentAttackCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly opponentAttackCounterWidgetPosition: { left: number; top: number };

	readonly playerGalakrondCounter: BooleanWithLimited = true;
	readonly opponentGalakrondCounter: BooleanWithLimited = true;
	readonly playerWatchpostCounter: BooleanWithLimited = true;
	readonly opponentWatchpostCounter: BooleanWithLimited = true;
	// These are turned off by default because you can quite easily see the info from the tracker
	readonly playerLibramCounter: BooleanWithLimited = false;
	readonly opponentLibramCounter: BooleanWithLimited = false;
	readonly playerPogoCounter: BooleanWithLimited = true;
	readonly opponentPogoCounter: BooleanWithLimited = true;
	readonly playerAstralAutomatonCounter: BooleanWithLimited = true;
	readonly opponentAstralAutomatonCounter: BooleanWithLimited = true;
	readonly playerEarthenGolemCounter: BooleanWithLimited = true;
	readonly opponentEarthenGolemCounter: BooleanWithLimited = true;
	readonly playerTreantCounter: BooleanWithLimited = true;
	readonly playerDragonsSummonedCounter: BooleanWithLimited = true;
	readonly playerDragonsPlayedCounter: boolean = true;
	readonly playerDragonsInHandCounter: boolean = true;
	readonly opponentDragonsSummonedCounter: BooleanWithLimited = true;
	readonly opponentDragonsPlayedCounter: BooleanWithLimited = true;
	readonly playerCeaselessExpanseCounter: boolean = true;
	readonly opponentCeaselessExpanseCounter: boolean = true;
	readonly playerPiratesSummonedCounter: BooleanWithLimited = true;
	readonly playerChainedGuardianCounter: BooleanWithLimited = true;
	readonly playerJadeGolemCounter: BooleanWithLimited = true;
	readonly opponentJadeGolemCounter: BooleanWithLimited = true;
	readonly playerCthunCounter: BooleanWithLimited = true;
	readonly opponentCthunCounter: BooleanWithLimited = true;
	readonly playerFatigueCounter: boolean = true;
	readonly opponentFatigueCounter: boolean = true;
	readonly playerAbyssalCurseCounter: BooleanWithLimited = true;
	readonly opponentAbyssalCurseCounter: BooleanWithLimited = true;
	readonly playerSpellCounter: BooleanWithLimited = true;
	readonly opponentSpellCounter: BooleanWithLimited = false;
	readonly playerElementalCounter: BooleanWithLimited = true;
	readonly playerMulticasterCounter: BooleanWithLimited = true;
	readonly opponentMulticasterCounter: BooleanWithLimited = false;
	readonly playerHeroPowerDamageCounter: BooleanWithLimited = true;
	readonly opponentHeroPowerDamageCounter: BooleanWithLimited = true;
	readonly playerElwynnBoarCounter: BooleanWithLimited = true;
	readonly opponentElwynnBoarCounter: BooleanWithLimited = true;
	readonly playerVolatileSkeletonCounter: BooleanWithLimited = true;
	readonly opponentVolatileSkeletonCounter: BooleanWithLimited = true;
	readonly playerRelicCounter: BooleanWithLimited = true;
	readonly opponentRelicCounter: BooleanWithLimited = true;
	readonly playerBolnerCounter: BooleanWithLimited = true;
	readonly playerDeadMinionsThisGameCounter: BooleanWithLimited = true;
	readonly opponentDeadMinionsThisGameCounter: boolean = false;
	readonly playerFriendlyDeadMinionsThisGameCounter2: boolean = true;
	readonly opponentFriendlyDeadMinionsThisGameCounter: boolean = false;
	readonly playerDamageTakenOnYourTurnCounter: boolean = true;
	readonly opponentDamageTakenOnYourTurnCounter: boolean = false;
	readonly playerLocationsUsedCounter: BooleanWithLimited = true;
	readonly playerSeaShantyCounter: boolean = true;
	readonly opponentSeaShantyCounter: boolean = false;
	readonly playerWheelOfDeathCounter: BooleanWithLimited = true;
	readonly opponentWheelOfDeathCounter: BooleanWithLimited = true;
	readonly playerThirstyDrifterCounter: BooleanWithLimited = true;
	readonly playerCardsPlayedFromAnotherClassCounter: BooleanWithLimited = true;
	readonly playerCardsDrawnCounter: BooleanWithLimited = true;
	readonly opponentCardsDrawnCounter: boolean = false;
	readonly playerComboCardsPlayedCounter: boolean = true;
	readonly playerYsondreCounter: boolean = true;
	readonly playerImbueCounter: boolean = true;
	readonly opponentImbueCounter: boolean = true;
	readonly playerHeroPowerUsedCounter: boolean = true;
	readonly playerTyrandeCounter: boolean = true;
	readonly opponentTyrandeCounter: boolean = true;
	readonly playerAvianaElunesChosenCounter: boolean = true;
	readonly opponentAvianaElunesChosenCounter: boolean = true;
	readonly playerSpellsOnFriendlyCharactersCounter: boolean = true;
	readonly playerElementalStreakCounter: BooleanWithLimited = true;
	readonly opponentElementalStreakCounter: BooleanWithLimited = false;
	readonly playerExcavateCounter: BooleanWithLimited = true;
	readonly opponentExcavateCounter: BooleanWithLimited = true;
	readonly playerChaoticTendrilCounter: BooleanWithLimited = true;
	readonly opponentChaoticTendrilCounter: BooleanWithLimited = true;
	readonly playerSecretsPlayedCounter: BooleanWithLimited = true;
	readonly playerLightrayCounter: BooleanWithLimited = true;
	readonly playerHolySpellsCounter: BooleanWithLimited = true;
	readonly opponentHolySpellsCounter: BooleanWithLimited = false;
	readonly playerMenagerieCounter: BooleanWithLimited = true;
	readonly playerCorpseSpentCounter: BooleanWithLimited = true;
	readonly opponentCorpseSpentCounter: BooleanWithLimited = true;
	readonly opponentCorpsesCounter: boolean = true;
	readonly playerCardsShuffledIntoDeckCounter: BooleanWithLimited = true;
	readonly opponentCardsShuffledIntoDeckCounter_: BooleanWithLimited = false; // Will default it to true once it's relevant
	readonly playerOverdraftCounter: BooleanWithLimited = true;
	readonly playerNagaGiantCounter: BooleanWithLimited = true;
	readonly playerGardensGraceCounter: BooleanWithLimited = true;
	readonly playerAnachronosCounter: BooleanWithLimited = true;
	readonly opponentAnachronosCounter: BooleanWithLimited = true;
	readonly playerBonelordFrostwhisperCounter: BooleanWithLimited = true;
	readonly opponentBonelordFrostwhisperCounter: BooleanWithLimited = true;
	readonly playerShockspitterCounter: BooleanWithLimited = true;
	readonly opponentShockspitterCounter: BooleanWithLimited = true;
	readonly playerQueensguardCounter: BooleanWithLimited = true;
	readonly playerTableFlipCounter: BooleanWithLimited = false;
	readonly opponentTableFlipCounter: BooleanWithLimited = false;

	readonly showPlayerMaxResourcesWidget: boolean = true;
	readonly playerMaxResourcesWidgetPosition: { left: number; top: number };
	readonly playerMaxResourcesWidgetAlwaysOn: boolean = false;
	readonly maxResourcesWidgetScale = 100;
	readonly maxResourcesWidgetShowHorizontally: boolean = false;
	readonly opponentMaxResourcesWidgetScale = 100;
	readonly showOpponentMaxResourcesWidget: boolean = true;
	readonly opponentMaxResourcesWidgetPosition: { left: number; top: number };
	readonly opponentMaxResourcesWidgetAlwaysOn: boolean = false;

	readonly playerDiscoversCounter: boolean = true;
	readonly opponentDiscoversCounter: boolean = true;
	readonly playerLibramReductionCounter: boolean = true;
	readonly opponentLibramReductionCounter: boolean = true;
	readonly playerGiftsPlayedCounter: boolean = true;
	readonly playerProtossMinionReductionCounter: boolean = true;
	readonly opponentProtossMinionReductionCounter: boolean = true;
	readonly playerProtossSpellsCounter: boolean = true;
	readonly opponentProtossSpellsCounter: boolean = true;
	readonly playerDiveTheGolakkaDepthsCounter: boolean = true;
	readonly opponentDiveTheGolakkaDepthsCounter: boolean = true;
	readonly playerCardsPlayedThisTurnCounter: boolean = true;
	readonly opponentStarshipsLaunchedCounter: boolean = true;
	readonly playerRenferalTheMalignantCounter: boolean = true;
	readonly playerDarkGiftsCounter: boolean = true;
	readonly opponentDarkGiftsCounter: boolean = true;

	readonly playerBgsPogoCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerBgsPogoCounterWidgetPosition: { left: number; top: number };

	readonly playerBgsTuskarrRaiderCounter: boolean = true;
	readonly playerBgsLordOfGainsCounter: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly playerBgsLordOfGainsCounterWidgetPosition: { left: number; top: number };

	readonly playerBgsGoldDeltaCounter: boolean = true;
	readonly playerBgsBloodGemCounter: boolean = true;
	readonly playerBgsBeetleCounter: boolean = true;
	readonly playerBgsElementalPowersBuffCounter: boolean = true;
	readonly playerBgsElementalTavernBuffCounter: boolean = true;
	readonly playerBgsTavernSpellsBuffCounter: boolean = true;
	readonly playerBgsBallerCounter: boolean = true;
	readonly playerBgsMagnetizedCounter: boolean = true;
	readonly playerBgsFreeRefreshCounter: boolean = true;
	readonly playerBgsSpellsPlayedCounter: boolean = true;
	readonly playerBgsSouthseaCounter: boolean = true;
	readonly playerBgsMagmalocCounter: boolean = true;
	readonly playerBgsMajordomoCounter: boolean = true;

	readonly replaysLoadPeriod: 'all-time' | 'past-100' | 'last-patch' | 'season-start' | 'past-7' = 'past-100';
	readonly replaysShowNotification: boolean = false;
	readonly replaysFilterDeckstring: string;
	readonly replaysFilterGameMode: string;
	readonly replaysFilterBgHero: string;
	readonly replaysFilterPlayerClass: string;
	readonly replaysFilterOpponentClass: string;
	readonly replaysShowClassIcon: boolean = false;
	readonly replaysShowMercDetails: boolean = true;
	readonly replaysActiveGameModeFilter: string | null = null;
	readonly replaysActiveDeckstringsFilter: readonly string[] = [];
	readonly replaysActiveBgHeroFilter: string | null = null;
	readonly replaysActivePlayerClassFilter: string | null = null;
	readonly replaysActiveOpponentClassFilter: string | null = null;
	readonly replaysHideGamesVsAi: boolean = false;

	readonly bgsFullToggle = true;
	readonly bgsEnableApp = true;
	readonly bgsUseOverlay = false;
	readonly bgsEnableBattleSimulationOverlay = true;
	readonly bgsShowBannedTribesOverlay = true;
	readonly bgsShowHeroTipsOverlay = true;
	readonly bgsShowTrinketTipsOverlay = true;
	readonly bgsShowAvailableTribesOverlay = true;
	readonly bgsUseBannedTribeColors = false;
	readonly bgsShowQuestStatsOverlay = true;
	readonly bgsShowTrinketStatsOverlay = true;
	readonly bgsTribesOverlaySingleRow = false;
	readonly bgsForceShowPostMatchStats2 = false;
	readonly bgsUseNewTiersHeaderStyle = true;
	readonly bgsUseRemoteSimulator = false;
	readonly bgsSimShowIntermediaryResults = true;
	readonly bgsEnableSimulation = true;
	readonly bgsShowHeroSelectionAchievements = true;
	readonly bgsShowHeroSelectionTiers: boolean = true;
	readonly bgsShowNextOpponentRecapSeparately = true;
	readonly bgsHideSimResultsOnRecruit: boolean = true;
	readonly bgsShowSimResultsOnlyOnRecruit: boolean = false;
	readonly bgsEnableSimulationSampleInOverlay = false;
	readonly bgsSimulatorNumberOfSims = 8000;
	readonly bgsSimulatorMaxDurationInMillis = 8000;
	readonly bgsShowEndGameNotif: boolean = true;
	readonly bgsEnableMinionAutoHighlight: boolean = true;
	readonly bgsEnableTribeAutoHighlight: boolean = true;
	// No way to change it for now
	readonly bgsIgnoreGamesEndingBeforeHeroSelection = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsSimulationWidgetPosition: { left: number; top: number };
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsBannedTribesWidgetPosition: { left: number; top: number };
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsHeroTipsWidgetPosition: { left: number; top: number };
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsBannedTribeScale = 101.6;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsSimulatorScale = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsMinionsListScale = 100;
	readonly bgsMinionsListShowCompositions = true;
	readonly bgsMinionsListCompositionsFadeHigherTierCards = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsHeroSelectionOverlayScale = 100;
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
	readonly bgsShowMechanicsTiers: boolean = true;
	readonly bgsShowTribeTiers: boolean = true;
	readonly bgsShowTierSeven: boolean = false;
	readonly bgsShowBuddies: boolean = false;
	readonly bgsShowTrinkets: boolean = true;
	readonly bgsGroupMinionsIntoTheirTribeGroup: boolean = false;
	readonly bgsIncludeTrinketsInTribeGroups: boolean = true;
	readonly bgsMinionListShowGoldenCard: boolean = true;
	readonly bgsMinionListShowSpellsAtBottom: boolean = false;
	readonly bgsMinionsListKeepInBounds: boolean = true;
	readonly bgsShowLastOpponentIconInOverlay: boolean = true;
	readonly bgsShowHeroSelectionScreen: boolean = true;
	readonly bgsShowOverlayButton: boolean = true;
	readonly bgsOpponentOverlayAtTop: boolean = true;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly bgsOverlayButtonPosition: { left: number; top: number };
	readonly bgsQuestsCollapsed: readonly string[] = [];
	readonly bgsUseLeaderboardDataInOverlay: boolean = false;
	readonly bgsShowMmrInLeaderboardOverlay: boolean = false;
	readonly bgsShowMmrInOpponentRecap: boolean = true;
	readonly bgsReconnectorEnabled: boolean = true;
	readonly bgsReconnectorAutoReconnect: boolean = false;
	readonly bgsReconnectorAutoReconnectWaitAfterBoards: boolean = false;
	readonly bgsReconnectorWidgetPosition: { left: number; top: number };

	readonly bgsActiveTimeFilter: BgsActiveTimeFilterType = 'last-patch';
	readonly bgsActiveRankFilter: BgsRankFilterType = 100;
	// readonly bgsCurrentGameRankFilter: BgsRankFilterType = 100;
	readonly bgsActiveTribesFilter: readonly Race[] = [];
	readonly bgsActiveAnomaliesFilter: readonly string[] = [];
	readonly bgsActiveHeroSortFilter: BgsHeroSortFilterType = 'average-position';
	readonly bgsActiveHeroFilter: string = 'all';
	readonly bgsActiveMmrGroupFilter: MmrGroupFilterType = 'per-match';
	readonly bgsActiveCardsCardType: BgsCardTypeFilterType = 'minion';
	readonly bgsActiveCardsSearch: string | null = null;
	readonly bgsActiveCardsTiers: readonly BgsCardTierFilterType[] = [1];
	readonly bgsActiveCompsFilter: readonly string[] = [];
	readonly bgsActiveCardsTurn: number | null = 1;
	readonly bgsSelectedTab3: BgsStatsFilterId = 'hp-by-turn';
	readonly bgsNumberOfDisplayedTabs: number = 1;
	readonly bgsActiveSimulatorMinionTribeFilter: 'all' | 'blank' | string = 'all';
	readonly bgsActiveSimulatorMinionTierFilter: 'all' | '1' | '2' | '3' | '4' | '5' | '6' | '7' = 'all';
	readonly bgsHeroesUseConservativeEstimate: boolean = true;
	readonly bgsShowBuddiesInSimulatorSelection: boolean = false;
	readonly bgsQuestsActiveTab: BgsQuestActiveTabType = 'quests';
	readonly bgsTrinketsActiveTab: BgsTrinketActiveTabType = 'lesser';
	readonly bgsGroupQuestsByDifficulty: boolean = false;
	readonly bgsActiveUseMmrFilterInHeroSelection: boolean = true;
	readonly bgsActiveUseTribesFilterInHeroSelection: boolean = true;
	// readonly bgsActiveUseAnomalyFilterInHeroSelection: boolean = true;
	readonly bgsActiveGameMode: 'battlegrounds' | 'battlegrounds-duo' = 'battlegrounds';
	readonly bgsLeaderboardRegionFilter: 'US' | 'EU' | 'AP' | 'CN' = 'EU';
	readonly bgsLeaderboardPlayerSearch: string;
	readonly bgsYourStatsTypeFilter: 'hero' | 'trinket' = 'hero';
	readonly bgsCompositionsListMode: BgsCompositionsListMode = 'exploring';

	readonly mercenariesActiveModeFilter: MercenariesModeFilterType = 'pve';
	readonly mercenariesActiveRoleFilter: MercenariesRoleFilterType = 'all';
	readonly mercenariesActivePveDifficultyFilter: MercenariesPveDifficultyFilterType = 'all';
	readonly mercenariesActivePvpMmrFilter: MercenariesPvpMmrFilterType = 100;
	readonly mercenariesActiveStarterFilter: MercenariesStarterFilterType = 'all';
	readonly mercenariesActiveFullyUpgradedFilter: MercenariesFullyUpgradedFilterType = 'all';
	readonly mercenariesActiveOwnedFilter: MercenariesOwnedFilterType = 'all';
	readonly mercenariesActiveHeroLevelFilter2: MercenariesHeroLevelFilterType = 30;
	readonly mercenariesHighlightSynergies: boolean = true;
	readonly mercenariesShowTurnCounterInBattle: boolean = true;
	// For now only for PvE
	// readonly mercenariesShowTaskButton: boolean = true;
	readonly mercenariesPersonalHeroesSortCriterion: MercenariesPersonalHeroesSortCriteria = {
		criteria: 'name',
		direction: 'asc',
	};
	readonly mercenariesShowHiddenTeams: boolean = true;
	readonly mercenariesHiddenTeamIds: readonly string[] = [];
	readonly mercenariesShowMercNamesInTeams: boolean = true;
	readonly mercenariesBackupTeam: readonly number[] = [];

	readonly mercenariesEnabled: boolean = false;
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

	readonly arenaActiveMode: ArenaModeFilterType = 'all';
	readonly arenaActiveClassFilter: ArenaClassFilterType = 'all';
	readonly arenaActiveTimeFilter: ArenaTimeFilterType = 'all-time';
	readonly arenaActiveCardClassFilter: ArenaCardClassFilterType = 'all';
	readonly arenaActiveCardTypeFilter: ArenaCardTypeFilterType = 'all';
	readonly arenaActiveWinsFilter: number = 10;
	// TODO: add settings
	readonly arenaShowHeroSelectionOverlay: boolean = true;
	readonly arenaShowCardSelectionOverlay: boolean = true;
	readonly arenaShowCardSelectionOverlayPremiumBanner: boolean = true;
	readonly arenaShowCardStatDuringDiscovers: boolean = true;
	readonly arenaShowOocTracker: boolean = true;
	readonly arenaOocTrackerShowPickRate: boolean = true;
	readonly arenaOocTrackerShowImpact: boolean = true;
	readonly arenaOocTrackerImpactOnlyOnRedraft: boolean = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly arenaOocTrackerScale: number = 100;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly arenaOocTrackerPosition: { left: number; top: number };
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly arenaDraftOverlayScale: number = 80;

	readonly statsXpGraphSeasonFilter: StatsXpGraphSeasonFilterType = 'all-seasons';

	readonly discordRichPresence: boolean = true;
	readonly discordRpcEnableCustomInMatchText: boolean = false;
	readonly discordRpcEnableCustomInGameText: boolean = false;
	readonly discordRpcCustomInGameText: string;
	readonly discordRpcCustomInMatchText: string;

	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly twitchAccessToken: string | undefined;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly twitchUserName: string | undefined;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly twitchLoginName: string | undefined;
	readonly twitchDelay: number = 0;
	readonly appearOnLiveStreams: boolean = true;

	// TODO: move somewhere else
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly outOfCardsToken: OutOfCardsToken | null;
	readonly outOfCardsShowNotifOnSync: boolean = false;
	readonly hearthpwnSync: boolean = false;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly hearthpwnUserId: number;
	@Reflect.metadata(FORCE_LOCAL_PROP, true)
	readonly hearthpwnAuthToken: string;
	readonly hsGuruCollectionSync: boolean = false;

	readonly d0nkeySync: boolean = true;
	readonly hearthstoneDecksSync: boolean = true;

	readonly ftue: Ftue = new Ftue();

	public static deserialize(input: Preferences): Preferences {
		return {
			...input,
			lastUpdateDate: input.lastUpdateDate ? new Date(input.lastUpdateDate) : null,
			currentSessionStartDate: input.currentSessionStartDate ? new Date(input.currentSessionStartDate) : null,
			arenaCurrentSessionStartDate: input.arenaCurrentSessionStartDate
				? new Date(input.arenaCurrentSessionStartDate)
				: null,
		};
	}
}

export type CollectionSetStatsTypeFilterType = 'cards-stats' | 'cards-history';
export type BooleanWithLimited = boolean | 'limited';
export type BgsCompositionsListMode = 'exploring' | 'browsing';
export type BgsCardTypeFilterType = 'minion' | 'spell';
export type BgsCardTierFilterType = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ArenaSessionWidgetTimeFrame = 'current-season' | 'all-time';
export type ArenaModeFilterType = 'arena' | 'arena-underground' | 'arena-legacy' | 'all';
export type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
