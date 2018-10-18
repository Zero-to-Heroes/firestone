import { Injectable, EventEmitter } from '@angular/core';

import { GameEvent } from '../../models/game-event';
import { CompletedAchievement } from '../../models/completed-achievement';

import { AchievementsRefereee } from './achievements-referee.service';
import { AchievementsRepository } from './achievements-repository.service';

import { Events } from '../events.service';
import { GameEvents } from '../game-events.service';
import { AchievementHistoryStorageService } from './achievement-history-storage.service';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { OwNotificationsService } from '../notifications.service';
import { Achievement } from 'src/js/models/achievement';
import { AchievementNameService } from './achievement-name.service';

declare var ga;

@Injectable()
export class AchievementsMonitor {

	public newAchievements = new EventEmitter<CompletedAchievement>();

	constructor(
		private gameEvents: GameEvents,
		private notificationService: OwNotificationsService,
		private nameService: AchievementNameService,
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
				const achievement: Achievement = this.repository.getAllAchievements()
					.filter((ach) => ach.id == newAchievement.id)
					[0];
				this.storeNewAchievement(achievement, newAchievement.numberOfCompletions);
				if (newAchievement.numberOfCompletions == 1) {
					this.sendNotification(achievement);
				}
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

	private storeNewAchievement(achievement: Achievement, numberOfCompletions: number) {
		this.storage.save(new AchievementHistory(
			achievement.id, 
			achievement.name, 
			numberOfCompletions, 
			achievement.difficulty));
	}

	private sendNotification(achievement: Achievement) {
		const text = this.nameService.displayName(achievement.id);
		console.log('sending new notification', text);
		this.notificationService.html({
			content: `
				<div class="achievement-message-container">
					<div class="achievement-image-container">
						<img src="http://static.zerotoheroes.com/hearthstone/cardart/256x/${achievement.cardId}.jpg" class="real-achievement"/>
						<i class="i-84x90 frame">
							<svg>
								<use xlink:href="/Files/assets/svg/sprite.svg#achievement_frame"/>
							</svg>
						</i>
					</div>
					<div class="message">
						<span class="title">Achievement unlocked!</span>
						<span class="text">${text}</span>
						<span class="recap-text">Click to recap</span>
					</div>
					<button class="i-30 close-button">
						<svg class="svg-icon-fill">
							<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
						</svg>
					</button>
				</div>`,
			type: 'achievement',
			cardId: achievement.id
		});
	}
}
