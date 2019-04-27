import { AbstractChallenge } from "../abstract-challenge";
import { GameEvent } from "../../../../models/game-event";
import { Events } from "../../../events.service";
import { GameType } from "../../../../models/enums/game-type";

export class KrippMassHysteria extends AbstractChallenge {

	private readonly cardId: string;

	private massHysteriaPlayedThisTurn: boolean = false;
    private minionsDeadThisTurn: number = 0;
    private turnStartTime: number;

	constructor(achievement, events: Events) {
		super(achievement, [GameType.RANKED], events, [GameEvent.GAME_END]);
		this.cardId = achievement.cardId;
	}

	protected resetState() {
		this.massHysteriaPlayedThisTurn = false;
		this.minionsDeadThisTurn = 0;
		this.turnStartTime = undefined;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
        if (gameEvent.type === GameEvent.TURN_START) {
			this.turnStartTime = Date.now();
			this.minionsDeadThisTurn = 0;
			this.massHysteriaPlayedThisTurn = false;
			return;
		}
		if (gameEvent.type === GameEvent.MINION_DIED) {
			this.detectMinionDied(gameEvent, callback);
			return;
		}
		if (gameEvent.type === GameEvent.CARD_PLAYED) {
			this.detectCardPlayed(gameEvent, callback);
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		return Date.now() - this.turnStartTime;
	}

	private detectMinionDied(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}
		const controllerId = gameEvent.data[1];
		const opponentPlayer = gameEvent.data[3];
		if (controllerId === opponentPlayer.PlayerId) {
			this.minionsDeadThisTurn++;
			// console.log('one more dead minion', this.minionsDeadThisTurn);
			this.callback = callback;
			this.handleCompletion();
		}
	}

	private detectCardPlayed(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}
		const cardId = gameEvent.data[0];
		const controllerId = gameEvent.data[1];
		const localPlayer = gameEvent.data[2];
		if (cardId === this.cardId && controllerId === localPlayer.PlayerId) {
			this.massHysteriaPlayedThisTurn = true;
			// console.log('mass hysteria played', this.massHysteriaPlayedThisTurn);
			this.callback = callback;
			this.handleCompletion();
		}
	}

	protected additionalCheckForCompletion(): boolean {
		// console.log('should complete?', this.minionsDeadThisTurn, this.massHysteriaPlayedThisTurn);
		return this.minionsDeadThisTurn === 7 && this.massHysteriaPlayedThisTurn;
	}
}
