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
		return new FormatTypeReq(rawReq.values.map((gameType) => parseInt(gameType)));
	}

	reset(): void {
		// console.log('[debug] [format] reset');
		this.isCorrectFormatType = undefined;
	}

	afterAchievementCompletionReset(): void {
		// console.log('[debug] [format] afterAchievementCompletionReset');
		this.isCorrectFormatType = undefined;
	}

	isCompleted(): boolean {
		if (process.env.LOCAL_TEST) {
			return true;
		}
		// console.log('[debug] [format] isCompleted', this.isCorrectFormatType);
		return this.isCorrectFormatType;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.MATCH_METADATA) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		if (this.formatTypes.includes(gameEvent.additionalData.metaData.FormatType)) {
			this.isCorrectFormatType = true;
		}
		// console.log('[debug] [format] metadata', this.isCorrectFormatType, gameEvent, this.formatTypes);
	}
}
