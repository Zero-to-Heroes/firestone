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
	readonly dectrackerShowOpponentTurnDraw: boolean = true;
	readonly dectrackerShowOpponentGuess: boolean = true;
	readonly decktrackerSkin: string = 'original';
	readonly decktrackerScale: number = 100;
	readonly overlayDisplayMode: string;
	readonly overlayShowTitleBar: boolean = true;
	readonly overlayWidthInPx: number = 250;
	readonly launchAppOnGameStart: boolean = true;
	readonly alwaysShowNotificationPopups = false;
	readonly binder: BinderPrefs = new BinderPrefs();

	readonly twitchAccessToken: string;
	readonly twitchUserName: string;

	readonly ftue: Ftue = new Ftue();
}
