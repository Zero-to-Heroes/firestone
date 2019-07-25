import { GameEvent } from '../../../models/game-event';
import { Events } from '../../events.service';
import { AbstractChallenge } from './abstract-challenge';

export class BossEncounter extends AbstractChallenge {

	private readonly cardId: string;

	private sceneChanged: boolean = false;

	constructor(achievement, scenarioIds: number[], events: Events) {
		super(achievement, scenarioIds, events, [GameEvent.GAME_END]);
		this.cardId = achievement.cardId;
		
		events.on(Events.SCENE_CHANGED).subscribe((data) => {
			if (data.data[0] === 'scene_gameplay') {
				this.sceneChanged = true;
				this.handleCompletion();
			}
		})
	}

	protected resetState() {
		this.sceneChanged = false;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type === GameEvent.OPPONENT) {
			this.detectOpponentEvent(gameEvent, callback);
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		return 100;
	}

	public notificationTimeout(): number {
		// Since we stop recording only when mulligan is done, it could take some time
		return 15000;
	}

	private detectOpponentEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.opponentPlayer.CardID === this.cardId) {
			this.callback = callback;
			// console.log('proper opponent', this);
			this.handleCompletion();
		}
	}

	protected additionalCheckForCompletion(): boolean {
		return this.sceneChanged;
	}
}
