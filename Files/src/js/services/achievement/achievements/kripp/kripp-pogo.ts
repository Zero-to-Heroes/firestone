import { AbstractChallenge } from "../abstract-challenge";
import { GameEvent } from "../../../../models/game-event";
import { Events } from "../../../events.service";
import { GameType } from "../../../../models/enums/game-type";


export class KrippPogo extends AbstractChallenge {

    private static readonly CHALLENGE_MINIMUM_ATTACK = 11;
	private readonly cardId: string;

    private strongestPogoAttack: number = 0;
    private gameStartTime: number;

	constructor(achievement, events: Events) {
		super(achievement, [GameType.RANKED, GameType.CASUAL], events, [GameEvent.GAME_END]);
		this.cardId = achievement.cardId;
	}

	protected resetState() {
		this.strongestPogoAttack = 0;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
        if (gameEvent.type === GameEvent.GAME_START) {
            this.gameStartTime = Date.now();
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
		return Date.now() - this.gameStartTime;
	}

	public notificationTimeout(): number {
		// Since we stop recording only when mulligan is done, it could take some time
		return 2000;
	}

	public broadcastEndOfCapture() {
		this.events.broadcast(Events.ACHIEVEMENT_RECORD_END, this.achievementId, 10000);
	}

	private detectMinionAttackUpdated(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}
		const cardId = gameEvent.data[0];
		const controllerId = gameEvent.data[1];
        const localPlayer = gameEvent.data[2];
        const newAttack = gameEvent.data[5];
		if (cardId == this.cardId && controllerId == localPlayer.PlayerId) {
			this.strongestPogoAttack = Math.max(this.strongestPogoAttack, newAttack);
		}
	}

	private detectGameResultEvent(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}
		let winner = gameEvent.data[0];
		let localPlayer = gameEvent.data[1];
		if (localPlayer.Id === winner.Id) {
			this.callback = callback;
			this.handleCompletion();
		}
	}

	protected additionalCheckForCompletion(): boolean {
		return this.strongestPogoAttack >= KrippPogo.CHALLENGE_MINIMUM_ATTACK;
	}
}
