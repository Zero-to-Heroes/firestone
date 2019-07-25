import { AbstractChallenge } from "../abstract-challenge";
import { GameEvent } from "../../../../models/game-event";
import { Events } from "../../../events.service";
import { GameType } from "../../../../models/enums/game-type";


export class KrippFatigue extends AbstractChallenge {

    private static readonly CHALLENGE_MINIMUM_DAMAGE = 4;
	private readonly cardId: string;

    private maxFatigueDamage: number = 0;
    private gameStartTime: number;

	constructor(achievement, events: Events) {
		super(achievement, [GameType.RANKED], events, [GameEvent.GAME_END]);
		this.cardId = achievement.cardId;
	}

	protected resetState() {
		this.maxFatigueDamage = 0;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
        if (gameEvent.type === GameEvent.GAME_START) {
            this.gameStartTime = Date.now();
        }
		if (gameEvent.type === GameEvent.FATIGUE_DAMAGE) {
			this.detectDamage(gameEvent, callback);
			return;
		}
		if (gameEvent.type === GameEvent.WINNER) {
			this.detectGameResultEvent(gameEvent, callback);
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		return Date.now() - this.gameStartTime;
	}

	private detectDamage(gameEvent: GameEvent, callback: Function) {
		const playerId = gameEvent.additionalData.playerId;
        const opponentPlayer = gameEvent.opponentPlayer;
        const totalDamage = gameEvent.additionalData.fatigueDamage;
		if (playerId == opponentPlayer.Id) {
			this.maxFatigueDamage = Math.max(this.maxFatigueDamage, totalDamage);
		}
	}

	private detectGameResultEvent(gameEvent: GameEvent, callback: Function) {
		let winner = gameEvent.additionalData.winner;
		let localPlayer = gameEvent.localPlayer;
		if (localPlayer.Id === winner.Id) {
			this.callback = callback;
			this.handleCompletion();
		}
	}

	protected additionalCheckForCompletion(): boolean {
		return this.maxFatigueDamage >= KrippFatigue.CHALLENGE_MINIMUM_DAMAGE;
	}
}
