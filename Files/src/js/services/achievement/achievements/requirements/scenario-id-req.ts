import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class ScenarioIdReq implements Requirement {
	private isCorrectScenario: boolean;

	constructor(private readonly scenarioIds: readonly string[]) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for ScenarioIdReq', rawReq);
		}
		return new ScenarioIdReq(rawReq.values);
	}

	reset(): void {
		this.isCorrectScenario = undefined;
	}

	afterAchievementCompletionReset(): void {
		// Do nothing
	}

	isCompleted(): boolean {
		return this.isCorrectScenario;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.MATCH_METADATA) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		if (this.scenarioIds.indexOf(gameEvent.additionalData.metaData.ScenarioID) !== -1) {
			this.isCorrectScenario = true;
		}
	}
}
