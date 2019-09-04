import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class TotalDamageDealtReq implements Requirement {
	private totalDamageDealt: number = 0;

	constructor(private readonly targetDamage: number, private readonly qualifier: string) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 2) {
			console.error('invalid parameters for TotalDamageDealtReq', rawReq);
		}
		return new TotalDamageDealtReq(parseInt(rawReq.values[0]), rawReq.values[1]);
	}

	reset(): void {
		this.totalDamageDealt = 0;
	}

	afterAchievementCompletionReset(): void {
		this.totalDamageDealt = 0;
	}

	isCompleted(): boolean {
		if (this.qualifier === 'AT_LEAST') {
			return this.totalDamageDealt >= this.targetDamage;
		}
		return this.totalDamageDealt === this.targetDamage;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.DAMAGE) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const localPlayerId = gameEvent.localPlayer.PlayerId;
		const damageSourceController = gameEvent.additionalData.sourceControllerId;
		// We check that the cardID is indeed our cardId, in case of mirror matches for instance
		if (localPlayerId === damageSourceController) {
			const damageDealt = Object.values(gameEvent.additionalData.targets)
				.map((target: any) => target.Damage)
				.reduce((sum, current) => sum + current, 0);
			this.totalDamageDealt += damageDealt;
		}
	}
}
