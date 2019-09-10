import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class FormatTypeReq implements Requirement {
	private isCorrectFormatType: boolean;

	constructor(private readonly formatTypes: readonly number[]) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for FormatType', rawReq);
		}
		return new FormatTypeReq(rawReq.values.map(gameType => parseInt(gameType)));
	}

	reset(): void {
		this.isCorrectFormatType = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isCorrectFormatType = undefined;
	}

	isCompleted(): boolean {
		if (process.env.NODE_ENV === 'local-test') {
			console.error(
				'Validating requirement in local test to make achievemnet validation easier',
				'should never be turned on in prod',
				this,
			);
			return true;
		}
		return this.isCorrectFormatType;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.MATCH_METADATA) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		if (this.formatTypes.indexOf(gameEvent.additionalData.metaData.FormatType) !== -1) {
			this.isCorrectFormatType = true;
		}
	}
}
