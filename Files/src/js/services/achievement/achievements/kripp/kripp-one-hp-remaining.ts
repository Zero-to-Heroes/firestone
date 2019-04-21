import { AbstractChallenge } from "../abstract-challenge";
import { GameEvent } from "../../../../models/game-event";
import { Events } from "../../../events.service";
import { GameType } from "../../../../models/enums/game-type";


export class KrippOneHpRemaining extends AbstractChallenge {

	private readonly cardId: string;

	private currentTurnStartTime: number;

	constructor(achievement, events: Events) {
		super(achievement, [GameType.RANKED, GameType.CASUAL], events, [GameEvent.GAME_END]);
		this.cardId = achievement.cardId;
	}

	protected resetState() {
		this.currentTurnStartTime = undefined;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type == GameEvent.TURN_START) {
			this.currentTurnStartTime = Date.now();
			return;
		}
		if (gameEvent.type === GameEvent.WINNER) {
			this.detectGameResultEvent(gameEvent, callback);
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		return Date.now() - this.currentTurnStartTime;
	}

	public notificationTimeout(): number {
		// Since we stop recording only when mulligan is done, it could take some time
		return 2000;
	}

	public broadcastEndOfCapture() {
		this.events.broadcast(Events.ACHIEVEMENT_RECORD_END, this.achievementId, 10000);
	}

	private detectGameResultEvent(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}
		let winner = gameEvent.data[0];
		let localPlayer = gameEvent.data[1];
		const gameState = gameEvent.data[3];
		const hpLeft = (gameState.LocalPlayer.TotalHealth - gameState.LocalPlayer.DamageTaken);
		const armorLeft = gameState.LocalPlayer.ArmorLeft;
		if (localPlayer.Id === winner.Id && armorLeft == 0 && hpLeft == 1) {
			this.callback = callback;
			this.handleCompletion();
		}
	}

	protected additionalCheckForCompletion(): boolean {
		return true;
	}
}
