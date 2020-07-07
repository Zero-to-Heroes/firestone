import { Ftue } from './preferences/ftue';

export class Preferences {
	readonly id: number = 1;

	readonly launchAppOnGameStart: boolean = true;
	readonly showSessionRecapOnExit: boolean = true;
	readonly shareGamesWithVS: boolean = true;

	readonly advancedModeToggledOn: boolean;

	readonly dontConfirmVideoReplayDeletion: boolean;
	readonly dontRecordAchievements: boolean = true;
	readonly hasSeenVideoCaptureChangeNotif: boolean;

	readonly showDust: boolean = true;
	readonly showCommon: boolean = true;
	readonly showCardsOutsideOfPacks: boolean = true;
	readonly collectionHistoryShowOnlyNewCards: boolean = false;

	readonly collectionUseOverlay: boolean;

	readonly decktrackerShowArena: boolean = true;
	readonly decktrackerShowRanked: boolean = true;
	readonly decktrackerShowTavernBrawl: boolean = true;
	readonly decktrackerShowPractice: boolean = true;
	readonly decktrackerShowFriendly: boolean = true;
	readonly decktrackerShowCasual: boolean = true;
	readonly decktrackerCloseOnGameEnd: boolean = true;
	readonly decktrackerScale: number = 100;
	readonly decktrackerPosition: { left: number; top: number };

	readonly dectrackerShowOpponentTurnDraw: boolean = true;
	readonly dectrackerShowOpponentGuess: boolean = true;
	readonly dectrackerShowOpponentBuff: boolean = false;
	readonly dectrackerLimitOpponentBuff: boolean = true;
	readonly dectrackerMaxOpponentsBuffToShow: number = 3;

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
	readonly overlayHideGeneratedCardsInOtherZone: boolean = false;
	readonly overlaySortByManaInOtherZone: boolean = false;
	readonly decktrackerNoDeckMode: boolean = false;
	readonly overlayOpacityInPercent: number = 100;
	readonly overlayWidthInPx: number = 227; // No UI

	readonly opponentOverlayGroupByZone: boolean = true;
	readonly opponentOverlayCardsGoToBottom: boolean = true;
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
	readonly playerAttackCounter: boolean = true;
	readonly playerAttackCounterWidgetPosition: { left: number; top: number };
	readonly opponentAttackCounter: boolean = true;
	readonly opponentAttackCounterWidgetPosition: { left: number; top: number };

	readonly playerBgsPogoCounter: boolean = true;
	readonly playerBgsPogoCounterWidgetPosition: { left: number; top: number };

	readonly replaysShowNotification: boolean = true;

	readonly achievementsDisplayNotifications = true;
	readonly resetAchievementsOnAppStart = false;

	readonly battlegroundsShowLastOpponentBoard = false;
	readonly batlegroundsShowHeroSelectionPref = false;

	readonly bgsEnableApp = true;
	readonly bgsUseOverlay = false;
	readonly bgsEnableBattleSimulationOverlay = true;
	readonly bgsShowBannedTribesOverlay = true;
	readonly bgsUseLocalSimulator = true;
	readonly bgsUseLocalPostMatchStats = true;
	readonly bgsEnableSimulation = true;
	readonly bgsSimulatorNumberOfSims = 2500;
	readonly bgsSimulationWidgetPosition: { left: number; top: number };
	readonly bgsBannedTribesWidgetPosition: { left: number; top: number };

	readonly twitchAccessToken: string;
	readonly twitchUserName: string;

	readonly ftue: Ftue = new Ftue();
}
