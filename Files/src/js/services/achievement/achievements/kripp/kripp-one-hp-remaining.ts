import { AbstractChallenge } from "../abstract-challenge";
import { GameEvent } from "../../../../models/game-event";
import { Events } from "../../../events.service";
import { GameType } from "../../../../models/enums/game-type";


export class KrippOneHpRemaining extends AbstractChallenge {

	private readonly cardId: string;

	private currentTurnStartTime: number;

	constructor(achievement, events: Events) {
		super(achievement, [GameType.RANKED], events, [GameEvent.GAME_END]);
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

	private detectGameResultEvent(gameEvent: GameEvent, callback: Function) {
		const winner = gameEvent.additionalData.winner;
		const localPlayer = gameEvent.localPlayer;
		const gameState = gameEvent.additionalData.report;
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
