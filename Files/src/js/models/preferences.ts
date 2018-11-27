export class Preferences {

	readonly id: number = 1;
	readonly hasSeenPityTimerFtue: boolean;
    readonly dontConfirmVideoReplayDeletion: boolean;

	constructor(
			hasSeenPityTimerFtue: boolean,
			dontConfirmVideoReplayDeletion: boolean) {
		this.hasSeenPityTimerFtue = hasSeenPityTimerFtue;
		this.dontConfirmVideoReplayDeletion = dontConfirmVideoReplayDeletion;
	}
}
