import { Injectable, EventEmitter } from '@angular/core';

import { GameEvent } from '../../models/game-event';
import { CompletedAchievement } from '../../models/completed-achievement';

import { AchievementsRefereee } from './achievements-referee.service';
import { AchievementsRepository } from './achievements-repository.service';

import { Events } from '../events.service';
import { GameEvents } from '../game-events.service';
import { AchievementHistoryStorageService } from './achievement-history-storage.service';
import { AchievementHistory } from '../../models/achievement/achievement-history';

declare var ga;

@Injectable()
export class AchievementsMonitor {

	public newAchievements = new EventEmitter<CompletedAchievement>();

	constructor(
		private gameEvents: GameEvents,
		private achievementsReferee: AchievementsRefereee,
		private storage: AchievementHistoryStorageService,
		private repository: AchievementsRepository,
		private events: Events) {

		this.gameEvents.allEvents.subscribe(
			(gameEvent: GameEvent) => {
				this.handleEvent(gameEvent);
			}
		);
		this.newAchievements.subscribe(
			(newAchievement: CompletedAchievement) => {
				// console.log('[achievements] WOOOOOOHOOOOOOOOO!!!! New achievement!', newAchievement);
				ga('send', 'event', 'new-achievement', newAchievement.id);
				this.events.broadcast(Events.NEW_ACHIEVEMENT, newAchievement);
				this.storeNewAchievement(newAchievement);
				// this.notifications.html(`<div class="message-container"><img src="${newAchievement.icon}"><div class="message">Achievement unlocked! ${newAchievement.title}</div></div>`)
			}
		);
		console.log('listening for achievement completion events');
	}

	private handleEvent(gameEvent: GameEvent) {
		// console.log('[achievements] handling events', gameEvent);
		for (let challenge of this.repository.challengeModules) {
			challenge.detect(gameEvent, (data) => {
				// console.log('[achievements] challenge completed', gameEvent, data, challenge);
				this.achievementsReferee.complete(challenge, (newAchievement) => {
					this.newAchievements.next(newAchievement);
				}, data);
			});
		}
	}

	private storeNewAchievement(completedAchievement: CompletedAchievement) {
		const achievement = this.repository.getAllAchievements()
			.filter((ach) => ach.id == completedAchievement.id)
			[0];
		this.storage.save(new AchievementHistory(
			achievement.id, 
			achievement.name, 
			completedAchievement.numberOfCompletions, 
			achievement.difficulty));
	}
}
