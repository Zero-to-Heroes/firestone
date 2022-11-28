import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class FatigueDamageReq implements Requirement {
	private totalFatigueDamage = 0;

	constructor(
		private readonly targetDamage: number,
		private readonly qualifier: string,
		private readonly player: 'PLAYER' | 'OPPONENT',
	) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length <= 2) {
			console.error('invalid parameters for FatigueDamageReq', rawReq);
		}
		return new FatigueDamageReq(parseInt(rawReq.values[0]), rawReq.values[1], rawReq.values[2] as any);
	}

	reset(): void {
		this.totalFatigueDamage = 0;
	}

	afterAchievementCompletionReset(): void {
		this.totalFatigueDamage = 0;
	}

	isCompleted(): boolean {
		if (this.qualifier === 'AT_LEAST') {
			return this.totalFatigueDamage >= this.targetDamage;
		}
		return this.totalFatigueDamage === this.targetDamage;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.FATIGUE_DAMAGE) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const player = this.player === 'OPPONENT' ? gameEvent.opponentPlayer : gameEvent.localPlayer;
		if (gameEvent.additionalData.entityId === player.Id) {
			this.totalFatigueDamage += gameEvent.additionalData.fatigueDamage;
		}
	}
}
