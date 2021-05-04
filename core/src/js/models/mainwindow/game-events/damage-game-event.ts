import { GameEvent } from '../../game-event';

export class DamageGameEvent extends GameEvent {
	readonly additionalData: {
		sourceEntityId: number;
		sourceCardId: string;
		sourceControllerId: number;
		targets: {
			[targetCardId: string]: {
				SourceCardId: string;
				SourceEntityId: number;
				SourceControllerId: number;
				TargetCardId: string;
				TargetEntityId: number;
				TargetControllerId: number;
				Damage: number;
				Timestamp: string;
			};
		};
	};

	public findTarget(cardId: string) {
		return Object.values(this.additionalData.targets).find((target) => target.TargetCardId === cardId);
	}
}
