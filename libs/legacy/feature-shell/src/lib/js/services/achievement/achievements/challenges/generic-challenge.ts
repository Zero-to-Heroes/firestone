import { GameEvent } from '../../../../models/game-event';
import { Requirement } from '../requirements/_requirement';
import { Challenge } from './challenge';

export class GenericChallenge implements Challenge {
	readonly achievementId: string;
	readonly resetEvents: readonly string[];
	readonly stateProperties: readonly string[];
	readonly requirements: readonly Requirement[];

	protected callback = undefined;

	constructor(achievementId: string, resetEvents: readonly string[], requirements: readonly Requirement[]) {
		this.achievementId = achievementId;
		this.resetEvents = resetEvents || [];
		this.requirements = requirements || [];
	}

	public detect(gameEvent: GameEvent, callback: () => void) {
		// TODO: looks weird to do this for every event
		if (!this.callback) {
			this.callback = callback;
		}
		if (this.resetEvents.indexOf(gameEvent.type) !== -1) {
			this.resetState();
		}
		this.requirements.forEach((req) => {
			try {
				if (req.individualResetEvents && req.individualResetEvents.indexOf(gameEvent.type) !== -1) {
					req.reset();
				}
				req.test(gameEvent);
			} catch (e) {
				console.error(
					'no-format',
					'[achievements-monitor] Exception while parsing req',
					req['rawReq'],
					gameEvent,
					e,
				);
				throw e;
			}
		});
		this.testCompletion();
	}

	public resetState(): void {
		this.callback = undefined;
		this.requirements.forEach((req) => req.reset());
	}

	public getRecordingDuration(): number {
		return 15000;
	}

	public getRecordPastDurationMillis(): number {
		return 2000;
	}

	public notificationTimeout(): number {
		return 1000;
	}

	protected testCompletion() {
		const allRequirementsCompleted = this.requirements.every((req) => req.isCompleted());
		if (this.callback && allRequirementsCompleted) {
			this.resetStateAfterComplete();
			this.callback();
		}
	}

	private resetStateAfterComplete() {
		this.requirements.forEach((req) => req.afterAchievementCompletionReset());
	}
}
