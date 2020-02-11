import { Ftue } from './preferences/ftue';

export class Preferences {
	readonly id: number = 1;
	readonly dontConfirmVideoReplayDeletion: boolean;
	readonly dontRecordAchievements: boolean = true;
	readonly hasSeenVideoCaptureChangeNotif: boolean;

	readonly showDust: boolean = true;
	readonly showCommon: boolean = true;
	readonly showCardsOutsideOfPacks: boolean = true;
	readonly collectionHistoryShowOnlyNewCards: boolean = false;

	readonly decktrackerShowArena: boolean;
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
	readonly decktrackerNoDeckMode: boolean = false;

	// readonly overlayDisplayMode: string;
	readonly overlayShowTitleBar: boolean = true;
	readonly overlayHighlightCardsInHand: boolean = false;
	readonly overlayWidthInPx: number = 227;
	readonly overlayOpacityInPercent: number = 100;
	readonly overlayShowTooltipsOnHover: boolean = true;
	readonly overlayGroupByZone: boolean = true;
	readonly overlayShowRarityColors: boolean = true;
	readonly overlayCardsGoToBottom: boolean = false;

	readonly opponentTracker: boolean = false;
	readonly opponentOverlayCardsGoToBottom: boolean = true;
	readonly opponentOverlayGroupByZone: boolean = false;
	readonly opponentOverlayWidthInPx: number = 227;
	readonly opponentOverlayOpacityInPercent: number = 100;
	readonly opponentOverlayScale: number = 100;
	readonly opponentOverlayPosition: { left: number; top: number };
	readonly opponentLoadAiDecklist: boolean = true;

	readonly secretsHelperOpacity: number = 100;
	readonly secretsHelperScale: number = 80;
	readonly secretsHelperCardsGoToBottom: boolean = true;
	readonly secretsHelperPosition: { left: number; top: number };

	readonly replaysShowNotification: boolean = true;

	readonly achievementsDisplayNotifications = true;
	readonly resetAchievementsOnAppStart = false;

	readonly battlegroundsShowLastOpponentBoard = false;
	readonly batlegroundsShowHeroSelectionPref = false;

	readonly launchAppOnGameStart: boolean = true;

	readonly twitchAccessToken: string;
	readonly twitchUserName: string;

	readonly ftue: Ftue = new Ftue();
}
