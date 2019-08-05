import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';
import { AbstractChallenge } from './abstract-challenge';

export class DungeonRunProgression extends AbstractChallenge {
	// There are alterante heroes, and we don't want to have to modify the
	// achievement conditions every time a new skin is released
	private readonly baseHeroId: string;
	private readonly dungeonStep: number;

	private currentTurnStartTime: number;
	private currentDungeonStep: number;

	constructor(achievement, scenarioId: number, events: Events) {
		super(achievement, [scenarioId], events, [GameEvent.GAME_START]);
		this.baseHeroId = achievement.cardId;
		this.dungeonStep = achievement.step;
	}

	protected resetState() {
		this.currentTurnStartTime = undefined;
		this.currentDungeonStep = undefined;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type === GameEvent.DUNGEON_RUN_STEP) {
			this.currentDungeonStep = gameEvent.additionalData.step;
		}

		if (this.currentDungeonStep === this.dungeonStep && gameEvent.type === GameEvent.TURN_START) {
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
		const winner = gameEvent.additionalData.winner;
		const localPlayer = gameEvent.localPlayer;
		if (localPlayer.CardID && localPlayer.CardID.indexOf(this.baseHeroId) !== -1 && localPlayer.Id === winner.Id) {
			console.log('completed dungeon progression', this);
			this.callback = callback;
			this.handleCompletion();
		}
	}
}
