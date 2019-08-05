import { Challenge } from './challenge';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';

export abstract class AbstractChallenge implements Challenge {
	protected readonly achievementId: string;
	protected readonly modeOrScenarioIds: readonly number[];
	protected readonly events: Events;
	protected readonly resetEvents: readonly string[];
	protected readonly stateProperties: readonly string[];

	protected correctMode = false;
	protected callback = undefined;

	constructor(achievement, modeOrScenarioIds: readonly number[], events: Events, resetEvents: readonly string[]) {
		if (!achievement) {
			console.error('Trying to set an empty achievement', modeOrScenarioIds, resetEvents, this);
		}
		this.achievementId = achievement.id;
		this.modeOrScenarioIds = modeOrScenarioIds;
		this.events = events;
		this.resetEvents = resetEvents || [];
	}

	protected abstract detectEvent(gameEvent: GameEvent, callback: Function);
	protected abstract resetState();

	public detect(gameEvent: GameEvent, callback: Function) {
		if (this.resetEvents.indexOf(gameEvent.type) !== -1) {
			// console.log('resetting', this, gameEvent);
			this.callback = undefined;
			this.correctMode = undefined;
			this.resetState();
		}
		// Make sure we're limiting the achievement to the right mode
		if (gameEvent.type === GameEvent.MATCH_METADATA) {
			this.detectScenario(gameEvent);
		}
		this.detectEvent(gameEvent, callback);
	}

	public getAchievementId() {
		return this.achievementId;
	}

	public defaultAchievement() {
		return new CompletedAchievement(this.achievementId, 0, []);
	}

	public getRecordingDuration(): number {
		return 10000;
	}

	public notificationTimeout(): number {
		return 5000;
	}

	public getRecordPastDurationMillis(): number {
		return 1000;
	}

	protected detectScenario(gameEvent: GameEvent) {
		// console.log('detecting scenario', gameEvent)
		if (
			this.modeOrScenarioIds.length === 0 ||
			this.modeOrScenarioIds.indexOf(parseInt(gameEvent.additionalData.metaData.ScenarioID)) !== -1 ||
			this.modeOrScenarioIds.indexOf(parseInt(gameEvent.additionalData.metaData.GameType)) !== -1
		) {
			this.correctMode = true;
			// console.log('correct scenario');
			this.handleCompletion();
		}
	}

	protected handleCompletion() {
		// console.log('handling completion', this.correctMode, this.callback, this);
		if (this.correctMode && this.callback) {
			// console.log('completing achievement', this.achievementId, this);
			const complete = this.additionalCheckForCompletion();
			if (complete) {
				this.callback();
				// this.broadcastEndOfCapture();
			}
		}
	}

	protected additionalCheckForCompletion() {
		return true;
	}
}
