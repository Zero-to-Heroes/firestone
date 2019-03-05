export class Preferences {

	readonly id: number = 1;
	readonly hasSeenPityTimerFtue: boolean;
	readonly dontConfirmVideoReplayDeletion: boolean;
	readonly dontRecordAchievements: boolean;
	readonly hasSeenVideoCaptureChangeNotif: boolean;
	readonly decktrackerShowArena: boolean;
	readonly decktrackerShowRanked: boolean = true;

	constructor(
			hasSeenPityTimerFtue: boolean,
			dontConfirmVideoReplayDeletion: boolean,
			hasSeenVideoCaptureChangeNotif: boolean,
			dontRecordAchievements: boolean,
			decktrackerShowArena: boolean,
			decktrackerShowRanked: boolean) {
		this.hasSeenPityTimerFtue = hasSeenPityTimerFtue;
		this.dontConfirmVideoReplayDeletion = dontConfirmVideoReplayDeletion;
		this.dontRecordAchievements = dontRecordAchievements;
		this.hasSeenVideoCaptureChangeNotif = hasSeenVideoCaptureChangeNotif;
		this.decktrackerShowArena = decktrackerShowArena;
		this.decktrackerShowRanked = decktrackerShowRanked;
	}
}
