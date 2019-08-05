import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';
import { AbstractChallenge } from './abstract-challenge';

export class MonsterHuntProgression extends AbstractChallenge {
	private readonly heroId: string;
	private readonly huntStep: number;

	private currentTurnStartTime: number;
	private currentHuntStep: number;

	constructor(achievement, scenarioId: number, events: Events) {
		super(achievement, [scenarioId], events, [GameEvent.GAME_START]);
		this.heroId = achievement.cardId;
		this.huntStep = achievement.step;
	}

	protected resetState() {
		this.currentTurnStartTime = undefined;
		this.currentHuntStep = undefined;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type === GameEvent.MONSTER_HUNT_STEP) {
			this.currentHuntStep = gameEvent.additionalData.step;
		}
		if (this.currentHuntStep === this.huntStep && gameEvent.type === GameEvent.TURN_START) {
			this.currentTurnStartTime = Date.now();
			return;
		}
		if (this.currentHuntStep === this.huntStep && gameEvent.type === GameEvent.WINNER) {
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
		if (localPlayer.CardID === this.heroId && localPlayer.Id === winner.Id) {
			console.log('monster dungeon progression', this);
			this.callback = callback;
			this.handleCompletion();
		}
	}
}
