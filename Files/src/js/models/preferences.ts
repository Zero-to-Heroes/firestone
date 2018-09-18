export class Preferences {

	readonly id: number = 1;
	readonly hasSeenPityTimerFtue: boolean;

	constructor(hasSeenPityTimerFtue: boolean) {
		this.hasSeenPityTimerFtue = hasSeenPityTimerFtue;
	}
}
