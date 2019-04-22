import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';
import { AbstractChallenge } from './abstract-challenge';

export class DungeonRunProgression extends AbstractChallenge {

	private readonly heroId: string;
	private readonly dungeonStep: number;

	private currentTurnStartTime: number;
	private currentDungeonStep: number;

	constructor(achievement, scenarioId: number, events: Events) {
		super(achievement, [scenarioId], events, [GameEvent.GAME_START]);
		this.heroId = achievement.cardId;
		this.dungeonStep = achievement.step;
	}

	protected resetState() {
		this.currentTurnStartTime = undefined;
		this.currentDungeonStep = undefined;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type == GameEvent.DUNGEON_RUN_STEP) {
			this.currentDungeonStep = gameEvent.data[0];
		}

		if (this.currentDungeonStep === this.dungeonStep && gameEvent.type == GameEvent.TURN_START) {
			this.currentTurnStartTime = Date.now();
			return;
		}

		if (this.currentDungeonStep === this.dungeonStep && gameEvent.type === GameEvent.WINNER) {
			// console.log('WINNER detected', gameEvent);
			this.detectGameResultEvent(gameEvent, callback);
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		return Date.now() - this.currentTurnStartTime;
	}

	private detectGameResultEvent(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}
		let winner = gameEvent.data[0];
		let localPlayer = gameEvent.data[1];
		if (localPlayer.CardID === this.heroId && localPlayer.Id === winner.Id) {
			console.log('completed dungeon progression', this);
			this.callback = callback;
			this.handleCompletion();
		}
	}
}
