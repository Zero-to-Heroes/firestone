import { GameEvent } from '@firestone/game-state';
import { Requirement } from '../requirements/_requirement';
import { Challenge } from './challenge';

export interface MatchFilters {
	readonly allowedGameTypes?: readonly number[];
	readonly allowedScenarioIds?: readonly number[];
	readonly excludedScenarioIds?: readonly number[];
}

export class GenericChallenge implements Challenge {
	readonly achievementId: string;
	readonly resetEvents: readonly string[];
	readonly stateProperties: readonly string[];
	readonly requirements: readonly Requirement[];
	readonly listensToAllGameEvents: boolean;
	readonly interestedGameEventTypes: ReadonlySet<string> | null;

	protected callback = undefined;

	constructor(
		achievementId: string,
		resetEvents: readonly string[],
		requirements: readonly Requirement[],
		listensToAllGameEvents: boolean,
		interestedGameEventTypes: ReadonlySet<string> | null,
		private readonly matchFilters: MatchFilters | undefined,
	) {
		this.achievementId = achievementId;
		this.resetEvents = resetEvents || [];
		this.requirements = requirements || [];
		this.listensToAllGameEvents = listensToAllGameEvents;
		this.interestedGameEventTypes = interestedGameEventTypes;
	}

	public isEligibleForMatch(gameType: number | undefined, scenarioId: number | undefined): boolean {
		const filters = this.matchFilters;
		if (!filters) {
			return true;
		}
		const { allowedGameTypes, allowedScenarioIds, excludedScenarioIds } = filters;
		if (allowedGameTypes?.length && gameType !== undefined && !allowedGameTypes.includes(gameType)) {
			return false;
		}
		if (allowedScenarioIds?.length && scenarioId !== undefined && !allowedScenarioIds.includes(scenarioId)) {
			return false;
		}
		if (excludedScenarioIds?.length && scenarioId !== undefined && excludedScenarioIds.includes(scenarioId)) {
			return false;
		}
		return true;
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
