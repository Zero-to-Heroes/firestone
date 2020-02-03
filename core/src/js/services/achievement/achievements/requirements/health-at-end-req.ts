import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class HealthAtEndReq implements Requirement {
	private hasCorrectHealthAtEnd: boolean;

	constructor(private readonly targetHealth: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for HealthAtEndReq', rawReq);
		}
		return new HealthAtEndReq(parseInt(rawReq.values[0]));
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
		const localPlayerMaxHealth = gameEvent.additionalData.report.LocalPlayer.TotalHealth;
		const localPlayerDamage = gameEvent.additionalData.report.LocalPlayer.DamageTaken;
		if (localPlayerMaxHealth - localPlayerDamage === this.targetHealth) {
			this.hasCorrectHealthAtEnd = true;
		}
	}
}
