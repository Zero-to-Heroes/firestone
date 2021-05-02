import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class TotalArmorGainReq implements Requirement {
	private totalArmorGained = 0;

	constructor(private readonly targetArmor: number, private readonly qualifier: string) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 2) {
			console.error('invalid parameters for TotalArmorGainReq', rawReq);
		}
		return new TotalArmorGainReq(parseInt(rawReq.values[0]), rawReq.values[1]);
	}

	reset(): void {
		this.totalArmorGained = 0;
	}

	afterAchievementCompletionReset(): void {
		this.totalArmorGained = 0;
	}

	isCompleted(): boolean {
		if (this.qualifier === 'AT_LEAST') {
			return this.totalArmorGained >= this.targetArmor;
		}
		return this.totalArmorGained === this.targetArmor;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.ARMOR_CHANGED) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const localPlayerId = gameEvent.localPlayer?.PlayerId;
		const controllerId = gameEvent.controllerId;
		// We only count the armor gained here, not the real armor the hero has
		if (localPlayerId === controllerId && gameEvent.additionalData.armorChange > 0) {
			this.totalArmorGained += gameEvent.additionalData.armorChange;
		}
	}
}
