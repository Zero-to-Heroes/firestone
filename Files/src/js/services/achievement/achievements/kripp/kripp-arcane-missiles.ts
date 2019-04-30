import { AbstractChallenge } from "../abstract-challenge";
import { GameEvent } from "../../../../models/game-event";
import { Events } from "../../../events.service";
import { ScenarioId } from "../../../../models/scenario-id";


export class KrippArcaneMissiles extends AbstractChallenge {

    private static readonly CHALLENGE_MINIMUM_DAMAGE = 10;
	private readonly cardId: string;

    private maximumArcaneMissileDamage: number = 0;
    private turnStartTime: number;

	constructor(achievement, events: Events) {
		super(achievement, [ScenarioId.RUMBLE_RUN], events, [GameEvent.GAME_END]);
		this.cardId = achievement.cardId;
	}

	protected resetState() {
        this.turnStartTime = 0;
		this.maximumArcaneMissileDamage = 0;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
        if (gameEvent.type === GameEvent.TURN_START) {
            this.turnStartTime = Date.now();
        }
		if (gameEvent.type === GameEvent.DAMAGE) {
			this.detectDamage(gameEvent, callback);
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		return Date.now() - this.turnStartTime;
	}

	private detectDamage(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}
		const sourceCardId = gameEvent.data[0];
		const sourceControllerId = gameEvent.data[1];
		const localPlayer = gameEvent.data[3];
		const targets = gameEvent.data[2];
		if (sourceCardId == this.cardId && sourceControllerId == localPlayer.PlayerId) {
			console.log(Object.keys(targets));
			const totalDamage = Object.keys(targets)
					.map((key) => targets[key])
					.map((target) => target.Damage)
					.reduce((a, b) => a + b, 0);
			this.maximumArcaneMissileDamage = Math.max(this.maximumArcaneMissileDamage, totalDamage);
			console.log('maximum damage from arcane missiles', this.maximumArcaneMissileDamage);
			this.callback = callback;
			this.handleCompletion();
		}
	}

	protected additionalCheckForCompletion(): boolean {
		return this.maximumArcaneMissileDamage >= KrippArcaneMissiles.CHALLENGE_MINIMUM_DAMAGE;
	}
}
