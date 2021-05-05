import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class BattlegroundsHeroSelectedReq implements Requirement {
	private isCardPlayed: boolean;

	constructor(private readonly cardId: string) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('invalid parameters for BattlegroundsHeroSelectedReq', rawReq);
		}
		return new BattlegroundsHeroSelectedReq(rawReq.values[0]);
	}

	reset(): void {
		this.isCardPlayed = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isCardPlayed = undefined;
	}

	isCompleted(): boolean {
		return this.isCardPlayed;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.BATTLEGROUNDS_HERO_SELECTED) {
			this.detectCardPlayedEvent(gameEvent);
			return;
		}
	}

	private detectCardPlayedEvent(gameEvent: GameEvent) {
		const cardId = gameEvent.cardId;
		if (cardId === this.cardId) {
			this.isCardPlayed = true;
			console.log('hero selected');
		}
	}
}
