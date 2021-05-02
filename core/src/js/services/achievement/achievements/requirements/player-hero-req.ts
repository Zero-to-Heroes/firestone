import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class PlayerHeroReq implements Requirement {
	private isCorrectPlayerHero: boolean;

	constructor(private readonly cardId: string) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('invalid parameters for PlayerHeroReq', rawReq);
		}
		return new PlayerHeroReq(rawReq.values[0]);
	}

	reset(): void {
		this.isCorrectPlayerHero = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isCorrectPlayerHero = undefined;
	}

	isCompleted(): boolean {
		return this.isCorrectPlayerHero;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.LOCAL_PLAYER) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const localPlayer = gameEvent.localPlayer;
		if (localPlayer?.CardID && localPlayer.CardID.indexOf(this.cardId) !== -1) {
			this.isCorrectPlayerHero = true;
		}
	}
}
