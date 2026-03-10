import { Achievement } from '@firestone/achievements/common';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class AchievementCompletedEvent implements MainWindowStoreEvent {
	
	readonly eventName = AchievementCompletedEvent.eventName

	constructor(public readonly achievement: Achievement) {}

	static readonly eventName = 'AchievementCompletedEvent'
}
