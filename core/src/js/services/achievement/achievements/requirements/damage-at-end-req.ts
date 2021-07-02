import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class DamageAtEndReq implements Requirement {
	private hasCorrectDamageAtEnd: boolean;

	constructor(private readonly targetDamage: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for DamageAtEndReq', rawReq);
		}
		return new DamageAtEndReq(parseInt(rawReq.values[0]));
	}

	reset(): void {
		this.hasCorrectDamageAtEnd = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.hasCorrectDamageAtEnd = undefined;
	}

	isCompleted(): boolean {
		return this.hasCorrectDamageAtEnd;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.GAME_END) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const localPlayerDamage = gameEvent.additionalData.report?.LocalPlayer?.DamageTaken;
		if (localPlayerDamage === this.targetDamage) {
			this.hasCorrectDamageAtEnd = true;
		}
	}
}
