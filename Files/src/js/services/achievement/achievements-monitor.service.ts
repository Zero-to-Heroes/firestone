import { Injectable } from '@angular/core';
import { GameEvent } from '../../models/game-event';
import { GameEvents } from '../game-events.service';
import { AchievementCompletedEvent } from '../mainwindow/store/events/achievements/achievement-completed-event';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { AchievementsLoaderService } from './data/achievements-loader.service';

@Injectable()
export class AchievementsMonitor {
	constructor(
		private gameEvents: GameEvents,
		private achievementLoader: AchievementsLoaderService,
		private store: MainWindowStoreService,
	) {
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.handleEvent(gameEvent);
		});
	}

	private handleEvent(gameEvent: GameEvent) {
		// console.log('[achievements] handling events', gameEvent, this.achievementLoader.challengeModules);
		for (const challenge of this.achievementLoader.challengeModules) {
			challenge.detect(gameEvent, () => {
				this.store.stateUpdater.next(new AchievementCompletedEvent(challenge));
			});
		}
	}
}
