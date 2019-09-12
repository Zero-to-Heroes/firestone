import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Achievement } from 'src/js/models/achievement';
import { BroadcastEvent, Events } from '../events.service';
import { Message, OwNotificationsService } from '../notifications.service';
import { PreferencesService } from '../preferences.service';
import { ProcessingQueue } from '../processing-queue.service';
import { Challenge } from './achievements/challenges/challenge';
import { AchievementsLoaderService } from './data/achievements-loader.service';

declare var ga;

@Injectable()
export class AchievementsNotificationService {
	// private eventsToProcess: InternalEvent[] = [];
	// private processingEvents = false;
	// private intervalHandle;
	private processingQueue = new ProcessingQueue<InternalEvent>(
		eventQueue => this.processQueue(eventQueue),
		1000,
		'achievement-notification',
	);
	private lastReceivedTimestamp;

	constructor(
		private logger: NGXLogger,
		private notificationService: OwNotificationsService,
		private prefs: PreferencesService,
		private achievementLoader: AchievementsLoaderService,
		private events: Events,
	) {
		this.events.on(Events.ACHIEVEMENT_COMPLETE).subscribe(data => this.enqueue(data, 'completion'));
		this.events.on(Events.ACHIEVEMENT_RECORDING_STARTED).subscribe(data => this.enqueue(data, 'pre-record'));
		this.events.on(Events.ACHIEVEMENT_RECORDED).subscribe(data => this.enqueue(data, 'record-complete'));
		this.logger.debug('[achievements-notification] listening for achievement completion events');
		this.lastReceivedTimestamp = Date.now();
	}

	private async processQueue(eventQueue: readonly InternalEvent[]): Promise<readonly InternalEvent[]> {
		// Don't process an event if we've just received one, as it could indicate that other
		// related events will come soon as well
		if (Date.now() - this.lastReceivedTimestamp < 500) {
			this.logger.debug('[achievements-notification] too soon, waiting before processing');
			return eventQueue;
		}
		const candidate: InternalEvent = eventQueue[0];
		this.logger.debug('[achievements-notification] found a candidate', candidate);
		// Is there a better candidate?
		const betterCandidate: InternalEvent = eventQueue
			.filter(event => event.notificationType === candidate.notificationType)
			.filter(event => event.achievement.type === candidate.achievement.type)
			.sort((a, b) => b.achievement.priority - a.achievement.priority)[0];
		this.logger.debug('[achievements-notification] top candidate', betterCandidate, eventQueue);
		switch (betterCandidate.notificationType) {
			case 'completion':
				this.handleAchievementCompleted(betterCandidate.initialEvent.data[0], betterCandidate.initialEvent.data[1]);
				break;
			case 'pre-record':
				this.handleAchievementRecordingStarted(betterCandidate.initialEvent.data[0], betterCandidate.initialEvent.data[1]);
				break;
			case 'record-complete':
				this.handleAchievementRecordCompleted(betterCandidate.initialEvent.data[0], betterCandidate.initialEvent.data[1]);
				break;
		}
		// Now remove all the related events
		return eventQueue.filter(
			event =>
				event.notificationType !== betterCandidate.notificationType || event.achievement.type !== betterCandidate.achievement.type,
		);
	}

	private enqueue(event: BroadcastEvent, type: 'completion' | 'pre-record' | 'record-complete') {
		this.logger.debug('[achievements-notification] enqueuing event', event, type);
		const internalEvent: InternalEvent = {
			achievement: event.data[0],
			initialEvent: event,
			notificationType: type,
		};
		this.lastReceivedTimestamp = Date.now();
		this.processingQueue.enqueue(internalEvent);
	}

	private async handleAchievementCompleted(achievement: Achievement, challenge: Challenge) {
		this.logger.debug('[achievements-notification] preparing achievement completed notification', achievement.id);
		if (achievement.numberOfCompletions >= 1) {
			this.logger.debug('[achievements-notification] achievement already completed, not sending any notif');
			return;
		}
		ga('send', 'event', 'new-achievement', achievement.id);
		const notificationTimeout = challenge.notificationTimeout();
		this.logger.debug('[achievements-notification] sending new achievement completed notification', achievement.id);
		const recordingOff = (await this.prefs.getPreferences()).dontRecordAchievements;
		const recapText = recordingOff
			? `Recording is disabled - <a class="open-settings">click here</a> to turn it on`
			: `Your replay is being recorded...<span class="loader"></span>`;
		this.notificationService.html({
			notificationId: achievement.id,
			content: this.buildNotificationTemplate(achievement, recapText),
			type: 'achievement-no-record',
			app: 'achievement',
			cardId: achievement.id,
			timeout: notificationTimeout,
			theClass: 'no-record',
		} as Message);
	}

	private async handleAchievementRecordingStarted(achievement: Achievement, challenge: Challenge) {
		this.logger.debug('[achievements-notification] in pre-record notification');
		const notificationTimeout = challenge.notificationTimeout();
		this.logger.debug('[achievements-notification] sending new notification', achievement.id);
		let recapText = `Your replay is being recorded...<span class="loader"></span>`;
		this.notificationService.html({
			notificationId: achievement.id,
			content: this.buildNotificationTemplate(achievement, recapText, 'unclickable'),
			type: 'achievement-pre-record',
			app: 'achievement',
			cardId: achievement.id,
			timeout: notificationTimeout,
			theClass: 'pending',
		});
	}

	private async handleAchievementRecordCompleted(newAchievement: Achievement, challenge: Challenge) {
		const achievement: Achievement = await this.achievementLoader.getAchievement(newAchievement.id);
		// In case the pre-record notification has already timed out, we need to send a full notif
		this.notificationService.html({
			notificationId: achievement.id,
			content: this.buildNotificationTemplate(achievement, undefined),
			type: 'achievement-confirm',
			app: 'achievement',
			cardId: achievement.id,
			theClass: 'active',
		});
	}

	private buildNotificationTemplate(achievement: Achievement, recapText: string, unclickable?: 'unclickable'): string {
		return `
			<div class="achievement-message-container ${achievement.id} ${unclickable}">
				<div class="achievement-image-container">
					<img
						src="https://static.zerotoheroes.com/hearthstone/cardart/256x/${achievement.displayCardId}.jpg"
						class="real-achievement ${achievement.displayCardType}"/>
					<i class="i-84x90 frame">
						<svg>
							<use xlink:href="/Files/assets/svg/sprite.svg#achievement_frame"/>
						</svg>
					</i>
				</div>
				<div class="message">
					<div class="title">
						<i class="icon-svg">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#${achievement.icon}"/>
							</svg>
						</i>
						<span>Achievement unlocked!</span>
					</div>
					<span class="text">${achievement.displayName}</span>
					<div class="recap-text">
						<span class="pending">${recapText}</span>
						<span class="active">Replay saved! Click to recap</span>
						<span class="no-record">Achievement saved! Click to recap</span>
					</div>
				</div>
				<button class="i-30 close-button">
					<svg class="svg-icon-fill">
						<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
					</svg>
				</button>
			</div>`;
	}
}

interface InternalEvent {
	readonly initialEvent: BroadcastEvent;
	readonly achievement: Achievement;
	readonly notificationType: 'completion' | 'pre-record' | 'record-complete';
}
