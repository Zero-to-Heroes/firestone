import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { QualifierType } from './_qualifier.type';
import { Requirement } from './_requirement';

export class HealthAtEndReq implements Requirement {
	private hasCorrectHealthAtEnd: boolean;

	constructor(private readonly targetHealth: number, private readonly qualifier: QualifierType) {}

	public static create(rawReq: RawRequirement, qualifier: QualifierType = ''): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for HealthAtEndReq', rawReq);
		}
		return new HealthAtEndReq(
			parseInt(rawReq.values[0]),
			(rawReq.values.length > 1 ? rawReq.values[1] : '') as QualifierType,
		);
	}

	reset(): void {
		this.hasCorrectHealthAtEnd = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.hasCorrectHealthAtEnd = undefined;
	}

	isCompleted(): boolean {
		return this.hasCorrectHealthAtEnd;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.GAME_END) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const localPlayerMaxHealth = gameEvent.additionalData.report?.LocalPlayer?.TotalHealth;
		const localPlayerDamage = gameEvent.additionalData.report?.LocalPlayer?.DamageTaken;
		const healthDelta = localPlayerMaxHealth - localPlayerDamage;

		if (this.qualifier === '' && healthDelta === this.targetHealth) {
			this.hasCorrectHealthAtEnd = true;
		} else if (this.qualifier === 'AT_MOST' && healthDelta <= this.targetHealth) {
			this.hasCorrectHealthAtEnd = true;
		} else {
			this.hasCorrectHealthAtEnd = false;
		}
	}
}
