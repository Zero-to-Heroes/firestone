import { AbstractChallenge } from '../abstract-challenge';
import { GameEvent } from '../../../../models/game-event';
import { Events } from '../../../events.service';
import { GameType } from '../../../../models/enums/game-type';

export class KrippTreants extends AbstractChallenge {
	private static readonly ACHIEVEMENT_REQUIREMENT: number = 8;

	private readonly cardIds: readonly string[];

	private treantsSummoned = 0;
	private gameStartTime: number;

	constructor(achievement, events: Events) {
		super(achievement, [GameType.RANKED], events, [GameEvent.GAME_END]);
		this.cardIds = achievement.cardIds;
	}

	protected resetState() {
		this.treantsSummoned = 0;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type === GameEvent.GAME_START) {
			this.gameStartTime = Date.now();
		}
		if (gameEvent.type === GameEvent.CARD_PLAYED || gameEvent.type === GameEvent.MINION_SUMMONED) {
			this.detectMinionSummonedEvent(gameEvent, callback);
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

	private detectMinionSummonedEvent(gameEvent: GameEvent, callback: Function) {
		const cardId = gameEvent.cardId;
		const controllerId = gameEvent.controllerId;
		const localPlayer = gameEvent.localPlayer;
		if (this.cardIds.indexOf(cardId) !== -1 && controllerId === localPlayer.PlayerId) {
			this.treantsSummoned++;
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
		return this.treantsSummoned >= KrippTreants.ACHIEVEMENT_REQUIREMENT;
	}
}
