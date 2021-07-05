import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class ArmorAtEndReq implements Requirement {
	private hasCorrectArmorAtEnd: boolean;

	constructor(private readonly targetArmor: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for ArmorAtEndReq', rawReq);
		}
		return new ArmorAtEndReq(parseInt(rawReq.values[0]));
	}

	reset(): void {
		this.hasCorrectArmorAtEnd = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.hasCorrectArmorAtEnd = undefined;
	}

	isCompleted(): boolean {
		return this.hasCorrectArmorAtEnd;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.GAME_END) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		if (gameEvent.additionalData.report?.LocalPlayer?.ArmorLeft === this.targetArmor) {
			this.hasCorrectArmorAtEnd = true;
		}
	}
}
