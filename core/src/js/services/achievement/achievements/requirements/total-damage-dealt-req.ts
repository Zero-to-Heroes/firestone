import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { DamageGameEvent } from '../../../../models/mainwindow/game-events/damage-game-event';
import { AbstractRequirement } from './_abstract-requirement';
import { Requirement } from './_requirement';

export class TotalDamageDealtReq extends AbstractRequirement {
	private totalDamageDealt = 0;

	constructor(
		private readonly targetDamage: number,
		private readonly qualifier: string,
		private readonly sourceCardId?: string,
	) {
		super();
	}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length < 2) {
			console.error('invalid parameters for TotalDamageDealtReq', rawReq);
		}
		const sourceCardId = rawReq.values.length === 3 ? rawReq.values[2] : undefined;
		return AbstractRequirement.initialize(
			rawReq => new TotalDamageDealtReq(parseInt(rawReq.values[0]), rawReq.values[1], sourceCardId),
			rawReq,
		);
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
			this.handleEvent(gameEvent as DamageGameEvent);
		}
	}

	private handleEvent(gameEvent: DamageGameEvent) {
		const localPlayerId = gameEvent.localPlayer?.PlayerId;
		const damageSourceController = gameEvent.additionalData?.sourceControllerId;
		// We check that the cardID is indeed our cardId, in case of mirror matches for instance
		if (localPlayerId && localPlayerId === damageSourceController) {
			if (!this.sourceCardId || this.sourceCardId === gameEvent.additionalData.sourceCardId) {
				const damageDealt = Object.values(gameEvent.additionalData.targets)
					.map(target => target.Damage)
					.reduce((sum, current) => sum + current, 0);
				this.totalDamageDealt += damageDealt;
			}
		}
	}
}
