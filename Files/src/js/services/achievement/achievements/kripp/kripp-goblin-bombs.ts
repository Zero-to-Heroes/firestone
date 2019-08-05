import { AbstractChallenge } from '../abstract-challenge';
import { GameEvent } from '../../../../models/game-event';
import { Events } from '../../../events.service';
import { GameType } from '../../../../models/enums/game-type';

export class KrippGoblinBombs extends AbstractChallenge {
	private static readonly CHALLENGE_MINIMUM_DAMAGE = 10;
	private readonly cardId: string;

	private totalBombsDamage = 0;
	private gameStartTime: number;

	constructor(achievement, events: Events) {
		super(achievement, [GameType.RANKED], events, [GameEvent.GAME_END]);
		this.cardId = achievement.cardId;
	}

	protected resetState() {
		this.totalBombsDamage = 0;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type === GameEvent.GAME_START) {
			this.gameStartTime = Date.now();
		}
		if (gameEvent.type === GameEvent.DAMAGE) {
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
		const sourceCardId = gameEvent.additionalData.sourceCardId;
		const sourceControllerId = gameEvent.additionalData.sourceControllerId;
		const localPlayer = gameEvent.localPlayer;
		const targets = gameEvent.additionalData.targets;
		if (sourceCardId === this.cardId && sourceControllerId === localPlayer.PlayerId) {
			console.log(Object.keys(targets));
			const totalDamage = Object.keys(targets)
				.map(key => targets[key])
				.map(target => target.Damage)
				.reduce((a, b) => a + b, 0);
			this.totalBombsDamage = this.totalBombsDamage + totalDamage;
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
		return this.totalBombsDamage >= KrippGoblinBombs.CHALLENGE_MINIMUM_DAMAGE;
	}
}
