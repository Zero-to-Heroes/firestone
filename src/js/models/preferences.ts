import { BinderPrefs } from './preferences/binder-prefs';
import { Ftue } from './preferences/ftue';

export class Preferences {
	readonly id: number = 1;
	readonly dontConfirmVideoReplayDeletion: boolean;
	readonly dontRecordAchievements: boolean = true;
	readonly hasSeenVideoCaptureChangeNotif: boolean;

	readonly decktrackerShowArena: boolean;
	readonly decktrackerShowRanked: boolean = true;
	readonly decktrackerShowTavernBrawl: boolean = true;
	readonly decktrackerShowPractice: boolean = true;
	readonly decktrackerShowFriendly: boolean = true;
	readonly decktrackerShowCasual: boolean = true;
	readonly decktrackerSkin: string = 'original';
	readonly decktrackerScale: number = 100;
	readonly decktrackerPosition: { left: number; top: number };

	readonly dectrackerShowOpponentTurnDraw: boolean = true;
	readonly dectrackerShowOpponentGuess: boolean = true;
	readonly decktrackerNoDeckMode: boolean = false;

	readonly overlayDisplayMode: string;
	readonly overlayShowTitleBar: boolean = true;
	readonly overlayHighlightCardsInHand: boolean = false;
	readonly overlayWidthInPx: number = 250;
	readonly overlayOpacityInPercent: number = 100;
	readonly overlayShowTooltipsOnHover: boolean = true;

	readonly replaysShowNotification: boolean = true;

	readonly achievementsDisplayNotifications = true;
	readonly resetAchievementsOnAppStart = false;

	readonly battlegroundsShowLastOpponentBoard = false;
	readonly batlegroundsShowHeroSelectionPref = false;

	readonly launchAppOnGameStart: boolean = true;
	readonly binder: BinderPrefs = new BinderPrefs();

	readonly twitchAccessToken: string;
	readonly twitchUserName: string;

	readonly ftue: Ftue = new Ftue();
}
