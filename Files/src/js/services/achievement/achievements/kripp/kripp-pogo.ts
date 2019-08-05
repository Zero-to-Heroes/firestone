import { AbstractChallenge } from '../abstract-challenge';
import { GameEvent } from '../../../../models/game-event';
import { Events } from '../../../events.service';
import { GameType } from '../../../../models/enums/game-type';

export class KrippPogo extends AbstractChallenge {
	private static readonly CHALLENGE_MINIMUM_ATTACK = 11;
	private readonly cardId: string;

	private strongestPogoAttack = 0;
	private recordStartTime: number;

	constructor(achievement, events: Events) {
		super(achievement, [GameType.RANKED], events, [GameEvent.GAME_END]);
		this.cardId = achievement.cardId;
	}

	protected resetState() {
		this.recordStartTime = 0;
		this.strongestPogoAttack = 0;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type === GameEvent.TURN_START && !this.additionalCheckForCompletion()) {
			this.recordStartTime = Date.now();
		}
		if (gameEvent.type === GameEvent.MINION_ON_BOARD_ATTACK_UPDATED) {
			this.detectMinionAttackUpdated(gameEvent, callback);
			return;
		}
		if (gameEvent.type === GameEvent.WINNER) {
			this.detectGameResultEvent(gameEvent, callback);
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		return Date.now() - this.recordStartTime;
	}

	private detectMinionAttackUpdated(gameEvent: GameEvent, callback: Function) {
		const cardId = gameEvent.cardId;
		const controllerId = gameEvent.controllerId;
		const localPlayer = gameEvent.localPlayer;
		const newAttack = gameEvent.additionalData.newAttack;
		if (cardId === this.cardId && controllerId === localPlayer.PlayerId) {
			this.strongestPogoAttack = Math.max(this.strongestPogoAttack, newAttack);
		}
	}

	private detectGameResultEvent(gameEvent: GameEvent, callback: Function) {
		const winner = gameEvent.additionalData.winner;
		const localPlayer = gameEvent.localPlayer;
		if (localPlayer.Id === winner.Id) {
			this.callback = callback;
			this.handleCompletion();
		}
	}

	protected additionalCheckForCompletion(): boolean {
		return this.strongestPogoAttack >= KrippPogo.CHALLENGE_MINIMUM_ATTACK;
	}
}
