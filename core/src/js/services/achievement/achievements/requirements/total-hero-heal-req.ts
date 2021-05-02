import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class TotalHeroHealReq implements Requirement {
	private totalHealingReceived = 0;

	constructor(private readonly targetHealing: number, private readonly qualifier: string) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 2) {
			console.error('invalid parameters for TotalHeroHealReq', rawReq);
		}
		return new TotalHeroHealReq(parseInt(rawReq.values[0]), rawReq.values[1]);
	}

	reset(): void {
		this.totalHealingReceived = 0;
	}

	afterAchievementCompletionReset(): void {
		this.totalHealingReceived = 0;
	}

	isCompleted(): boolean {
		if (this.qualifier === 'AT_LEAST') {
			return this.totalHealingReceived >= this.targetHealing;
		}
		return this.totalHealingReceived === this.targetHealing;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.HEALING) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const localPlayerCardId = gameEvent.localPlayer?.CardID;
		const localPlayerId = gameEvent.localPlayer?.PlayerId;
		const healingForLocalPlayer = gameEvent.additionalData.targets[localPlayerCardId];
		// We check that the cardID is indeed our cardId, in case of mirror matches for instance
		if (healingForLocalPlayer && healingForLocalPlayer.TargetControllerId === localPlayerId) {
			this.totalHealingReceived += healingForLocalPlayer.Healing;
		}
	}
}
