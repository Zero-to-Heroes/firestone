import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';
import { AbstractChallenge } from './abstract-challenge';

export class MonsterHuntProgression extends AbstractChallenge {

	private readonly heroId: string;
	private readonly huntStep: number;

	private currentTurnStartTime: number;
	private currentHuntStep: number;

	constructor(achievement, scenarioId: number, events: Events) {
		super(achievement, scenarioId, events, [GameEvent.GAME_START]);
		this.heroId = achievement.cardId;
		this.huntStep = achievement.step;
	}

	protected resetState() {
		this.currentTurnStartTime = undefined;
		this.currentHuntStep = undefined;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type == GameEvent.MONSTER_HUNT_STEP) {
			this.currentHuntStep = gameEvent.data[0];
		}
		if (this.currentHuntStep === this.huntStep && gameEvent.type == GameEvent.TURN_START) {
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

	public broadcastEndOfCapture() {
		this.events.broadcast(Events.ACHIEVEMENT_RECORD_END, this.achievementId, 5000);
	}

	public notificationTimeout(): number {
		return 10000;
	}

	private detectGameResultEvent(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}
		let winner = gameEvent.data[0];
		let localPlayer = gameEvent.data[1];
		if (localPlayer.CardID === this.heroId && localPlayer.Id === winner.Id) {
			console.log('monster dungeon progression', this);
			this.callback = callback;
			this.handleCompletion();
		}
	}
}
