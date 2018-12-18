export class Preferences {

	readonly id: number = 1;
	readonly hasSeenPityTimerFtue: boolean;
	readonly dontConfirmVideoReplayDeletion: boolean;
	readonly dontRecordAchievements: boolean;

	constructor(
			hasSeenPityTimerFtue: boolean,
			dontConfirmVideoReplayDeletion: boolean,
			dontRecordAchievements: boolean) {
		this.hasSeenPityTimerFtue = hasSeenPityTimerFtue;
		this.dontConfirmVideoReplayDeletion = dontConfirmVideoReplayDeletion;
		this.dontRecordAchievements = dontRecordAchievements;
	}
}
