import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class MinionAttackReq implements Requirement {
	// This always holds the latest minion attack, so maybe it's not suitable for all scenarios
	// I'll wait until I have a real use case to change the behavior
	private minionAttack: number;

	constructor(private readonly targetMinionAttack: number, private readonly qualifier: string) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for StandardRankedMinRankReq', rawReq);
		}
		return new MinionAttackReq(parseInt(rawReq.values[0]), rawReq.values[1]);
	}

	reset(): void {
		this.minionAttack = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.minionAttack = undefined;
	}

	isCompleted(): boolean {
		if (this.qualifier === 'AT_LEAST') {
			return this.minionAttack >= this.targetMinionAttack;
		}
		return this.minionAttack === this.targetMinionAttack;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.MINION_ON_BOARD_ATTACK_UPDATED) {
			this.handleAttackUpdatedEvent(gameEvent);
		} else if (
			gameEvent.type === GameEvent.MINION_SUMMONED ||
			gameEvent.type === GameEvent.MINION_SUMMONED_FROM_HAND ||
			gameEvent.type === GameEvent.CARD_PLAYED
		) {
			this.handleMinionSummonedEvent(gameEvent);
		}
	}

	private handleAttackUpdatedEvent(gameEvent: GameEvent) {
		const isLocalPlayer = gameEvent.localPlayer?.PlayerId === gameEvent.controllerId;
		if (isLocalPlayer) {
			this.minionAttack = gameEvent.additionalData.newAttack;
		} else {
			this.minionAttack = undefined;
		}
	}

	private handleMinionSummonedEvent(gameEvent: GameEvent) {
		const isLocalPlayer = gameEvent.localPlayer?.PlayerId === gameEvent.controllerId;
		if (isLocalPlayer) {
			const entityId = gameEvent.entityId;
			const summonedEntityInfo = gameEvent.gameState?.Player?.Board.find(
				(entity) => entity.entityId === entityId,
			);
			if (summonedEntityInfo) {
				this.minionAttack = summonedEntityInfo.attack;
			} else {
				this.minionAttack = undefined;
			}
		} else {
			this.minionAttack = undefined;
		}
	}
}
