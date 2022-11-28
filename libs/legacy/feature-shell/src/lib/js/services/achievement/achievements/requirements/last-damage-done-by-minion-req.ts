import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { DamageGameEvent } from '../../../../models/mainwindow/game-events/damage-game-event';
import { Requirement } from './_requirement';

export class LastDamageDoneByMinionReq implements Requirement {
	private lastMinionThatDamagedOpponent: string;

	constructor(private readonly targetSourceMinion: string) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for LastDamageDoneByMinionReq', rawReq);
		}
		return new LastDamageDoneByMinionReq(rawReq.values[0]);
	}

	reset(): void {
		this.lastMinionThatDamagedOpponent = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.lastMinionThatDamagedOpponent = undefined;
	}

	isCompleted(): boolean {
		return this.lastMinionThatDamagedOpponent === this.targetSourceMinion;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.DAMAGE) {
			this.handleDamageEvent(gameEvent as DamageGameEvent);
		}
	}

	private handleDamageEvent(gameEvent: DamageGameEvent) {
		const opponentPlayerCardId = gameEvent.gameState?.Opponent?.Hero?.cardId ?? gameEvent.opponentPlayer?.CardID;
		const opponentPlayerId = gameEvent.opponentPlayer?.PlayerId;
		const damageForOpponentPlayer = Object.values(gameEvent.additionalData.targets).find(
			(target) => target.TargetCardId === opponentPlayerCardId,
		);
		// We check that the cardID is indeed the opponent's cardId, in case of mirror matches for instance
		if (damageForOpponentPlayer && damageForOpponentPlayer.TargetControllerId === opponentPlayerId) {
			this.lastMinionThatDamagedOpponent = gameEvent.additionalData.sourceCardId;
		}
	}
}
