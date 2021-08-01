import { CardType } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { QualifierType } from './_qualifier.type';
import { Requirement } from './_requirement';

export class TotalMinionsSummonedReq implements Requirement {
	private summonCount = 0;

	constructor(
		private readonly targetQuantity: number,
		private readonly qualifier: QualifierType,
		private readonly cards: CardsFacadeService,
	) {}

	public static create(rawReq: RawRequirement, cards: CardsFacadeService): Requirement {
		if (!rawReq.values || rawReq.values.length !== 2) {
			console.error('invalid parameters for TotalMinionsSummonedReq', rawReq);
		}
		return new TotalMinionsSummonedReq(parseInt(rawReq.values[0]), rawReq.values[1] as QualifierType, cards);
	}

	reset(): void {
		this.summonCount = 0;
	}

	afterAchievementCompletionReset(): void {
		this.summonCount = 0;
	}

	isCompleted(): boolean {
		// console.log('is completed?', this.qualifier, this.summonCount, this.targetQuantity);
		if (this.qualifier === 'AT_LEAST') {
			return this.summonCount >= this.targetQuantity;
		} else if (this.qualifier === 'AT_MOST') {
			return this.summonCount <= this.targetQuantity;
		} else {
			console.error('invalid qualifier for total-cards-played-req', this.qualifier);
			return false;
		}
	}

	test(gameEvent: GameEvent): void {
		if (
			gameEvent.type === GameEvent.MINION_SUMMONED ||
			gameEvent.type === GameEvent.MINION_SUMMONED_FROM_HAND ||
			gameEvent.type === GameEvent.CARD_PLAYED
		) {
			this.detectCardPlayedEvent(gameEvent);
			return;
		}
	}

	private detectCardPlayedEvent(gameEvent: GameEvent) {
		const cardId = gameEvent.cardId;
		const controllerId = gameEvent.controllerId;
		const localPlayer = gameEvent.localPlayer;
		const card = this.cards.getCard(cardId);
		if (!card?.type) {
			return;
		}

		if (controllerId === localPlayer?.PlayerId && CardType[card.type?.toUpperCase()] === CardType.MINION) {
			this.summonCount = (this.summonCount || 0) + 1;
		}
	}
}
