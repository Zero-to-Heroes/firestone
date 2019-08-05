import { MainWindowStoreEvent } from '../main-window-store-event';
import { Challenge } from '../../../../achievement/achievements/challenge';

export class AchievementCompletedEvent implements MainWindowStoreEvent {
	constructor(challenge: Challenge) {
		this.challenge = challenge;
	}
	readonly challenge: Challenge;

	public static eventName(): string {
		return 'AchievementCompletedEvent';
	}

	public eventName(): string {
		return 'AchievementCompletedEvent';
	}
}
