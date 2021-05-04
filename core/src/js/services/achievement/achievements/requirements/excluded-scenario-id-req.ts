import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class ExcludedScenarioIdReq implements Requirement {
	private isExcludedScenario: boolean;

	constructor(private readonly excludedScenarioIds: readonly number[]) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for ScenarioIdReq', rawReq);
		}
		return new ExcludedScenarioIdReq(rawReq.values.map((id) => parseInt(id)));
	}

	reset(): void {
		this.isExcludedScenario = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isExcludedScenario = undefined;
	}

	isCompleted(): boolean {
		return !this.isExcludedScenario;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.MATCH_METADATA) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		if (this.excludedScenarioIds.indexOf(gameEvent.additionalData.metaData.ScenarioID) !== -1) {
			this.isExcludedScenario = true;
		}
	}
}
